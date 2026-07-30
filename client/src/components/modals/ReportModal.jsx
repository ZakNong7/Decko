import React, { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";
import api from "../../api/axios";

const ReportModal = ({ onClose, onSuccess }) => {
  const [targetUsername, setTargetUsername] = useState("");
  const [reason, setReason] = useState("Spam / Phishing");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUsername.trim()) {
      setError("Username target wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reports", {
        targetUsername: targetUsername.trim(),
        reason,
        description,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengirimkan laporan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="#e74c3c" />
            <h2 style={{ fontSize: "16px", margin: 0 }}>Laporkan Pelanggaran ke Administrator</h2>
          </div>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <form onSubmit={handleSubmit} style={styles.body}>
          {error && <div style={styles.errorAlert}>{error}</div>}

          <div>
            <label style={styles.label}>Username Pengguna Terlapor *</label>
            <input
              type="text"
              required
              placeholder="Contoh: user123"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Kategori Pelanggaran *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={styles.select}>
              <option value="Spam / Phishing">Spam / Phishing Tautan Ilegal</option>
              <option value="Konten Tidak Layak">Konten / Komentar Tidak Layak</option>
              <option value="Pelecehan / SARA">Pelecehan / Provokasi / SARA</option>
              <option value="Pelanggaran Lainnya">Pelanggaran Lainnya</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Rincian Laporan (Opsional)</label>
            <textarea
              rows={3}
              placeholder="Jelaskan bentuk pelanggaran atau nama workspace..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
            />
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.cancelBtn} disabled={loading}>
              Batal
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              <Send size={14} style={{ marginRight: "6px" }} />
              {loading ? "Mengirim..." : "Kirim Laporan"}
            </button>
          </div>
        </form>
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
    maxWidth: "460px",
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
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#a0a0a0",
    marginBottom: "6px",
    display: "block",
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
  textarea: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    padding: "10px 12px",
    color: "#fff",
    fontSize: "13px",
    boxSizing: "border-box",
    resize: "vertical",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    color: "#a0a0a0",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  submitBtn: {
    backgroundColor: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
};

export default ReportModal;
