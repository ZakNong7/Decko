const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// ====================================================================
// MODUL A - AHMAD ZAKKY NURFAUZAN (714250028)
// DOMAIN: External Resource Link Attachments (Tautan Sumber Daya Eksternal)
// ====================================================================

// GET /api/cards/:cardId/attachments - Mengambil semua lampiran tautan pada kartu
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const result = await db.query(
      `SELECT a.*, u.username as creator_username, u.full_name as creator_name
       FROM card_attachments a
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.card_id = $1
       ORDER BY a.created_at ASC`,
      [cardId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching card attachments:', err);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// POST /api/cards/:cardId/attachments - Menambah tautan eksternal baru (GDrive, Figma, GitHub, dll.)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title, url, provider } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    // Validasi Regex URL
    const urlPattern = /^(https?:\/\/)([\w.-]+)+(:\d+)?(\/.*)?$/i;
    if (!urlPattern.test(url.trim())) {
      return res.status(400).json({ error: 'Format URL tautan tidak valid' });
    }

    // Deteksi provider otomatis jika tidak disertakan
    let detectedProvider = provider || 'link';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('drive.google.com')) detectedProvider = 'gdrive';
    else if (lowerUrl.includes('figma.com')) detectedProvider = 'figma';
    else if (lowerUrl.includes('github.com')) detectedProvider = 'github';
    else if (lowerUrl.includes('dropbox.com')) detectedProvider = 'dropbox';

    const insertResult = await db.query(
      `INSERT INTO card_attachments (card_id, title, url, provider, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cardId, title.trim(), url.trim(), detectedProvider, req.user.id]
    );

    const attachment = insertResult.rows[0];

    // Emit Socket.io ke room board jika io tersedia
    const io = req.app.get('io');
    if (io) {
      // Ambil board_id dari card
      const cardRes = await db.query(
        `SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1`,
        [cardId]
      );
      if (cardRes.rows.length > 0) {
        io.to(`board-${cardRes.rows[0].board_id}`).emit('card-attachment-added', {
          cardId: Number(cardId),
          attachment,
        });
      }
    }

    res.status(201).json(attachment);
  } catch (err) {
    console.error('Error creating card attachment:', err);
    res.status(500).json({ error: 'Failed to create attachment' });
  }
});

// DELETE /api/cards/:cardId/attachments/:id - Menghapus tautan eksternal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { cardId, id } = req.params;
    const delResult = await db.query(
      `DELETE FROM card_attachments WHERE id = $1 AND card_id = $2 RETURNING *`,
      [id, cardId]
    );

    if (delResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const io = req.app.get('io');
    if (io) {
      const cardRes = await db.query(
        `SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1`,
        [cardId]
      );
      if (cardRes.rows.length > 0) {
        io.to(`board-${cardRes.rows[0].board_id}`).emit('card-attachment-deleted', {
          cardId: Number(cardId),
          attachmentId: Number(id),
        });
      }
    }

    res.json({ message: 'Attachment deleted successfully', attachment: delResult.rows[0] });
  } catch (err) {
    console.error('Error deleting card attachment:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

module.exports = router;
