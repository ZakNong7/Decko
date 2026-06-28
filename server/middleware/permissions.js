const db = require("../config/db");
const {
  ROLES,
  normalizeRole,
  hasRole,
  canEditCards,
  canManageLists,
  canManageBoard,
  isOwner,
} = require("../constants/roles");

async function getMembership(userId, workspaceId) {
  const result = await db.query(
    "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId],
  );
  if (result.rows.length === 0) return null;
  return normalizeRole(result.rows[0].role);
}

async function getBoardContext(userId, boardIdOrSlug) {
  const result = await db.query(
    `SELECT b.id, b.workspace_id, b.slug_id, b.name, wm.role
     FROM boards b
     LEFT JOIN workspace_members wm
       ON wm.workspace_id = b.workspace_id AND wm.user_id = $2
     WHERE b.slug_id = $1 OR b.id::text = $1`,
    [String(boardIdOrSlug), userId],
  );
  if (result.rows.length === 0 || !result.rows[0].role) return null;
  const row = result.rows[0];
  return {
    boardId: row.id,
    workspaceId: row.workspace_id,
    role: normalizeRole(row.role),
  };
}

async function getListContext(userId, listId) {
  const result = await db.query(
    `SELECT l.id AS list_id, b.id AS board_id, b.workspace_id, wm.role
     FROM lists l
     JOIN boards b ON b.id = l.board_id
     LEFT JOIN workspace_members wm
       ON wm.workspace_id = b.workspace_id AND wm.user_id = $2
     WHERE l.id = $1`,
    [listId, userId],
  );
  if (result.rows.length === 0 || !result.rows[0].role) return null;
  const row = result.rows[0];
  return {
    listId: row.list_id,
    boardId: row.board_id,
    workspaceId: row.workspace_id,
    role: normalizeRole(row.role),
  };
}

async function getCardContext(userId, cardId) {
  const result = await db.query(
    `SELECT c.id AS card_id, l.id AS list_id, b.id AS board_id, b.workspace_id, wm.role
     FROM cards c
     JOIN lists l ON l.id = c.list_id
     JOIN boards b ON b.id = l.board_id
     LEFT JOIN workspace_members wm
       ON wm.workspace_id = b.workspace_id AND wm.user_id = $2
     WHERE c.id = $1`,
    [cardId, userId],
  );
  if (result.rows.length === 0 || !result.rows[0].role) return null;
  const row = result.rows[0];
  return {
    cardId: row.card_id,
    listId: row.list_id,
    boardId: row.board_id,
    workspaceId: row.workspace_id,
    role: normalizeRole(row.role),
  };
}

async function getLabelContext(userId, labelId) {
  const result = await db.query(
    `SELECT l.id AS label_id, l.workspace_id, wm.role
     FROM labels l
     LEFT JOIN workspace_members wm
       ON wm.workspace_id = l.workspace_id AND wm.user_id = $2
     WHERE l.id = $1`,
    [labelId, userId],
  );
  if (result.rows.length === 0 || !result.rows[0].role) return null;
  const row = result.rows[0];
  return {
    labelId: row.label_id,
    workspaceId: row.workspace_id,
    role: normalizeRole(row.role),
  };
}

function forbidden(res, message = "Insufficient permissions") {
  return res.status(403).json({ message });
}

