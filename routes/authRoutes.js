const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const USERS_TABLE = '`LOGIN-DEMO_USERS`';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await db.query(`SELECT id FROM ${USERS_TABLE} WHERE email = ?`, [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertResult = await db.query(
      `INSERT INTO ${USERS_TABLE} (name, email, password_hash) VALUES (?, ?, ?)`,
      [name, email, passwordHash]
    );

    const users = await db.query(`SELECT id, name, email FROM ${USERS_TABLE} WHERE id = ?`, [
      insertResult.insertId,
    ]);
    const user = users[0];
    return res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await db.query(
      `SELECT id, name, email, password_hash FROM ${USERS_TABLE} WHERE email = ?`,
      [email]
    );

    if (!result.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, created_at FROM ${USERS_TABLE} WHERE id = ?`,
      [req.user.id]
    );

    if (!result.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: result[0] });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
