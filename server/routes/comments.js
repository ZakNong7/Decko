const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const {
  requireCardAccess,
  canEditCards,
} = require("../middleware/permissions");
const { normalizeRole, hasRole, ROLES } = require("../constants/roles");

// Get comments for a card — any workspace member
router.get(
  "/:cardId",
  authenticateToken,
  requireCardAccess(),
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT c.*, u.username, u.full_name 
       FROM comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.card_id = $1 ORDER BY c.created_at ASC`,
        [req.params.cardId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Post comment — Owner, Admin, Member
router.post(
  "/",
  authenticateToken,
  requireCardAccess(canEditCards),
  async (req, res) => {
    const { cardId, content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "Comment content required" });
    }
    try {
      const result = await db.query(
        "INSERT INTO comments (card_id, user_id, content) VALUES ($1, $2, $3) RETURNING *",
        [cardId, req.user.id, content.trim()],
      );
      res.status(201).json(result.rows[0]);
      const io = req.app.get("io");
      if (io && req.cardContext) {
        io.to(`board-${req.cardContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete comment
router.delete("/:commentId", authenticateToken, async (req, res) => {
  try {
    const commentResult = await db.query(
      `SELECT c.id, c.user_id, w.owner_id, wm.role, b.id AS board_id
       FROM comments c
       JOIN cards card ON card.id = c.card_id
       JOIN lists l ON l.id = card.list_id
       JOIN boards b ON b.id = l.board_id
       JOIN workspaces w ON w.id = b.workspace_id
       LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = $2
       WHERE c.id = $1`,
      [req.params.commentId, req.user.id],
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = commentResult.rows[0];
    const role = normalizeRole(comment.role);
    const canDelete =
      comment.user_id === req.user.id ||
      comment.owner_id === req.user.id ||
      hasRole(role, [ROLES.ADMIN, ROLES.OWNER]);

    if (!canDelete) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.query("DELETE FROM comments WHERE id = $1", [
      req.params.commentId,
    ]);
    res.json({ message: "Comment deleted" });
    const io = req.app.get("io");
    if (io && comment.board_id) {
      io.to(`board-${comment.board_id}`).emit("card-update");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
