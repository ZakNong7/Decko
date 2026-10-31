const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// ====================================================================
// MODUL B - IZAT IBRAHIMOVIC IRAWAN (714250024)
// DOMAIN: Task Automation (Recurring Tasks / Tugas Berkala)
// ====================================================================

// GET /api/recurring-tasks/board/:boardId - Daftar tugas berkala di suatu board
router.get('/board/:boardId', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const result = await db.query(
      `SELECT r.*, l.name as list_name, u.username as creator_username
       FROM recurring_tasks r
       LEFT JOIN lists l ON r.list_id = l.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.board_id = $1
       ORDER BY r.created_at DESC`,
      [boardId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching recurring tasks:', err);
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
});

// POST /api/recurring-tasks - Membuat jadwal tugas berkala baru
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { board_id, list_id, title, description, frequency } = req.body;

    if (!board_id || !list_id || !title || !frequency) {
      return res.status(400).json({ error: 'board_id, list_id, title, and frequency are required' });
    }

    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency.toLowerCase())) {
      return res.status(400).json({ error: 'Frequency must be daily, weekly, or monthly' });
    }

    const insertResult = await db.query(
      `INSERT INTO recurring_tasks (board_id, list_id, title, description, frequency, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [board_id, list_id, title.trim(), description || '', frequency.toLowerCase(), req.user.id]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error('Error creating recurring task:', err);
    res.status(500).json({ error: 'Failed to create recurring task' });
  }
});

// PATCH /api/recurring-tasks/:id/toggle - Mengaktifkan / menonaktifkan status tugas berkala
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE recurring_tasks
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling recurring task:', err);
    res.status(500).json({ error: 'Failed to toggle recurring task' });
  }
});

// DELETE /api/recurring-tasks/:id - Menghapus jadwal tugas berkala
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM recurring_tasks WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurring task not found' });
    }

    res.json({ message: 'Recurring task deleted successfully' });
  } catch (err) {
    console.error('Error deleting recurring task:', err);
    res.status(500).json({ error: 'Failed to delete recurring task' });
  }
});

module.exports = router;
