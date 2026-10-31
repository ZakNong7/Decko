import React from "react";
import { getAvatarColor, getContrastColor, getInitials } from "../utils/avatar";

const MemberAvatarStack = ({ members = [], max = 4, size = 28 }) => {
  if (!members?.length) return null;

  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {visible.map((member, index) => {
        const bg = getAvatarColor(member.username || member.full_name);
        return (
          <div
            key={member.id || member.username || index}
            title={member.full_name || member.username}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bg,
              color: getContrastColor(bg),
              border: "2px solid #1a1d21",
              marginLeft: index > 0 ? -(size * 0.28) : 0,
              zIndex: visible.length - index,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: Math.max(9, size * 0.34),
              fontWeight: "800",
              flexShrink: 0,
            }}
          >
            {getInitials(member)}
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#444",
            color: "#fff",
            border: "2px solid #1a1d21",
            marginLeft: -(size * 0.28),
            zIndex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: Math.max(9, size * 0.3),
            fontWeight: "800",
            flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default MemberAvatarStack;