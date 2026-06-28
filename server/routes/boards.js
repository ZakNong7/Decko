const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const {
  ROLES,
  requireWorkspaceMember,
  requireWorkspaceRoles,
  requireBoardMember,
  requireListAccess,
  canManageLists,
  canManageBoard,
  requirePermission,
} = require("../middleware/permissions");

// Get all boards in a workspace
router.get(
  "/workspace/:workspaceId",
  authenticateToken,
  requireWorkspaceMember("workspaceId"),
  async (req, res) => {
    const { workspaceId } = req.params;
    try {
      const result = await db.query(
        "SELECT * FROM boards WHERE workspace_id = $1 ORDER BY id",
        [workspaceId],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Add List
router.post(
  "/list",
  authenticateToken,
  requireBoardMember((req) => req.body.boardId),
  requirePermission(canManageLists),
  async (req, res) => {
    const { boardId, name, orderIndex, color, isFinal } = req.body;
    try {
      const result = await db.query(
        "INSERT INTO lists (board_id, name, order_index, color, is_final) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          parseInt(boardId, 10),
          name,
          orderIndex || 0,
          color || "#a0a0a0",
          Boolean(isFinal),
        ],
      );
      res.json(result.rows[0]);
      const io = req.app.get("io");
      if (io) io.to(`board-${boardId}`).emit("card-update");
    } catch (err) {
      console.error("Error adding list:", err);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  },
);

// Update list
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
      console.error("Error updating list:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete list
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
      console.error("Error deleting list:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Create board
router.post(
  "/",
  authenticateToken,
  requireWorkspaceRoles([ROLES.OWNER, ROLES.ADMIN]),
  async (req, res) => {
    const { workspaceId, name, description, icon } = req.body;
    const slugId = Math.random().toString(36).substring(2, 12);
    try {
      const newBoard = await db.query(
        "INSERT INTO boards (workspace_id, name, description, icon, slug_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [workspaceId, name, description || "", icon || "", slugId],
      );
      res.status(201).json(newBoard.rows[0]);
    } catch (err) {
      console.error("Error creating board:", err);
      res.status(500).json({ message: "Server error: " + err.message });
    }
  },
);

// Get board details (with lists and cards)
router.get(
  "/:id",
  authenticateToken,
  requireBoardMember((req) => req.params.id),
  async (req, res) => {
    const { id } = req.params;
    try {
      const boardResult = await db.query(
        `SELECT b.*, w.name as workspace_name, w.invitation_code as workspace_invite_code, 
       wm.role as user_role
       FROM boards b 
       JOIN workspaces w ON b.workspace_id = w.id 
       JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $2
       WHERE b.slug_id = $1 OR b.id::text = $1`,
        [id, req.user.id],
      );

      if (boardResult.rows.length === 0) {
        return res.status(404).json({ message: "Board not found" });
      }

      const board = boardResult.rows[0];
      const members = await db.query(
        `SELECT u.id, u.username, u.full_name, wm.role 
       FROM workspace_members wm 
       JOIN users u ON wm.user_id = u.id 
       WHERE wm.workspace_id = $1
       ORDER BY
         CASE wm.role
           WHEN 'Owner' THEN 1
           WHEN 'Admin' THEN 2
           WHEN 'Member' THEN 3
           WHEN 'Observer' THEN 4
           ELSE 5
         END,
         wm.joined_at,
         u.id`,
        [board.workspace_id],
      );

      const labels = await db.query(
        "SELECT id, workspace_id, name, color FROM labels WHERE workspace_id = $1 ORDER BY id DESC",
        [board.workspace_id],
      );

      const lists = await db.query(
        "SELECT * FROM lists WHERE board_id = $1 ORDER BY order_index",
        [board.id],
      );

      const boardData = {
        ...board,
        labels: labels.rows,
        members: members.rows,
        lists: await Promise.all(
          lists.rows.map(async (list) => {
            const cards = await db.query(
              `SELECT c.*, 
            $2::integer AS workspace_id,
            $3::text AS list_name,
            COALESCE((SELECT COUNT(*) FROM comments cm WHERE cm.card_id = c.id), 0) AS comment_count,
            COALESCE((SELECT json_agg(json_build_object('id', u.id, 'username', u.username, 'full_name', u.full_name) ORDER BY
                CASE wm3.role
                  WHEN 'Owner' THEN 1
                  WHEN 'Admin' THEN 2
                  WHEN 'Member' THEN 3
                  WHEN 'Observer' THEN 4
                  ELSE 5
                END,
                wm3.joined_at,
                u.id)
              FROM card_members c_m
              JOIN users u ON u.id = c_m.user_id
              LEFT JOIN workspace_members wm3 ON wm3.user_id = u.id AND wm3.workspace_id = $2
              WHERE c_m.card_id = c.id), '[]'::json) AS assignees,
            COALESCE((SELECT json_agg(json_build_object('id', l.id, 'name', l.name, 'color', l.color) ORDER BY l.id)
              FROM card_labels cl
              JOIN labels l ON l.id = cl.label_id
              WHERE cl.card_id = c.id), '[]'::json) AS labels
           FROM cards c
           WHERE c.list_id = $1
           ORDER BY CASE WHEN c.priority = 'High' THEN 0 WHEN c.priority = 'Medium' THEN 1 ELSE 2 END, c.order_index, c.id`,
              [list.id, board.workspace_id, list.name],
            );
            return { ...list, cards: cards.rows };
          }),
        ),
      };

      res.json(boardData);
    } catch (err) {
      console.error("Error fetching board details:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update board name
router.put(
  "/:id",
  authenticateToken,
  requireBoardMember((req) => req.params.id),
  requirePermission(canManageBoard),
  async (req, res) => {
    try {
      const result = await db.query(
        "UPDATE boards SET name = $1 WHERE slug_id = $2 OR id::text = $2 RETURNING id",
        [req.body.name, req.params.id],
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json({ message: "Board updated" });
      const io = req.app.get("io");
      if (io && req.boardContext) {
        io.to(`board-${req.boardContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      console.error("Error updating board:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Delete board
router.delete(
  "/:id",
  authenticateToken,
  requireBoardMember((req) => req.params.id),
  requirePermission(canManageBoard),
  async (req, res) => {
    try {
      const result = await db.query(
        "DELETE FROM boards WHERE slug_id = $1 OR id::text = $1 RETURNING id",
        [req.params.id],
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json({ message: "Board deleted" });
      const io = req.app.get("io");
      if (io && req.boardContext) {
        io.to(`board-${req.boardContext.boardId}`).emit("card-update");
      }
    } catch (err) {
      console.error("Error deleting board:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
