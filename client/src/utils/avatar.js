export const getAvatarColor = (name) => {
  const colors = [
    "#f1c40f",
    "#e67e22",
    "#e74c3c",
    "#9b59b6",
    "#3498db",
    "#2ecc71",
    "#1abc9c",
    "#16a085",
    "#d35400",
    "#c0392b",
    "#8e44ad",
    "#2980b9",
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getContrastColor = (hexcolor) => {
  if (!hexcolor || hexcolor.length < 7) return "#fff";
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

export const getInitials = (member) => {
  if (!member) return "";
  const name = member.full_name || member.username || "";
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
