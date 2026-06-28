const jwt = require('jsonwebtoken');
require('dotenv').config();
const { normalizeRole, hasRole } = require('../constants/roles');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeWorkspaceRole = (roles) => {
  return async (req, res, next) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const db = require('../config/db');

    try {
      const result = await db.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ message: 'Not a member of this workspace' });
      }

      const userRole = normalizeRole(result.rows[0].role);
      const allowed = roles.map(normalizeRole);
      if (!hasRole(userRole, allowed)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.userRole = userRole;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

module.exports = { authenticateToken, authorizeWorkspaceRole };
