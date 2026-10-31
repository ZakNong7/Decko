import AlertModal from "./AlertModal";
import React, { useState, useEffect } from "react";
import { X, Trash2, Copy, Check } from "lucide-react";
import api from "../../api/axios";

const WorkspaceSettingsModal = ({ workspace, onClose, onUpdate }) => {
  const [name, setName] = useState(workspace?.name || "");
  const [inviteCode, setInviteCode] = useState(workspace?.invitation_code || "");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom confirmation modal state for deleting workspace
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  const userRole = workspace?.role?.toLowerCase() || "member";
  const isPrivate = !inviteCode;
  const canManage = ["owner", "admin"].includes(userRole);

  useEffect(() => {
    if (workspace?.id) {
      fetchWorkspaceDetail();
    }
  }, [workspace]);

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
      setAlertInfo({ title: "Sukses", message: "Nama workspace berhasil diperbarui.", type: "success" });
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal memperbarui nama workspace.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const executeDeleteWorkspace = async () => {
    try {
      await api.delete(`/workspaces/${workspace.id}`);
      onUpdate();
      onClose();
      setAlertInfo({ title: "Sukses", message: "Workspace berhasil dihapus.", type: "success" });
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: err.response?.data?.message || "Gagal menghapus workspace.", type: "error" });
    } finally {
      setShowConfirmDelete(false);
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
          {/* UBAH NAMA WORKSPACE */}
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

          {/* KODE UNDANGAN (BISA SALIN KODE SAJA) */}
          {!isPrivate && inviteCode && (
            <div style={styles.section}>
              <label style={styles.label}>Kode Undangan Workspace</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={styles.codeBox}>{inviteCode}</div>
                <button onClick={handleCopyCode} style={styles.iconBtn} title="Salin Kode">
                  {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* ZONA BAHAYA (HAPUS WORKSPACE) */}
          {canManage && userRole === "owner" && (
            <div style={styles.dangerZone}>
              <h3 style={styles.dangerTitle}>Zona Bahaya</h3>
              <p style={styles.dangerText}>Menghapus workspace bersifat permanen dan tidak dapat dibatalkan. Semua papan dan tugas di dalamnya akan hilang!</p>
              <button onClick={() => setShowConfirmDelete(true)} style={styles.deleteBtn}>
                <Trash2 size={16} /> Hapus Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM CONFIRMATION OVERLAY FOR DELETE WORKSPACE */}
      {alertInfo && (
        <AlertModal
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
      {showConfirmDelete && (
        <div style={styles.confirmOverlay} onClick={() => setShowConfirmDelete(false)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Hapus Workspace</h3>
            <p style={styles.confirmMessage}>
              Apakah Anda yakin ingin menghapus workspace "{workspace.name}" secara permanen? Tindakan ini akan menghapus seluruh data papan proyek, list, dan kartu di dalamnya secara permanen dan tidak dapat dibatalkan.
            </p>
            <div style={styles.confirmActions}>
              <button style={styles.confirmCancelBtn} onClick={() => setShowConfirmDelete(false)}>
                Batal
              </button>
              <button style={styles.confirmConfirmBtn} onClick={executeDeleteWorkspace}>
                Hapus Permanen
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
  dangerZone: {
    border: "1px solid #ff4d4d",
    borderRadius: "8px",
    padding: "16px",
    backgroundColor: "rgba(255, 77, 77, 0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  dangerTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ff4d4d",
    textTransform: "uppercase",
    margin: 0,
  },
  dangerText: {
    fontSize: "12px",
    color: "#a0a0a0",
    margin: 0,
    lineHeight: "1.4",
  },
  deleteBtn: {
    backgroundColor: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    transition: "background 0.2s",
  },

  // Confirm Modal Styles
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
    backgroundColor: "#ff4d4d",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default WorkspaceSettingsModal;
