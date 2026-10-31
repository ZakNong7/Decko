export const canEditCards = (role) => {
  return ["owner", "admin", "member"].includes(role?.toLowerCase());
};

export const canManageLists = (role) => {
  return ["owner", "admin"].includes(role?.toLowerCase());
};

export const canManageBoard = (role) => {
  return ["owner", "admin"].includes(role?.toLowerCase());
};

export const normalizeRole = (role) => {
  return role?.toLowerCase() || "observer";
};
