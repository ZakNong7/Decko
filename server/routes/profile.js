const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// ====================================================================
// MODUL B - IZAT IBRAHIMOVIC IRAWAN (714250024)
// DOMAIN: User Profile Management, Adaptive Theme, & Personal Metrics Dashboard
// ====================================================================

// GET /api/profile - Ambil data profil pengguna yang login
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, username, email, full_name, bio, phone, avatar_url,
              theme_preference, is_email_verified, created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userRes.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profile - Update identitas profil (nama, bio, no telp, username)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { full_name, bio, phone, username } = req.body;

    // Jika username diubah, pastikan tidak duplikat dengan user lain
    if (username) {
      const checkUser = await db.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2`,
        [username.trim(), req.user.id]
      );
      if (checkUser.rows.length > 0) {
        return res.status(409).json({ error: 'Username sudah digunakan oleh akun lain' });
      }
    }

    const updateRes = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           bio = COALESCE($2, bio),
           phone = COALESCE($3, phone),
           username = COALESCE($4, username)
       WHERE id = $5
       RETURNING id, username, email, full_name, bio, phone, avatar_url, theme_preference, is_email_verified`,
      [
        full_name !== undefined ? full_name.trim() : null,
        bio !== undefined ? bio.trim() : null,
        phone !== undefined ? phone.trim() : null,
        username !== undefined ? username.trim() : null,
        req.user.id,
      ]
    );

    res.json(updateRes.rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/profile/theme - Simpan preferensi tema (dark, light, auto)
router.patch('/theme', authenticateToken, async (req, res) => {
  try {
    const { theme } = req.body;
    const validThemes = ['dark', 'light', 'auto'];
    if (!theme || !validThemes.includes(theme.toLowerCase())) {
      return res.status(400).json({ error: 'Theme must be dark, light, or auto' });
    }

    const updateRes = await db.query(
      `UPDATE users SET theme_preference = $1 WHERE id = $2 RETURNING id, theme_preference`,
      [theme.toLowerCase(), req.user.id]
    );

    res.json(updateRes.rows[0]);
  } catch (err) {
    console.error('Error updating theme preference:', err);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// GET /api/profile/metrics - Personal Productivity Dashboard Metrics (Metrik Performa Per-Akun)
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Total Tugas Ditugaskan ke User (Assigned Tasks)
    const assignedRes = await db.query(
      `SELECT COUNT(DISTINCT cm.card_id)::int as total_assigned
       FROM card_members cm
       JOIN cards c ON cm.card_id = c.id
       WHERE cm.user_id = $1 AND c.is_archived = false`,
      [userId]
    );

    // 2. Tugas Selesai Milik User (Completed Tasks: list.is_final = true)
    const completedRes = await db.query(
      `SELECT COUNT(DISTINCT cm.card_id)::int as total_completed
       FROM card_members cm
       JOIN cards c ON cm.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE cm.user_id = $1 AND l.is_final = true AND c.is_archived = false`,
      [userId]
    );

    // 3. Tugas Overdue Milik User (Deadline telah lewat & list.is_final = false)
    const overdueRes = await db.query(
      `SELECT COUNT(DISTINCT cm.card_id)::int as total_overdue
       FROM card_members cm
       JOIN cards c ON cm.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE cm.user_id = $1 AND l.is_final = false
         AND c.deadline IS NOT NULL AND c.deadline < CURRENT_TIMESTAMP
         AND c.is_archived = false`,
      [userId]
    );

    // 4. Personal Velocity (Tugas selesai 4 minggu terakhir per minggu)
    const velocityRes = await db.query(
      `SELECT to_char(date_trunc('week', c.created_at), 'YYYY-"W"IW') as week_label,
              COUNT(DISTINCT c.id)::int as completed_count
       FROM card_members cm
       JOIN cards c ON cm.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE cm.user_id = $1 AND l.is_final = true AND c.is_archived = false
         AND c.created_at >= NOW() - INTERVAL '4 weeks'
       GROUP BY week_label
       ORDER BY week_label ASC`,
      [userId]
    );

    const totalAssigned = assignedRes.rows[0].total_assigned || 0;
    const totalCompleted = completedRes.rows[0].total_completed || 0;
    const totalOverdue = overdueRes.rows[0].total_overdue || 0;
    const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

    res.json({
      totalAssigned,
      totalCompleted,
      totalOverdue,
      completionRate,
      velocity: velocityRes.rows,
    });
  } catch (err) {
    console.error('Error fetching personal metrics:', err);
    res.status(500).json({ error: 'Failed to fetch personal metrics' });
  }
});

// POST /api/profile/deactivate - Opsi deaktivasi akun mandiri
router.post('/deactivate', authenticateToken, async (req, res) => {
  try {
    await db.query(`UPDATE users SET is_active = false WHERE id = $1`, [req.user.id]);
    res.json({ message: 'Akun Anda berhasil dinonaktifkan' });
  } catch (err) {
    console.error('Error deactivating account:', err);
    res.status(500).json({ error: 'Failed to deactivate account' });
  }
});

module.exports = router;
