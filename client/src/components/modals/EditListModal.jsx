import React, { useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

const EditListModal = ({ list, onClose, onUpdate }) => {
  const [name, setName] = useState(list?.name || "");
  const [color, setColor] = useState(list?.color || "#a0a0a0");
  const [isFinal, setIsFinal] = useState(Boolean(list?.is_final));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    try {
      await api.put(`/cards/list/${list.id}`, { name, color, isFinal });
      onUpdate();
      onClose();
    } catch (err) {
      alert("Gagal mengupdate list");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cards/list/${list.id}`);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Gagal menghapus list");
    }
  };

  return (
    <div
      className="modal-backdrop modal-backdrop-enter"
      style={styles.overlay}
      onClick={onClose}
    >
      <div
        className="modal-panel modal-panel-enter"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={styles.header}>
          <h2>Setelan List</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>
        <div style={styles.body}>
          <div style={styles.section}>
            <p style={styles.label}>Nama List</p>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={styles.section}>
            <p style={styles.label}>Warna Tema List</p>
            <label style={styles.colorRow}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{color.toUpperCase()}</span>
            </label>
          </div>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={isFinal}
              onChange={(e) => setIsFinal(e.target.checked)}
            />
            <span style={styles.checkboxText}>Jadikan sebagai akhir list</span>
          </label>
        </div>
        <footer style={styles.footer}>
          <button
            style={styles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={16} /> Hapus
          </button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button style={styles.submitBtn} onClick={handleSave}>
              Simpan
            </button>
          </div>
        </footer>
      </div>

      {showDeleteConfirm && (
        <div
          style={styles.confirmOverlay}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmIcon}>
              <AlertTriangle size={32} color="#e74c3c" />
            </div>
            <h3 style={styles.confirmTitle}>Hapus list ini?</h3>
            <p style={styles.confirmText}>
              Semua kartu di dalam list ini akan ikut terhapus.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancel}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Batal
              </button>
              <button style={styles.confirmDelete} onClick={handleDelete}>
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
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3050,
  },
  modal: {
    backgroundColor: "#22252a",
    borderRadius: "16px",
    width: "400px",
    border: "1px solid rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  header: {
    padding: "20px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "11px", color: "#666", fontWeight: "800" },
  input: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "15px",
  },
  colorRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  colorInput: {
    width: "44px",
    height: "44px",
    padding: 0,
    border: "1px solid #333",
    borderRadius: "10px",
    background: "transparent",
    cursor: "pointer",
  },
  colorHex: {
    fontSize: "13px",
    color: "#888",
    fontFamily: "monospace",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    backgroundColor: "#1a1d21",
    borderRadius: "12px",
    border: "1px solid #333",
  },
  checkboxText: { fontSize: "13px", color: "#ddd", fontWeight: "700" },
  footer: {
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  deleteBtn: {
    background: "transparent",
    color: "#e74c3c",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
  },
  cancelBtn: {
    background: "transparent",
    color: "#a0a0a0",
    border: "none",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    padding: "8px 24px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4000,
  },
  confirmModal: {
    width: "380px",
    backgroundColor: "#212529",
    borderRadius: "20px",
    padding: "28px",
    textAlign: "center",
    border: "1px solid rgba(231,76,60,0.35)",
  },
  confirmIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    margin: "0 auto 16px",
    backgroundColor: "rgba(231,76,60,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    color: "white",
    fontSize: "20px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  confirmText: {
    color: "#a0a0a0",
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "22px",
  },
  confirmActions: { display: "flex", gap: "12px" },
  confirmCancel: {
    flex: 1,
    background: "transparent",
    color: "#a0a0a0",
    border: "1px solid #444",
    borderRadius: "12px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "700",
  },
  confirmDelete: {
    flex: 1,
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px",
    cursor: "pointer",
    fontWeight: "800",
  },
};

export default EditListModal;