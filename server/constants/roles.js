const ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  OBSERVER: "Observer",
};

const ALL_ROLES = Object.values(ROLES);

function normalizeRole(role) {
  if (!role) return null;
  const upper = String(role).toUpperCase();
  const map = {
    OWNER: ROLES.OWNER,
    ADMIN: ROLES.ADMIN,
    MEMBER: ROLES.MEMBER,
    OBSERVER: ROLES.OBSERVER,
  };
  return map[upper] || role;
}

function hasRole(role, allowedRoles) {
  const normalized = normalizeRole(role);
  return allowedRoles.some((allowed) => normalizeRole(allowed) === normalized);
}

function canViewWorkspace(role) {
  return hasRole(role, ALL_ROLES);
}

function canEditCards(role) {
  return hasRole(role, [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]);
}

function canManageLists(role) {
  return hasRole(role, [ROLES.OWNER, ROLES.ADMIN]);
}

function canManageBoard(role) {
  return hasRole(role, [ROLES.OWNER, ROLES.ADMIN]);
}

function canManageWorkspace(role) {
  return hasRole(role, [ROLES.OWNER, ROLES.ADMIN]);
}

function isOwner(role) {
  return normalizeRole(role) === ROLES.OWNER;
}

module.exports = {
  ROLES,
  ALL_ROLES,
  normalizeRole,
  hasRole,
  canViewWorkspace,
  canEditCards,
  canManageLists,
  canManageBoard,
  canManageWorkspace,
  isOwner,
};
