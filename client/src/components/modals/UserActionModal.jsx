import React, { useState } from "react";
import { X, Settings, ShieldAlert, Trash2, CheckCircle, Clock } from "lucide-react";
import api from "../../api/axios";

const UserActionModal = ({ user, onClose, onUpdate }) => {
  const isCurrentlyActive = user.is_active !== false;
  const [banReason, setBanReason] = useState("Spam / Phishing Tautan Ilegal");
  const [customReason, setCustomReason] = useState("");
  const [durationDays, setDurationDays] = useState("7"); // default 7 days
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const finalReason = banReason === "Lainnya" ? customReason : banReason;

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (banReason === "Lainnya" && !customReason.trim()) {
      setError("Harap cantumkan rincian alasan nonaktif.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.put(`/auth/users/${user.id}/suspend`, {
        isActive: false,
        banReason: finalReason,
        durationDays: durationDays === "permanent" ? 0 : parseInt(durationDays),
      });
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menonaktifkan akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    setLoading(true);
    setError("");
    try {
      await api.put(`/auth/users/${user.id}/suspend`, {
        isActive: true,
      });
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengaktifkan kembali akun.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete(`/auth/users/${user.id}/permanent`);
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus akun permanen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings size={18} color="#0095ff" />
            <h2 style={{ fontSize: "16px", margin: 0 }}>Kelola Akun @{user.username}</h2>
          </div>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          {/* USER INFO BAR */}
          <div style={styles.infoBar}>
            <div>
              <div style={{ fontWeight: "700", color: "#fff" }}>{user.full_name || user.username}</div>
              <div style={{ fontSize: "12px", color: "#a0a0a0" }}>{user.email} &bull; ID #{user.id}</div>
            </div>
            <div>
              {isCurrentlyActive ? (
                <span style={styles.activeBadge}>Status: Aktif</span>
              ) : (
                <span style={styles.inactiveBadge}>Status: Nonaktif</span>
              )}
            </div>
          </div>

          {isCurrentlyActive ? (
            /* FORM NONAKTIFKAN AKUN */
            <form onSubmit={handleSuspend} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={styles.sectionTitle}>
                <ShieldAlert size={16} color="#e74c3c" />
                Nonaktifkan / Suspend Akun
              </div>

              <div>
                <label style={styles.label}>Alasan Pemblokiran / Nonaktif *</label>
                <select
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  style={styles.select}
                >
                  <option value="Spam / Phishing Tautan Ilegal">Spam / Phishing Tautan Ilegal</option>
                  <option value="Pelecehan / SARA / Provokasi">Pelecehan / SARA / Provokasi</option>
                  <option value="Pelanggaran Komunitas Platform">Pelanggaran Komunitas Platform</option>
                  <option value="Penggunaan Akun Palsu / Bot">Penggunaan Akun Palsu / Bot</option>
                  <option value="Lainnya">Lainnya (Ketik Rincian)</option>
                </select>
              </div>

              {banReason === "Lainnya" && (
                <div>
                  <label style={styles.label}>Rincian Alasan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mengunggah tautan berbahaya di komentar"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    style={styles.input}
                  />
                </div>
              )}

              <div>
                <label style={styles.label}>Durasi Pemblokiran *</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  style={styles.select}
                >
                  <option value="1">1 Hari</option>
                  <option value="3">3 Hari</option>
                  <option value="7">7 Hari (1 Minggu)</option>
                  <option value="30">30 Hari (1 Bulan)</option>
                  <option value="permanent">Selamanya / Permanen</option>
                </select>
              </div>

              <div style={styles.actionRow}>
                <button type="submit" style={styles.suspendBtn} disabled={loading}>
                  <ShieldAlert size={14} style={{ marginRight: "6px" }} />
                  Nonaktifkan Akun
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  style={styles.deleteUserBtn}
                  disabled={loading}
                >
                  <Trash2 size={14} style={{ marginRight: "6px" }} />
                  Hapus Permanen
                </button>
              </div>
            </form>
          ) : (
            /* STATE JIKA AKUN SUDAH NONAKTIF (UNBAN OPTION) */
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={styles.bannedNotice}>
                <div style={{ fontWeight: "700", color: "#e74c3c", marginBottom: "6px" }}>
                  Akun Ini Sedang Dinonaktifkan
                </div>
                <div style={{ fontSize: "13px", color: "#ccc", marginBottom: "4px" }}>
                  <strong>Alasan:</strong> {user.ban_reason || "Pelanggaran Aturan Komunitas"}
                </div>
                <div style={{ fontSize: "12px", color: "#a0a0a0" }}>
                  <strong>Batasan Waktu:</strong>{" "}
                  {user.ban_expires_at
                    ? new Date(user.ban_expires_at).toLocaleString("id-ID")
                    : "Selamanya / Permanen"}
                </div>
              </div>

              <div style={styles.actionRow}>
                <button type="button" onClick={handleUnban} style={styles.unbanBtn} disabled={loading}>
                  <CheckCircle size={15} style={{ marginRight: "6px" }} />
                  Aktifkan Kembali Akun (Unban)
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  style={styles.deleteUserBtn}
                  disabled={loading}
                >
                  <Trash2 size={14} style={{ marginRight: "6px" }} />
                  Hapus Permanen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONFIRM DELETE OVERLAY */}
        {confirmDelete && (
          <div style={styles.confirmOverlay} onClick={() => setConfirmDelete(false)}>
            <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.confirmTitle}>Hapus Akun Permanen?</h3>
              <p style={styles.confirmText}>
                Akun <strong>@{user.username}</strong> akan dimusnahkan secara permanen dari PostgreSQL. Aksi ini tidak dapat dibatalkan.
              </p>
              <div style={styles.confirmActions}>
                <button style={styles.confirmCancel} onClick={() => setConfirmDelete(false)}>
                  Batal
                </button>
                <button style={styles.confirmDelete} onClick={handlePermanentDelete}>
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        )}
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
    zIndex: 1100,
  },
  modal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "14px",
    width: "90%",
    maxWidth: "480px",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  errorAlert: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
  },
  infoBar: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "12px 16px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  inactiveBadge: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#a0a0a0",
    marginBottom: "6px",
    display: "block",
  },
  select: {
    width: "100%",
    backgroundColor: "#2a2e33",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#fff",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#fff",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  suspendBtn: {
    flex: 1,
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  unbanBtn: {
    flex: 1,
    backgroundColor: "#2ecc71",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteUserBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bannedNotice: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    border: "1px solid rgba(231, 76, 60, 0.2)",
    padding: "14px 16px",
    borderRadius: "10px",
  },
  confirmOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
  },
  confirmModal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "14px",
    padding: "20px",
    maxWidth: "360px",
    width: "90%",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  confirmTitle: {
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#fff",
  },
  confirmText: {
    fontSize: "13px",
    color: "#a0a0a0",
    marginBottom: "16px",
  },
  confirmActions: {
    display: "flex",
    gap: "10px",
  },
  confirmCancel: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  confirmDelete: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
};

export default UserActionModal;
