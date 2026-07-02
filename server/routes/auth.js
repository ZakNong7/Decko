const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateRegisterInput({ username, email, password }) {
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
  const { username, email, password, fullName } = req.body;

  const validationError = validateRegisterInput({ username, email, password });
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

module.exports = router;