function requireWorkspaceMember(paramName = "id") {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params[paramName] || req.body.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID required" });
      }
      const role = await getMembership(req.user.id, workspaceId);
      if (!role) {
        return res
          .status(403)
          .json({ message: "Not a member of this workspace" });
      }
      req.workspaceId = parseInt(workspaceId, 10);
      req.userRole = role;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requireWorkspaceRoles(allowedRoles, paramName = "id") {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params[paramName] || req.body.workspaceId;
      const role = await getMembership(req.user.id, workspaceId);
      if (!role) {
        return res
          .status(403)
          .json({ message: "Not a member of this workspace" });
      }
      if (!hasRole(role, allowedRoles)) {
        return forbidden(res);
      }
      req.workspaceId = parseInt(workspaceId, 10);
      req.userRole = role;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requireBoardMember(getBoardKey) {
  return async (req, res, next) => {
    try {
      const boardKey = getBoardKey(req);
      if (!boardKey) {
        return res.status(400).json({ message: "Board ID required" });
      }
      const ctx = await getBoardContext(req.user.id, boardKey);
      if (!ctx) {
        return res
          .status(403)
          .json({ message: "Board not found or access denied" });
      }
      req.boardContext = ctx;
      req.userRole = ctx.role;
      req.workspaceId = ctx.workspaceId;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requireListAccess(checkPermission) {
  return async (req, res, next) => {
    try {
      const listId = req.params.id || req.body.listId;
      const ctx = await getListContext(req.user.id, listId);
      if (!ctx) {
        return res
          .status(403)
          .json({ message: "List not found or access denied" });
      }
      if (checkPermission && !checkPermission(ctx.role)) {
        return forbidden(res);
      }
      req.listContext = ctx;
      req.userRole = ctx.role;
      req.workspaceId = ctx.workspaceId;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requireCardAccess(checkPermission) {
  return async (req, res, next) => {
    try {
      const cardId =
        req.params.id || req.params.cardId || req.body.cardId;
      const ctx = await getCardContext(req.user.id, cardId);
      if (!ctx) {
        return res
          .status(403)
          .json({ message: "Card not found or access denied" });
      }
      if (checkPermission && !checkPermission(ctx.role)) {
        return forbidden(res);
      }
      req.cardContext = ctx;
      req.userRole = ctx.role;
      req.workspaceId = ctx.workspaceId;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requireCanEditCardsBatch(req, res, next) {
  (async () => {
    try {
      const { cards } = req.body;
      if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ message: "Invalid cards payload" });
      }
      const cardIds = cards.map((card) => card.id);
      const result = await db.query(
        `SELECT DISTINCT b.workspace_id, wm.role
         FROM cards c
         JOIN lists l ON l.id = c.list_id
         JOIN boards b ON b.id = l.board_id
         LEFT JOIN workspace_members wm
           ON wm.workspace_id = b.workspace_id AND wm.user_id = $2
         WHERE c.id = ANY($1::int[])`,
        [cardIds, req.user.id],
      );
      if (result.rows.length !== 1 || !result.rows[0].role) {
        return forbidden(res, "Cards not found or access denied");
      }
      const role = normalizeRole(result.rows[0].role);
      if (!canEditCards(role)) {
        return forbidden(res);
      }
      req.userRole = role;
      req.workspaceId = result.rows[0].workspace_id;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  })();
}

function requireLabelAccess(checkPermission) {
  return async (req, res, next) => {
    try {
      const labelId = req.params.id;
      const ctx = await getLabelContext(req.user.id, labelId);
      if (!ctx) {
        return res
          .status(403)
          .json({ message: "Label not found or access denied" });
      }
      if (checkPermission && !checkPermission(ctx.role)) {
        return forbidden(res);
      }
      req.labelContext = ctx;
      req.userRole = ctx.role;
      req.workspaceId = ctx.workspaceId;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
}

function requirePermission(checkFn) {
  return (req, res, next) => {
    if (!checkFn(req.userRole)) {
      return forbidden(res);
    }
    next();
  };
}

module.exports = {
  ROLES,
  getMembership,
  getBoardContext,
  getListContext,
  getCardContext,
  getLabelContext,
  canEditCards,
  canManageLists,
  canManageBoard,
  isOwner,
  requireWorkspaceMember,
  requireWorkspaceRoles,
  requireBoardMember,
  requireListAccess,
  requireCardAccess,
  requireCanEditCardsBatch,
  requireLabelAccess,
  requirePermission,
};
