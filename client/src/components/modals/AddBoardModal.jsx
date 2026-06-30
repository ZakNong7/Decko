import React, { useState } from "react";
import { X } from "lucide-react";

const AddBoardModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name);
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>Tambah Papan Baru</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <form onSubmit={handleSave} style={styles.body}>
          <div style={styles.section}>
            <label style={styles.label}>Nama Papan</label>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama papan proyek..."
              required
              autoFocus
            />
          </div>

          <footer style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button type="submit" style={styles.submitBtn}>
              Buat Papan
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
    width: "90%",
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

export default AddBoardModal;
