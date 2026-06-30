import React, { useState, useEffect } from "react";
import { X, Trash2, Shield, UserMinus, RotateCw, Copy, Check } from "lucide-react";
import api from "../../api/axios";

const WorkspaceSettingsModal = ({ workspace, onClose, onUpdate }) => {
  const [name, setName] = useState(workspace?.name || "");
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState(workspace?.invitation_code || "");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = workspace?.role?.toLowerCase() || "member";
  const canManage = ["owner", "admin"].includes(userRole);

  useEffect(() => {
    if (workspace?.id) {
      fetchMembers();
      fetchWorkspaceDetail();
    }
  }, [workspace]);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/workspaces/${workspace.id}/members`);
      setMembers(data);
    } catch (err) {
      console.error("Gagal memuat anggota:", err);
    }
  };

  const fetchWorkspaceDetail = async () => {
    try {
      const { data } = await api.get(`/workspaces`);
      const ws = data.find(w => w.id === workspace.id);
      if (ws) {
        setInviteCode(ws.invitation_code);
      }
    } catch (err) {
      console.error("Gagal memuat detail workspace:", err);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await api.put(`/workspaces/${workspace.id}`, { name });
      onUpdate();
      alert("Nama workspace berhasil diperbarui");
    } catch (err) {
      alert("Gagal memperbarui nama workspace");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInviteCode = async () => {
    try {
      const { data } = await api.post(`/workspaces/${workspace.id}/invitation-code/reset`);
      setInviteCode(data.invitation_code);
      alert("Kode undangan berhasil direset");
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mereset kode undangan");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.patch(`/workspaces/${workspace.id}/members/${userId}`, { role: newRole });
      fetchMembers();
      alert("Role anggota berhasil diperbarui");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal memperbarui role");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Apakah Anda yakin ingin mengeluarkan anggota ini?")) return;
    try {
      await api.delete(`/workspaces/${workspace.id}/members/${userId}`);
      fetchMembers();
      alert("Anggota berhasil dikeluarkan");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal mengeluarkan anggota");
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus workspace ini secara permanen? Semua papan dan tugas di dalamnya akan hilang!")) return;
    try {
      await api.delete(`/workspaces/${workspace.id}`);
      onUpdate();
      onClose();
      alert("Workspace berhasil dihapus");
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus workspace");
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>Pengaturan Workspace ({workspace.name})</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {canManage ? (
            <form onSubmit={handleUpdateName} style={styles.section}>
              <label style={styles.label}>Nama Workspace</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  style={styles.input}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ganti nama..."
                  required
                />
                <button type="submit" style={styles.saveBtn} disabled={isLoading}>
                  Simpan
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.section}>
              <label style={styles.label}>Nama Workspace</label>
              <div style={{ padding: "10px 14px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "8px", color: "#ccc" }}>
                {workspace.name}
              </div>
            </div>
          )}

          {!isPrivate && inviteCode && (
            <div style={styles.section}>
              <label style={styles.label}>Kode Undangan Workspace</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={styles.codeBox}>{inviteCode}</div>
                <button onClick={handleCopyCode} style={styles.iconBtn} title="Salin Kode">
                  {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} />}
                </button>
                {canManage && (
                  <button onClick={handleResetInviteCode} style={styles.iconBtn} title="Reset Kode">
                    <RotateCw size={18} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={styles.section}>
            <label style={styles.label}>Anggota Workspace ({members.length})</label>
            <div style={styles.memberList}>
              {members.map((member) => {
                const isSelf = member.id === currentUser.id;
                const canChangeRole = canManage && !isSelf && member.role !== "Owner";
                const canKick = canManage && !isSelf && member.role !== "Owner";

                return (
                  <div key={member.id} style={styles.memberRow}>
                    <div style={styles.memberInfo}>
                      <div style={{
                        ...styles.avatar,
                        backgroundColor: "#0095ff",
                        color: "white"
                      }}>
                        {(member.full_name || member.username).substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.memberName}>{member.full_name || member.username}</div>
                        <div style={styles.memberEmail}>{member.email}</div>
                      </div>
                    </div>

                    <div style={styles.memberActions}>
                      {canChangeRole ? (
                        <select
                          style={styles.select}
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Member">Member</option>
                          <option value="Observer">Observer</option>
                        </select>
                      ) : (
                        <span style={styles.roleBadge}>{member.role}</span>
                      )}

                      {canKick && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={styles.kickBtn}
                          title="Keluarkan dari workspace"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {canManage && userRole === "owner" && (
            <div style={styles.dangerZone}>
              <h3>Zona Bahaya</h3>
              <p>Menghapus workspace bersifat permanen dan tidak dapat dibatalkan.</p>
              <button onClick={handleDeleteWorkspace} style={styles.deleteBtn}>
                <Trash2 size={16} /> Hapus Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    display: "flex",
    flexDirection: "column",
    maxHeight: "85vh",
    overflowY: "auto",
  },
  header: {
    padding: "20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  saveBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  codeBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px dashed rgba(255, 255, 255, 0.2)",
    color: "#0095ff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "1px",
    textAlign: "center",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: "10px",
    borderRadius: "8px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  memberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  memberInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  memberName: {
    fontSize: "14px",
    fontWeight: "600",
  },
  memberEmail: {
    fontSize: "11px",
    color: "#888",
  },
  memberActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  select: {
    backgroundColor: "#1e2125",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "6px",
    padding: "6px",
    fontSize: "12px",
    outline: "none",
  },
  roleBadge: {
    fontSize: "12px",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "4px 8px",
    borderRadius: "6px",
    color: "#aaa",
  },
  kickBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ff4d4d",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  dangerZone: {
    border: "1px solid #ff4d4d",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "rgba(255, 77, 77, 0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  deleteBtn: {
    backgroundColor: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "fit-content",
  },
};

export default WorkspaceSettingsModal;
