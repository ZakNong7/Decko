import React, { useState } from "react";
import { X } from "lucide-react";

const AddListModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0095ff");
  const [isFinal, setIsFinal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, color, isFinal);
    setName("");
    setColor("#0095ff");
    setIsFinal(false);
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>Tambah List Baru</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <form onSubmit={handleSubmit} style={styles.body}>
          <div style={styles.section}>
            <label style={styles.label}>Nama List</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Backlog, Berjalan, Selesai..."
              required
              autoFocus
            />
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Warna Tema List</label>
            <label style={styles.colorPickerLabel}>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                style={styles.colorInput}
              />
              <span style={styles.colorHex}>{color.toUpperCase()}</span>
            </label>
          </div>

          <div style={styles.section}>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={isFinal}
                onChange={e => setIsFinal(e.target.checked)}
              />
              <span style={styles.checkboxText}>Tandai sebagai kolom selesai (Final)</span>
            </label>
          </div>

          <footer style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Tambah List
            </button>
          </footer>
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
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
    gap: "16px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  colorPickerLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    marginTop: "4px",
  },
  colorInput: {
    width: "36px",
    height: "36px",
    padding: 0,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
  },
  colorHex: {
    fontSize: "14px",
    color: "#a0a0a0",
    fontFamily: "monospace",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    userSelect: "none",
    marginTop: "6px",
  },
  checkboxText: {
    fontSize: "13px",
    color: "#ccc",
  },
  footer: {
    paddingTop: "10px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  cancelBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  submitBtn: {
    backgroundColor: "#0095ff",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AddListModal;
