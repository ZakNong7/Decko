const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const {
  requireWorkspaceMember,
  requireBoardMember,
  requireListAccess,
  requireCardAccess,
  requireCanEditCardsBatch,
  requireLabelAccess,
  requirePermission,
  canEditCards,
  canManageLists,
  canManageBoard,
} = require("../middleware/permissions");

const LEGACY_PRIORITY_MAP = {
  High: "Tinggi",
  Medium: "Sedang",
  Low: "Rendah",
};

async function insertCardWithPriorityFallback(values) {
  const insertQuery =
    "INSERT INTO cards (list_id, title, description, order_index, created_by, deadline, priority, color) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";

  try {
    return await db.query(insertQuery, values);
  } catch (err) {
    if (err.code === "23514" && err.constraint === "cards_priority_check") {
      const legacyPriority = LEGACY_PRIORITY_MAP[values[6]] || values[6];
      return db.query(insertQuery, [
        ...values.slice(0, 6),
        legacyPriority,
        values[7],
      ]);
    }
    throw err;
  }
}

// Create List
router.post(
  "/list",
  authenticateToken,
  requireBoardMember((req) => req.body.boardId),
  requirePermission(canManageLists),
  async (req, res) => {
    const { boardId, name, orderIndex, color, isFinal } = req.body;
    try {
      const newList = await db.query(
        "INSERT INTO lists (board_id, name, order_index, color, is_final) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [boardId, name, orderIndex || 0, color || "#a0a0a0", Boolean(isFinal)],
      );
      res.status(201).json(newList.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Create Card
router.post(
  "/card",
  authenticateToken,
  requireListAccess(canEditCards),
  async (req, res) => {
    const {
      listId,
      title,
      description,
      orderIndex,
      deadline,
      priority,
      color,
      labelIds = [],
      assigneeIds = [],
    } = req.body;
    try {
      const normalizedDeadline = deadline === "" ? null : deadline || null;
      const values = [
        listId,
        title,
        description || "",
        orderIndex || 0,
        req.user.id,
        normalizedDeadline,
        priority || "Medium",
        color || "#0095ff",
      ];

      const newCard = await insertCardWithPriorityFallback(values);

      for (const labelId of labelIds) {
        await db.query(
          "INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [newCard.rows[0].id, labelId],
        );
      }

      if (
        assigneeIds.length > 0 &&
        !canManageBoard(req.listContext?.role || req.userRole)
      ) {
        return res
          .status(403)
          .json({ message: "Hanya Owner/Admin yang dapat menugaskan anggota" });
      }

      for (const assigneeId of assigneeIds) {
        await db.query(
          "INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [newCard.rows[0].id, assigneeId],
        );
      }

      res.status(201).json(newCard.rows[0]);
      const io = req.app.get("io");
      if (io && req.listContext) {
        io.to(`board-${req.listContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Card
router.put(
  "/card/:id",
  authenticateToken,
  requireCardAccess(canEditCards),
  async (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      list_id,
      order_index,
      deadline,
      priority,
      status,
      color,
      labelIds,
      assigneeIds,
    } = req.body;
    try {
      const clearDeadline = deadline === "";
      const normalizedDeadline = clearDeadline ? null : deadline;
      const normalizedPriority =
        priority && LEGACY_PRIORITY_MAP[priority] ? priority : priority;

      const result = await db.query(
        `UPDATE cards SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description),
        list_id = COALESCE($3, list_id),
        order_index = COALESCE($4, order_index),
        deadline = CASE WHEN $10 THEN NULL ELSE COALESCE($5, deadline) END,
        priority = COALESCE($6, priority),
        status = COALESCE($7, status),
        color = COALESCE($8, color)
       WHERE id = $9 RETURNING *`,
        [
          title,
          description,
          list_id,
          order_index,
          normalizedDeadline,
          normalizedPriority,
          status,
          color,
          id,
          clearDeadline,
        ],
      );

      if (Array.isArray(labelIds)) {
        await db.query("DELETE FROM card_labels WHERE card_id = $1", [id]);
        for (const labelId of labelIds) {
          await db.query(
            "INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, labelId],
          );
        }
      }

      if (Array.isArray(assigneeIds)) {
        if (!canManageBoard(req.userRole)) {
          return res.status(403).json({
            message: "Hanya Owner/Admin yang dapat mengubah penugasan anggota",
          });
        }
        await db.query("DELETE FROM card_members WHERE card_id = $1", [id]);
        for (const assigneeId of assigneeIds) {
          await db.query(
            "INSERT INTO card_members (card_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, assigneeId],
          );
        }
      }

      res.json(result.rows[0]);
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

// Delete Card
router.delete(
  "/card/:id",
  authenticateToken,
  requireCardAccess(canEditCards),
  async (req, res) => {
    try {
      await db.query("DELETE FROM cards WHERE id = $1", [req.params.id]);
      res.json({ message: "Card deleted" });
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

// Batch Update Cards (for reordering)
router.put(
  "/batch-update",
  authenticateToken,
  requireCanEditCardsBatch,
  async (req, res) => {
    const { cards } = req.body;
    try {
      await db.query("BEGIN");
      for (const card of cards) {
        await db.query(
          "UPDATE cards SET list_id = $1, order_index = $2 WHERE id = $3",
          [card.list_id, card.order_index, card.id],
        );
      }
      await db.query("COMMIT");
      res.json({ message: "Cards updated" });
    } catch (err) {
      await db.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update List
router.put(
  "/list/:id",
  authenticateToken,
  requireListAccess(canManageLists),
  async (req, res) => {
    const { name, color, isFinal } = req.body;
    try {
      await db.query(
        "UPDATE lists SET name = $1, color = $2, is_final = $3 WHERE id = $4",
        [name, color, Boolean(isFinal), req.params.id],
      );
      res.json({ message: "List updated" });
      const io = req.app.get("io");
      if (io && req.listContext) {
        io.to(`board-${req.listContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete List
router.delete(
  "/list/:id",
  authenticateToken,
  requireListAccess(canManageLists),
  async (req, res) => {
    try {
      await db.query("DELETE FROM lists WHERE id = $1", [req.params.id]);
      res.json({ message: "List deleted" });
      const io = req.app.get("io");
      if (io && req.listContext) {
        io.to(`board-${req.listContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Labels
router.get(
  "/labels/workspace/:workspaceId",
  authenticateToken,
  requireWorkspaceMember("workspaceId"),
  async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM labels WHERE workspace_id = $1 ORDER BY id DESC",
        [req.params.workspaceId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.post(
  "/labels",
  authenticateToken,
  requireWorkspaceMember(),
  requirePermission(canEditCards),
  async (req, res) => {
    const { workspaceId, name, color } = req.body;
    try {
      const result = await db.query(
        "INSERT INTO labels (workspace_id, name, color) VALUES ($1, $2, $3) RETURNING *",
        [workspaceId, name, color || "#0095ff"],
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.delete(
  "/labels/:id",
  authenticateToken,
  requireLabelAccess(canEditCards),
  async (req, res) => {
    try {
      await db.query("DELETE FROM labels WHERE id = $1", [req.params.id]);
      res.json({ message: "Label deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
