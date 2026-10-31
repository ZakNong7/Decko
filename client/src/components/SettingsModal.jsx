import React, { useState, useEffect } from "react";
import { X, Trash2, Shield, UserMinus, RotateCw, Copy, Check } from "lucide-react";
import api from "../api/axios";

const SettingsModal = ({ isOpen, onClose, board, onUpdate, totalBoards, onDeleted }) => {
  const [boardName, setBoardName] = useState(board?.name || "");
  const [members, setMembers] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (isOpen && board?.workspace_id) {
      fetchMembers();
      fetchWorkspaceDetail();
    }
  }, [isOpen, board]);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/workspaces/${board.workspace_id}/members`);
      setMembers(data);
    } catch (err) {
      console.error("Gagal memuat anggota:", err);
    }
  };

  const fetchWorkspaceDetail = async () => {
    try {
      const { data } = await api.get(`/workspaces`);
      const ws = data.find(w => w.id === board.workspace_id);
      if (ws) {
        setInviteCode(ws.invitation_code);
      }
    } catch (err) {
      console.error("Gagal memuat detail workspace:", err);
    }
  };

  const handleUpdateBoardName = async () => {
    if (!boardName.trim()) return;
    setIsLoading(true);
    try {
      await api.put(`/boards/${board.id}`, { name: boardName });
      onUpdate();
      setConfirmModal({
        title: "Sukses",
        message: "Nama papan berhasil diperbarui.",
        confirmText: "Tutup",
        isDanger: false,
        onConfirm: () => setConfirmModal(null)
      });
    } catch (err) {
      setConfirmModal({
        title: "Gagal",
        message: "Gagal memperbarui nama papan.",
        confirmText: "Tutup",
        isDanger: true,
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDeleteBoard = () => {
    setConfirmModal({
      title: "Hapus Papan Proyek",
      message: "Apakah Anda yakin ingin menghapus papan ini? Semua data list dan kartu di dalamnya akan dihapus secara permanen.",
      confirmText: "Hapus Permanen",
      isDanger: true,
      onConfirm: executeDeleteBoard
    });
  };

  const executeDeleteBoard = async () => {
    try {
      await api.delete(`/boards/${board.id}`);
      onClose();
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setConfirmModal({
        title: "Gagal",
        message: "Gagal menghapus papan proyek.",
        confirmText: "Tutup",
        isDanger: true,
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setConfirmModal(null);
    }
  };

  const triggerResetInviteCode = () => {
    setConfirmModal({
      title: "Reset Kode Undangan",
      message: "Apakah Anda yakin ingin mereset kode undangan workspace ini? Kode lama tidak akan berlaku lagi.",
      confirmText: "Reset Kode",
      isDanger: true,
      onConfirm: executeResetInviteCode
    });
  };

  const executeResetInviteCode = async () => {
    try {
      const { data } = await api.post(`/workspaces/${board.workspace_id}/invitation-code/reset`);
      setInviteCode(data.invitation_code);
      onUpdate();
    } catch (err) {
      setConfirmModal({
        title: "Gagal",
        message: err.response?.data?.message || "Gagal mereset kode undangan.",
        confirmText: "Tutup",
        isDanger: true,
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setConfirmModal(null);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.patch(`/workspaces/${board.workspace_id}/members/${userId}`, { role: newRole });
      fetchMembers();
      // No success alert/notification as requested!
    } catch (err) {
      setConfirmModal({
        title: "Gagal",
        message: err.response?.data?.message || "Gagal memperbarui role anggota.",
        confirmText: "Tutup",
        isDanger: true,
        onConfirm: () => setConfirmModal(null)
      });
    }
  };

  const triggerRemoveMember = (member) => {
    setConfirmModal({
      title: "Keluarkan Anggota",
      message: `Apakah Anda yakin ingin mengeluarkan ${member.full_name || member.username} dari workspace ini?`,
      confirmText: "Keluarkan",
      isDanger: true,
      onConfirm: () => executeRemoveMember(member.id)
    });
  };

  const executeRemoveMember = async (userId) => {
    try {
      await api.delete(`/workspaces/${board.workspace_id}/members/${userId}`);
      fetchMembers();
    } catch (err) {
      setConfirmModal({
        title: "Gagal",
        message: err.response?.data?.message || "Gagal mengeluarkan anggota workspace.",
        confirmText: "Tutup",
        isDanger: true,
        onConfirm: () => setConfirmModal(null)
      });
    } finally {
      setConfirmModal(null);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`modal-backdrop modal-backdrop-enter ${isOpen ? "" : "hidden"}`} style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>Pengaturan Papan</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {/* UBAH NAMA PAPAN */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Nama Papan</h3>
            <div style={styles.row}>
              <input
                style={styles.input}
                value={boardName}
                onChange={e => setBoardName(e.target.value)}
                placeholder="Nama papan..."
              />
              <button style={styles.saveBtn} onClick={handleUpdateBoardName} disabled={isLoading}>
                Simpan
              </button>
            </div>
          </section>

          {/* KODE UNDANGAN WORKSPACE */}
          {inviteCode && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Kode Undangan Workspace</h3>
              <p style={styles.description}>Kirim kode ini kepada rekan tim Anda untuk bergabung ke Workspace.</p>
              <div style={styles.row}>
                <div style={styles.codeBox}>{inviteCode}</div>
                <button style={styles.copyBtn} onClick={handleCopyCode} title="Salin Kode">
                  {copied ? <Check size={16} color="#2ecc71" /> : <Copy size={16} />}
                </button>
                <button style={styles.resetBtn} onClick={triggerResetInviteCode}>
                  <RotateCw size={16} /> Reset
                </button>
              </div>
            </section>
          )}

          {/* ANGGOTA */}
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>Anggota Workspace ({members.length})</h3>
            <div style={styles.memberList}>
              {members.map((member) => {
                const isSelf = member.id === user.id;
                const canChangeRole = !isSelf && member.role !== "Owner";
                
                return (
                  <div key={member.id} style={styles.memberRow}>
                    <div style={styles.memberInfo}>
                      <div style={styles.avatar}>
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
                      
                      {!isSelf && member.role !== "Owner" && (
                        <button style={styles.kickBtn} onClick={() => triggerRemoveMember(member)}>
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* DANGER ZONE (HAPUS PAPAN) */}
          <section style={styles.dangerZone}>
            <h3 style={styles.dangerTitle}>Zona Bahaya</h3>
            {totalBoards <= 1 ? (
              <p style={{ ...styles.description, color: "#e74c3c", marginTop: "8px" }}>
                Papan ini tidak dapat dihapus karena merupakan satu-satunya papan proyek di workspace ini.
              </p>
            ) : (
              <button style={styles.deleteBtn} onClick={triggerDeleteBoard}>
                <Trash2 size={16} /> Hapus Papan Proyek
              </button>
            )}
          </section>
        </div>
      </div>

      {/* CUSTOM CONFIRMATION OVERLAY MODAL */}
      {confirmModal && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmModal(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>{confirmModal.title}</h3>
            <p style={styles.confirmMessage}>{confirmModal.message}</p>
            <div style={styles.confirmActions}>
              <button style={styles.confirmCancelBtn} onClick={() => setConfirmModal(null)}>
                Batal
              </button>
              <button
                style={{
                  ...styles.confirmConfirmBtn,
                  backgroundColor: confirmModal.isDanger ? "#ff4d4d" : "#0095ff",
                }}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
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
    gap: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  description: {
    fontSize: "12px",
    color: "#a0a0a0",
    margin: 0,
  },
  row: {
    display: "flex",
    gap: "12px",
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
    color: "#fff",
    padding: "0 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
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
  copyBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  resetBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "0 16px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: "12px",
    borderRadius: "8px",
    maxHeight: "180px",
    overflowY: "auto",
  },
  memberRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
    backgroundColor: "#0095ff",
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
    gap: "8px",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  dangerTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#e74c3c",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "1px solid #ff4d4d",
    color: "#ff4d4d",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  // Confirm Confirmation Modal Styles
  confirmOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  confirmModal: {
    backgroundColor: "#1e2125",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  confirmTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    marginTop: 0,
    marginBottom: "12px",
  },
  confirmMessage: {
    fontSize: "14px",
    color: "#ccc",
    lineHeight: "1.5",
    marginBottom: "24px",
  },
  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  confirmCancelBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#aaa",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  confirmConfirmBtn: {
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default SettingsModal;
