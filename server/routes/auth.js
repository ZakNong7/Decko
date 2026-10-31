const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateRegisterInput({ username, email, password, confirmPassword }) {
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return 'Kata sandi dan konfirmasi kata sandi tidak cocok';
  }
  if (!username || String(username).trim().length < 3) {
    return 'Username minimal harus 3 karakter';
  }
  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    return 'Email tidak valid';
  }
  if (!password || String(password).length < 8) {
    return 'Password harus terdiri minimal 8 karakter, huruf kapital, angka, dan simbol unik';
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!hasUppercase || !hasNumber || !hasSymbol) {
    return 'Password harus terdiri minimal 8 karakter, huruf kapital, angka, dan simbol unik';
  }
  return null;
}

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword, fullName } = req.body;

  const validationError = validateRegisterInput({ username, email, password, confirmPassword });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const trimmedUsername = String(username).trim();
    const trimmedEmail = String(email).trim().toLowerCase();

    const userExists = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [trimmedUsername, trimmedEmail],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.query(
      'INSERT INTO users (username, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, full_name',
      [trimmedUsername, trimmedEmail, hashedPassword, fullName?.trim() || null],
    );

    const token = jwt.sign(
      { id: newUser.rows[0].id, username: newUser.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [
      String(username).trim(),
    ]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (user.is_active === false) {
      // Check if temporary ban has expired
      if (user.ban_expires_at && new Date() > new Date(user.ban_expires_at)) {
        await db.query(
          "UPDATE users SET is_active = true, ban_reason = NULL, ban_expires_at = NULL WHERE id = $1",
          [user.id]
        );
        user.is_active = true;
      } else {
        let remainingMsg = "Selamanya (Permanen)";
        if (user.ban_expires_at) {
          const msLeft = new Date(user.ban_expires_at).getTime() - new Date().getTime();
          const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
          const daysLeft = Math.floor(hoursLeft / 24);
          const remHours = hoursLeft % 24;
          remainingMsg = daysLeft > 0 ? `${daysLeft} Hari ${remHours} Jam` : `${hoursLeft} Jam`;
        }
        const reasonStr = user.ban_reason ? `Alasan: "${user.ban_reason}". ` : "";
        return res.status(403).json({
          message: `Akun Anda sedang dinonaktifkan oleh Administrator. ${reasonStr}Sisa Waktu Ban: ${remainingMsg}.`
        });
      }
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// System Stats Endpoint (Admin Decko Analytics & Users List)
router.get('/system-stats', authenticateToken, async (req, res) => {
  const superadmins = ['admin'];
  if (!req.user || !superadmins.includes(req.user.username?.toLowerCase())) {
    return res.status(403).json({ message: 'Akses khusus Super Admin' });
  }
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const totalWorkspaces = await db.query('SELECT COUNT(*) FROM workspaces');
    const totalBoards = await db.query('SELECT COUNT(*) FROM boards');
    const totalCards = await db.query('SELECT COUNT(*) FROM cards WHERE COALESCE(is_archived, false) = false');

    const usersList = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, COALESCE(u.is_active, true) AS is_active, u.ban_reason, u.ban_expires_at, u.created_at,
        (SELECT COUNT(*) FROM workspace_members wm WHERE wm.user_id = u.id) as workspace_count,
        (SELECT COUNT(*) FROM workspaces w WHERE w.owner_id = u.id) as owned_workspace_count
       FROM users u
       ORDER BY u.id ASC`
    );

    const allWorkspacesList = await db.query(
      `SELECT w.id, w.name, w.description, w.invitation_code, w.created_at, u.username AS owner_name, u.email AS owner_email,
        (SELECT COUNT(*) FROM boards b WHERE b.workspace_id = w.id) as board_count,
        (SELECT COUNT(*) FROM workspace_members wm WHERE wm.workspace_id = w.id) as member_count
       FROM workspaces w
       LEFT JOIN users u ON u.id = w.owner_id
       ORDER BY w.id DESC`
    );

    res.json({
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count) || 0,
        totalWorkspaces: parseInt(totalWorkspaces.rows[0].count) || 0,
        totalBoards: parseInt(totalBoards.rows[0].count) || 0,
        totalCards: parseInt(totalCards.rows[0].count) || 0,
      },
      users: usersList.rows,
      workspaces: allWorkspacesList.rows,
    });
  } catch (err) {
    console.error("Error fetching system stats:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Suspend / Unban User Account (Super Admin Only)
router.put('/users/:id/suspend', authenticateToken, async (req, res) => {
  const superadmins = ['admin'];
  if (!req.user || !superadmins.includes(req.user.username?.toLowerCase())) {
    return res.status(403).json({ message: 'Akses khusus Super Admin' });
  }

  const { isActive, banReason, durationDays } = req.body;
  const targetUserId = req.params.id;

  try {
    const userRes = await db.query('SELECT username FROM users WHERE id = $1', [targetUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    if (userRes.rows[0].username.toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Akun Super Admin utama tidak dapat dinonaktifkan' });
    }

    if (isActive) {
      // Unban account
      await db.query(
        "UPDATE users SET is_active = true, ban_reason = NULL, ban_expires_at = NULL WHERE id = $1",
        [targetUserId]
      );
      return res.json({ message: "Akun berhasil diaktifkan kembali" });
    } else {
      // Suspend account
      let expiresAt = null;
      const days = parseInt(durationDays);
      if (!isNaN(days) && days > 0) {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      await db.query(
        "UPDATE users SET is_active = false, ban_reason = $1, ban_expires_at = $2 WHERE id = $3",
        [banReason || "Pelanggaran Aturan Komunitas", expiresAt, targetUserId]
      );
      return res.json({ message: "Akun berhasil dinonaktifkan", ban_expires_at: expiresAt });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User submits a violation report to Super Admin
router.post('/reports', authenticateToken, async (req, res) => {
  const { targetUsername, reason, description } = req.body;
  if (!targetUsername || !reason) {
    return res.status(400).json({ message: 'Username target dan alasan wajib diisi' });
  }

  try {
    await db.query(
      'INSERT INTO reports (reporter_id, target_username, reason, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, targetUsername.trim(), reason, description || '']
    );
    res.status(201).json({ message: 'Laporan berhasil dikirim ke Administrator' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Super Admin fetches all violation reports
router.get('/reports', authenticateToken, async (req, res) => {
  const superadmins = ['admin'];
  if (!req.user || !superadmins.includes(req.user.username?.toLowerCase())) {
    return res.status(403).json({ message: 'Akses khusus Super Admin' });
  }

  try {
    const result = await db.query(
      `SELECT r.*, u.username AS reporter_username, u.email AS reporter_email
       FROM reports r
       LEFT JOIN users u ON u.id = r.reporter_id
       ORDER BY r.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Super Admin resolves a report
router.put('/reports/:id/resolve', authenticateToken, async (req, res) => {
  const superadmins = ['admin'];
  if (!req.user || !superadmins.includes(req.user.username?.toLowerCase())) {
    return res.status(403).json({ message: 'Akses khusus Super Admin' });
  }

  try {
    await db.query("UPDATE reports SET status = 'Selesai' WHERE id = $1", [req.params.id]);
    res.json({ message: 'Laporan ditandai selesai' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Super Admin permanently deletes a user account
router.delete('/users/:id/permanent', authenticateToken, async (req, res) => {
  const superadmins = ['admin'];
  if (!req.user || !superadmins.includes(req.user.username?.toLowerCase())) {
    return res.status(403).json({ message: 'Akses khusus Super Admin' });
  }

  const targetUserId = req.params.id;
  try {
    // Prevent admin from deleting themselves
    const targetUserRes = await db.query('SELECT username FROM users WHERE id = $1', [targetUserId]);
    if (targetUserRes.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    if (targetUserRes.rows[0].username.toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Akun Super Admin utama tidak dapat dihapus' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [targetUserId]);
    res.json({ message: 'Akun pengguna berhasil dihapus permanen' });
  } catch (err) {
    console.error('Error deleting user permanently:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
