import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MemberAvatarStack from "../components/MemberAvatarStack";
import WorkspaceSettingsModal from "../components/modals/WorkspaceSettingsModal";
import {
  Search,
  Plus,
  Filter,
  LogOut,
  Settings,
  X,
  Copy,
  Check,
  Trash2,
  Calendar,
  Layout,
  Lock,
  AlertTriangle,
} from "lucide-react";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [user, setUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(null);
  const [editWsName, setEditWsName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [roleFilter, setRoleFilter] = useState("all");
  const [newWsData, setNewWsData] = useState({ name: "", type: "Private" });
  const [createdInviteCode, setCreatedInviteCode] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data } = await api.get("/workspaces");
      setWorkspaces(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWsData.name) return;
    try {
      const { data } = await api.post("/workspaces", newWsData);
      if (newWsData.type === "Group") {
        setCreatedInviteCode(data.invitation_code);
        fetchWorkspaces();
      } else {
        setIsAddModalOpen(false);
        setNewWsData({ name: "", type: "Private" });
        fetchWorkspaces();
      }
    } catch (err) {
      alert("Gagal membuat workspace");
    }
  };

  const handleJoinWorkspace = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      await api.post("/workspaces/join", {
        invitation_code: joinCode.trim(),
      });
      setIsJoinModalOpen(false);
      setJoinCode("");
      fetchWorkspaces();
    } catch (err) {
      setJoinError(
        err.response?.data?.message || "Gagal bergabung ke workspace",
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!editWsName) return;
    try {
      await api.put(`/workspaces/${isSettingsOpen.id}`, { name: editWsName });
      setIsSettingsOpen(null);
      fetchWorkspaces();
    } catch (err) {
      alert("Gagal mengupdate workspace");
    }
  };

  const handleDeleteWorkspace = async () => {
    const wsId = isDeleteConfirmOpen.id;
    try {
      await api.delete(`/workspaces/${wsId}`);
      setIsDeleteConfirmOpen(null);
      setIsSettingsOpen(null);
      fetchWorkspaces();
    } catch (err) {
      alert("Gagal menghapus workspace");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getAvatarColor = (name) => {
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
    if (name)
      for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case "OWNER":
        return "#f1c40f";
      case "ADMIN":
        return "#2ecc71";
      case "MEMBER":
        return "#3498db";
      case "OBSERVER":
        return "#9b59b6";
      default:
        return "#a0a0a0";
    }
  };

  const getContrastColor = (hexcolor) => {
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  };

  const navigateToWorkspace = async (workspaceId) => {
    try {
      const ws = workspaces.find((w) => w.id === workspaceId);
      const { data } = await api.get(`/boards/workspace/${workspaceId}`);
      if (data && data.length > 0) {
        const board = data[0];
        const wsSlug = ws ? ws.name.toLowerCase().replace(/\s+/g, "-") : "ws";
        const boardSlug = board.name.toLowerCase().replace(/\s+/g, "-");
        const randomId = board.slug_id || board.id;
        navigate(`/workspace/${wsSlug}/${randomId}/${boardSlug}`);
      } else {
        alert("Workspace belum memiliki papan.");
      }
    } catch (err) {
      console.error("[NAVIGATE ERROR]", err);
    }
  };

  const filteredWorkspaces = workspaces
    .filter((ws) => {
      const matchSearch = ws.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchRole =
        roleFilter === "all" ||
        ws.role?.toLowerCase() === roleFilter.toLowerCase();
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      const aCards = parseInt(a.card_count) || 0;
      const bCards = parseInt(b.card_count) || 0;
      if (aCards === 0 && bCards > 0) return 1;
      if (bCards === 0 && aCards > 0) return -1;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "oldest") return a.id - b.id;
      return 0;
    });

  // Only show full empty state if user has zero workspaces at all
  const hasNoWorkspacesAtAll = workspaces.length === 0;
  const isFilteredEmpty =
    !hasNoWorkspacesAtAll && filteredWorkspaces.length === 0;

  // Show gear icon for Owner and Admin
  const canManageWorkspace = (role) =>
    ["owner", "admin"].includes(role?.toLowerCase());

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <div className="logo-bars">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <span style={styles.logoText}>DECKO</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          KELUAR
        </button>
      </header>

      <main style={styles.main}>
        <h1 style={styles.welcome}>Selamat Datang, {user?.username}</h1>
        <div style={styles.controls}>
          <div style={styles.searchWrapper}>
            <Search size={20} color="#a0a0a0" />
            <input
              type="text"
              placeholder="Cari workspace..."
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.actions}>
            <select
              style={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name_asc">Nama (A-Z)</option>
              <option value="name_desc">Nama (Z-A)</option>
            </select>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              style={styles.joinBtn}
            >
              Gabung
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={styles.addBtn}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div style={styles.roleRadios}>
          {["all", "owner", "admin", "member", "observer"].map((r) => (
            <label key={r} style={styles.radioLabel}>
              <input
                type="radio"
                name="role"
                value={r}
                checked={roleFilter === r}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
              <span
                style={{
                  color:
                    roleFilter === r
                      ? getRoleColor(r === "all" ? null : r)
                      : "#a0a0a0",
                  fontWeight: roleFilter === r ? "700" : "400",
                }}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </span>
            </label>
          ))}
        </div>

        <div style={styles.grid}>
          {hasNoWorkspacesAtAll ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <Layout size={48} color="#0095ff" />
              </div>
              <h2 style={styles.emptyTitle}>Mulai Mengorganisir Tugas</h2>
              <p style={styles.emptyText}>
                Anda belum memiliki workspace. Buat workspace pertama Anda untuk
                mulai mengelola proyek dengan lebih efisien.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={styles.emptyAddBtn}
              >
                + Buat Workspace Baru
              </button>
            </div>
          ) : isFilteredEmpty ? (
            <div style={styles.filterEmpty}>
              <Layout size={32} color="#444" />
              <p style={{ color: "#666", fontSize: "16px", marginTop: "12px" }}>
                Tidak ada workspace yang sesuai
              </p>
              <p style={{ color: "#444", fontSize: "13px" }}>
                Coba ubah filter atau kata kunci pencarian Anda
              </p>
            </div>
          ) : (
            filteredWorkspaces.map((ws) => {
              const isInactive = (parseInt(ws.card_count) || 0) === 0;
              const isPrivate = !ws.invitation_code;
              const bgColor = getAvatarColor(ws.name);
              const userAvatarColor = getAvatarColor(user?.username);
              const roleColor = getRoleColor(ws.role);
              const canManage = canManageWorkspace(ws.role) || isPrivate;
              return (
                <div
                  key={ws.id}
                  style={{
                    ...styles.card,
                    opacity: isInactive ? 0.55 : 1,
                    filter: isInactive ? "grayscale(30%)" : "none",
                  }}
                  onClick={() => navigateToWorkspace(ws.id)}
                >
                  <div style={styles.cardHeader}>
                    <div
                      style={{
                        ...styles.avatar,
                        backgroundColor: bgColor,
                        color: getContrastColor(bgColor),
                      }}
                    >
                      {ws.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={styles.titleArea}>
                      <h3 style={styles.cardTitle}>{ws.name}</h3>
                      {canManage && (
                        <Settings
                          size={18}
                          style={styles.settingsIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSettingsOpen(ws);
                            setEditWsName(ws.name);
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <p style={styles.cardInfo}>
                    {ws.board_count || 0} Papan &nbsp;·&nbsp;{" "}
                    {ws.list_count || 0} List &nbsp;·&nbsp; {ws.card_count || 0}{" "}
                    Kartu
                  </p>
                  <div style={styles.cardFooter}>
                    {isPrivate ? (
                      <div style={styles.privateTag}>
                        <Lock size={12} /> <span>PRIVATE</span>
                      </div>
                    ) : (
                      <MemberAvatarStack
                        members={
                          Array.isArray(ws.members)
                            ? ws.members
                            : typeof ws.members === "string"
                              ? JSON.parse(ws.members)
                              : []
                        }
                        max={4}
                        size={28}
                      />
                    )}
                    {!isPrivate && (
                      <span
                        style={{
                          ...styles.roleBadge,
                          color: roleColor,
                          borderColor: roleColor,
                        }}
                      >
                        {ws.role?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Workspace Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop modal-backdrop-enter" style={styles.modalOverlay}>
          <div className="modal-panel modal-panel-enter" style={styles.modal}>
            <header style={styles.modalHeader}>
              <h2>Tambah Workspace</h2>
              <X
                onClick={() => {
                  setIsAddModalOpen(false);
                  setCreatedInviteCode(null);
                  setNewWsData({ name: "", type: "Private" });
                }}
                style={{ cursor: "pointer" }}
              />
            </header>
            <div style={styles.modalBody}>
              {createdInviteCode ? (
                <div style={styles.inviteArea}>
                  <div style={{ textAlign: "center" }}>
                    <Layout
                      size={32}
                      color="#0095ff"
                      style={{ marginBottom: "8px" }}
                    />
                    <p style={{ fontWeight: "800", fontSize: "18px" }}>
                      Workspace Group Dibuat!
                    </p>
                  </div>
                  <p
                    style={{
                      color: "#a0a0a0",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    Bagikan kode undangan ini kepada anggota:
                  </p>
                  <div style={styles.inviteBox}>
                    <code
                      style={{
                        fontSize: "24px",
                        fontWeight: "800",
                        letterSpacing: "4px",
                        color: "#0095ff",
                      }}
                    >
                      {createdInviteCode}
                    </code>
                    <button
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        navigator.clipboard.writeText(createdInviteCode)
                      }
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setCreatedInviteCode(null);
                      setNewWsData({ name: "", type: "Private" });
                    }}
                    style={styles.finishBtn}
                  >
                    Selesai
                  </button>
                </div>
              ) : (
                <>
                  <input
                    style={styles.modalInput}
                    placeholder="Nama Workspace"
                    value={newWsData.name}
                    onChange={(e) =>
                      setNewWsData({ ...newWsData, name: e.target.value })
                    }
                  />
                  <div style={styles.typeSelector}>
                    <div
                      style={{
                        ...styles.typeBtn,
                        border:
                          newWsData.type === "Private"
                            ? "2px solid #0095ff"
                            : "1px solid #444",
                      }}
                      onClick={() =>
                        setNewWsData({ ...newWsData, type: "Private" })
                      }
                    >
                      <Lock size={20} />{" "}
                      <span style={{ fontSize: "12px" }}>Private</span>
                    </div>
                    <div
                      style={{
                        ...styles.typeBtn,
                        border:
                          newWsData.type === "Group"
                            ? "2px solid #0095ff"
                            : "1px solid #444",
                      }}
                      onClick={() =>
                        setNewWsData({ ...newWsData, type: "Group" })
                      }
                    >
                      <Layout size={20} />{" "}
                      <span style={{ fontSize: "12px" }}>Group</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateWorkspace}
                    style={styles.submitBtn}
                  >
                    Buat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {isJoinModalOpen && (
        <div className="modal-backdrop modal-backdrop-enter" style={styles.modalOverlay}>
          <div className="modal-panel modal-panel-enter" style={styles.modal}>
            <header style={styles.modalHeader}>
              <h2>Gabung Workspace</h2>
              <X
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setJoinCode("");
                  setJoinError("");
                }}
                style={{ cursor: "pointer" }}
              />
            </header>
            <div style={styles.modalBody}>
              <p style={{ color: "#a0a0a0", fontSize: "13px" }}>
                Masukkan kode undangan yang diberikan pemilik workspace Group.
              </p>
              <input
                style={{
                  ...styles.modalInput,
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  fontWeight: "800",
                  textAlign: "center",
                }}
                placeholder="KODE UNDANGAN"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
              {joinError && (
                <p style={{ color: "#e74c3c", fontSize: "13px", margin: 0 }}>
                  {joinError}
                </p>
              )}
              <button
                onClick={handleJoinWorkspace}
                style={{
                  ...styles.submitBtn,
                  opacity: joinLoading || !joinCode.trim() ? 0.6 : 1,
                }}
                disabled={joinLoading || !joinCode.trim()}
              >
                {joinLoading ? "Bergabung..." : "Gabung Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <WorkspaceSettingsModal
          workspace={isSettingsOpen}
          onClose={() => setIsSettingsOpen(null)}
          onUpdate={fetchWorkspaces}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="modal-backdrop modal-backdrop-enter" style={styles.modalOverlay}>
          <div className="modal-panel modal-panel-enter" style={{ ...styles.modal, width: "400px", textAlign: "center" }}>
            <div
              style={{
                backgroundColor: "rgba(231,76,60,0.1)",
                width: "64px",
                height: "64px",
                borderRadius: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle size={32} color="#e74c3c" />
            </div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "800",
                marginBottom: "12px",
              }}
            >
              Hapus Workspace?
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#a0a0a0",
                marginBottom: "30px",
                lineHeight: "1.5",
              }}
            >
              Tindakan ini tidak dapat dibatalkan. Semua papan, list, dan kartu
              di dalam <b>{isDeleteConfirmOpen.name}</b> akan terhapus
              selamanya.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                style={{
                  ...styles.submitBtn,
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #444",
                }}
                onClick={() => setIsDeleteConfirmOpen(null)}
              >
                Batal
              </button>
              <button
                style={{ ...styles.submitBtn, flex: 1, background: "#e74c3c" }}
                onClick={handleDeleteWorkspace}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#1a1d21",
    color: "white",
    padding: "40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "60px",
  },
  logo: { display: "flex", alignItems: "center", gap: "12px" },
  logoIcon: {
    width: "32px",
    height: "32px",
    backgroundColor: "#0095ff",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBars: { display: "flex", flexDirection: "column", gap: "2px" },
  logoText: { fontWeight: "800", fontSize: "24px" },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    border: "none",
    color: "white",
    padding: "8px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  main: { maxWidth: "1100px", margin: "0 auto" },
  welcome: {
    fontSize: "36px",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: "40px",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    gap: "20px",
  },
  searchWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
  },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "white",
    padding: "12px",
    width: "100%",
    outline: "none",
    fontSize: "16px",
  },
  actions: { display: "flex", gap: "12px" },
  sortSelect: {
    backgroundColor: "#2c3136",
    border: "none",
    color: "white",
    borderRadius: "12px",
    padding: "0 16px",
    fontSize: "14px",
    outline: "none",
  },
  joinBtn: {
    backgroundColor: "transparent",
    border: "1px solid #0095ff",
    color: "#0095ff",
    padding: "0 20px",
    height: "48px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "14px",
    cursor: "pointer",
  },
  addBtn: {
    backgroundColor: "#0095ff",
    border: "none",
    color: "white",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  roleRadios: {
    display: "flex",
    gap: "24px",
    marginBottom: "30px",
    padding: "0 4px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#22252a",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.05)",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  cardHeader: { display: "flex", gap: "16px", marginBottom: "16px" },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "18px",
    flexShrink: 0,
  },
  titleArea: {
    display: "flex",
    justifyContent: "space-between",
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "800",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  settingsIcon: { color: "#a0a0a0", cursor: "pointer", flexShrink: 0 },
  cardInfo: { color: "#666", fontSize: "13px", marginBottom: "24px" },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privateTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "800",
    color: "#666",
  },
  miniAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    border: "2px solid #22252a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "700",
  },
  profileAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "14px",
    backgroundColor: "white",
    color: "#0095ff",
    border: "2px solid #0095ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "800",
  },
  roleBadge: {
    fontSize: "10px",
    padding: "2px 12px",
    borderRadius: "12px",
    border: "1px solid",
    fontWeight: "800",
  },
  filterEmpty: {
    gridColumn: "1/-1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
    borderRadius: "24px",
    backgroundColor: "rgba(255,255,255,0.01)",
  },
  emptyState: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: "32px",
    border: "2px dashed rgba(255,255,255,0.05)",
  },
  emptyIcon: {
    width: "100px",
    height: "100px",
    backgroundColor: "rgba(0,149,255,0.1)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "24px",
  },
  emptyTitle: { fontSize: "24px", fontWeight: "800", marginBottom: "12px" },
  emptyText: {
    color: "#a0a0a0",
    maxWidth: "400px",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  emptyAddBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    padding: "14px 32px",
    borderRadius: "12px",
    fontWeight: "800",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#22252a",
    padding: "32px",
    borderRadius: "24px",
    width: "450px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  modalBody: { display: "flex", flexDirection: "column", gap: "16px" },
  modalInput: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "16px",
    borderRadius: "12px",
    fontSize: "16px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  typeSelector: { display: "flex", gap: "12px" },
  typeBtn: {
    flex: 1,
    backgroundColor: "#1a1d21",
    color: "white",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "16px",
    border: "none",
    cursor: "pointer",
    width: "100%",
  },
  inviteArea: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inviteBox: {
    backgroundColor: "#1a1d21",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(0,149,255,0.3)",
  },
  finishBtn: {
    backgroundColor: "#2ecc71",
    color: "white",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: "800",
    width: "100%",
  },
};

export default Dashboard;