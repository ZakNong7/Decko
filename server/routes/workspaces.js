const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const {
  ROLES,
  normalizeRole,
  hasRole,
  isOwner,
} = require("../constants/roles");
const {
  getMembership,
  requireWorkspaceMember,
  requireWorkspaceRoles,
} = require("../middleware/permissions");

function generateInvitationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get all workspaces for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT w.*, wm.role,
        (SELECT COUNT(*) FROM boards b WHERE b.workspace_id = w.id) as board_count,
        (SELECT COUNT(*) FROM lists l WHERE l.board_id IN (SELECT id FROM boards WHERE workspace_id = w.id)) as list_count,
        (SELECT COUNT(*) FROM cards c WHERE c.list_id IN (
          SELECT id FROM lists 
          WHERE board_id IN (SELECT id FROM boards WHERE workspace_id = w.id)
          AND COALESCE(is_final, false) = false
        ) AND COALESCE(c.is_archived, false) = false) as card_count,
        (SELECT COUNT(*) FROM cards c WHERE c.list_id IN (
          SELECT id FROM lists 
          WHERE board_id IN (SELECT id FROM boards WHERE workspace_id = w.id)
          AND COALESCE(is_final, false) = true
        ) AND COALESCE(c.is_archived, false) = false) as completed_card_count,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', u.id,
            'username', u.username,
            'full_name', u.full_name
          ) ORDER BY
            CASE wm2.role
              WHEN 'Owner' THEN 1
              WHEN 'Admin' THEN 2
              WHEN 'Member' THEN 3
              WHEN 'Observer' THEN 4
              ELSE 5
            END,
            wm2.joined_at,
            u.id)
          FROM workspace_members wm2
          JOIN users u ON u.id = wm2.user_id
          WHERE wm2.workspace_id = w.id
        ), '[]'::json) AS members
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id 
       WHERE wm.user_id = $1`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Workspace — Owner only
router.delete(
  "/:id",
  authenticateToken,
  requireWorkspaceRoles([ROLES.OWNER], "id"),
  async (req, res) => {
    try {
      await db.query("DELETE FROM workspaces WHERE id = $1", [req.params.id]);
      res.json({ message: "Workspace deleted" });
    } catch (err) {
      console.error("Error deleting workspace:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Create workspace
router.post("/", authenticateToken, async (req, res) => {
  const { name, description, type } = req.body;
  try {
    const invitationCode =
      type === "Group" ? generateInvitationCode() : null;
    const newWorkspace = await db.query(
      "INSERT INTO workspaces (name, description, owner_id, invitation_code) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, req.user.id, invitationCode],
    );
    const wsId = newWorkspace.rows[0].id;

    await db.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
      [wsId, req.user.id, ROLES.OWNER],
    );

    const defaultBoardSlug = Math.random().toString(36).substring(2, 12);
    const boardInviteCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    await db.query(
      "INSERT INTO boards (workspace_id, name, slug_id, invitation_code) VALUES ($1, $2, $3, $4)",
      [wsId, "Papan Utama", defaultBoardSlug, boardInviteCode],
    );

    res.status(201).json(newWorkspace.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join workspace via invitation code
router.post("/join", authenticateToken, async (req, res) => {
  const { invitation_code } = req.body;
  if (!invitation_code?.trim()) {
    return res.status(400).json({ message: "Kode undangan wajib diisi" });
  }

  try {
    const code = invitation_code.trim().toUpperCase();
    const wsResult = await db.query(
      "SELECT * FROM workspaces WHERE UPPER(invitation_code) = $1",
      [code],
    );
    if (wsResult.rows.length === 0) {
      return res.status(404).json({ message: "Kode undangan tidak valid" });
    }

    const workspace = wsResult.rows[0];
    if (!workspace.invitation_code) {
      return res
        .status(400)
        .json({ message: "Workspace ini tidak menerima anggota via kode undangan" });
    }

    const existing = await db.query(
      "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [workspace.id, req.user.id],
    );
    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Anda sudah menjadi anggota workspace ini" });
    }

    await db.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
      [workspace.id, req.user.id, ROLES.MEMBER],
    );

    res.status(201).json(workspace);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// List workspace members
router.get(
  "/:id/members",
  authenticateToken,
  requireWorkspaceMember("id"),
  async (req, res) => {
    try {
      const result = await db.query(
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
        [req.params.id],
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Reset workspace invitation code — Owner only
router.post(
  "/:id/invitation-code/reset",
  authenticateToken,
  requireWorkspaceRoles([ROLES.OWNER], "id"),
  async (req, res) => {
    try {
      const wsResult = await db.query(
        "SELECT invitation_code FROM workspaces WHERE id = $1",
        [req.params.id],
      );
      if (wsResult.rows.length === 0) {
        return res.status(404).json({ message: "Workspace tidak ditemukan" });
      }
      if (!wsResult.rows[0].invitation_code) {
        return res
          .status(400)
          .json({ message: "Workspace Private tidak memiliki kode undangan" });
      }

      const newCode = generateInvitationCode();
      await db.query(
        "UPDATE workspaces SET invitation_code = $1 WHERE id = $2",
        [newCode, req.params.id],
      );
      res.json({
        message: "Kode undangan berhasil direset",
        invitation_code: newCode,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update member role — Owner or Admin only
router.patch(
  "/:id/members/:userId",
  authenticateToken,
  requireWorkspaceRoles([ROLES.OWNER, ROLES.ADMIN], "id"),
  async (req, res) => {
    const { role } = req.body;
    const workspaceId = req.params.id;
    const targetUserId = parseInt(req.params.userId, 10);

    const newRole = normalizeRole(role);
    if (
      !newRole ||
      !hasRole(newRole, [ROLES.ADMIN, ROLES.MEMBER, ROLES.OBSERVER])
    ) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    try {
      const targetRole = await getMembership(targetUserId, workspaceId);
      if (!targetRole) {
        return res.status(404).json({ message: "Anggota tidak ditemukan" });
      }
      if (isOwner(targetRole)) {
        return res
          .status(403)
          .json({ message: "Role Owner tidak dapat diubah" });
      }

      await db.query(
        "UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3",
        [newRole, workspaceId, targetUserId],
      );
      res.json({ message: "Role berhasil diperbarui", role: newRole });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Remove member or leave workspace
router.delete(
  "/:id/members/:userId",
  authenticateToken,
  async (req, res) => {
    const workspaceId = req.params.id;
    const targetUserId = parseInt(req.params.userId, 10);
    const requesterId = req.user.id;

    try {
      const requesterRole = await getMembership(requesterId, workspaceId);
      if (!requesterRole) {
        return res
          .status(403)
          .json({ message: "Anda bukan anggota workspace ini" });
      }

      const targetRole = await getMembership(targetUserId, workspaceId);
      if (!targetRole) {
        return res.status(404).json({ message: "Anggota tidak ditemukan" });
      }
      if (isOwner(targetRole)) {
        return res
          .status(403)
          .json({ message: "Owner workspace tidak dapat dikeluarkan" });
      }

      const isSelf = Number(targetUserId) === Number(requesterId);
      if (isSelf) {
        if (isOwner(requesterRole)) {
          return res.status(403).json({
            message:
              "Owner tidak dapat keluar. Hapus workspace atau transfer ownership.",
          });
        }
      } else if (!hasRole(requesterRole, [ROLES.OWNER, ROLES.ADMIN])) {
        return res.status(403).json({ message: "Akses ditolak" });
      }

      await db.query(
        "DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [workspaceId, targetUserId],
      );
      res.json({
        message: isSelf ? "Berhasil keluar dari workspace" : "Anggota dikeluarkan",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Update Workspace — Owner or Admin
router.put(
  "/:id",
  authenticateToken,
  requireWorkspaceRoles([ROLES.OWNER, ROLES.ADMIN], "id"),
  async (req, res) => {
    try {
      await db.query("UPDATE workspaces SET name = $1 WHERE id = $2", [
        req.body.name,
        req.params.id,
      ]);
      res.json({ message: "Workspace updated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

module.exports = router;
