import React, { useState } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";

const LabelModal = ({
  isOpen,
  onClose,
  labels = [],
  selectedLabelIds = [],
  onToggleLabel,
  onCreateLabel,
  onDeleteLabel,
}) => {
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3498db");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    onCreateLabel(newLabelName, newLabelColor);
    setNewLabelName("");
  };


  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2>Kelola Label</h2>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {/* DAFTAR LABEL SAAT INI */}
          <div style={styles.labelList}>
            {labels.length === 0 ? (
              <p style={styles.emptyText}>Belum ada label. Buat label baru di bawah.</p>
            ) : (
              labels.map(label => {
                const isSelected = selectedLabelIds.includes(label.id);
                return (
                  <div key={label.id} style={styles.labelRow}>
                    <div
                      style={{ ...styles.labelBadge, backgroundColor: label.color }}
                      onClick={() => onToggleLabel(label.id)}
                    >
                      <span style={styles.labelText}>{label.name}</span>
                      {isSelected && <Check size={14} style={styles.checkIcon} />}
                    </div>

                    <button style={styles.deleteBtn} onClick={() => onDeleteLabel(label.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <hr style={styles.divider} />

          {/* BUAT LABEL BARU */}
          <form onSubmit={handleCreate} style={styles.form}>
            <h3 style={styles.formTitle}>Buat Label Baru</h3>
            <div style={styles.formRow}>
              <input
                style={styles.input}
                value={newLabelName}
                onChange={e => setNewLabelName(e.target.value)}
                placeholder="Nama label..."
                required
              />
              <input
                type="color"
                style={styles.colorInput}
                value={newLabelColor}
                onChange={e => setNewLabelColor(e.target.value)}
              />
              <button type="submit" style={styles.addBtn}>
                <Plus size={16} />
              </button>
            </div>
          </form>
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
    zIndex: 1100,
  },
  modal: {
    backgroundColor: "#1e2125",
    color: "#fff",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
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
  labelList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  emptyText: {
    fontSize: "13px",
    color: "#a0a0a0",
    textAlign: "center",
    padding: "12px 0",
  },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  labelBadge: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  },
  labelText: {
    color: "#fff",
  },
  checkIcon: {
    color: "#fff",
  },
  deleteBtn: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    border: "none",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    margin: "4px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
  },
  formRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    outline: "none",
  },
  colorInput: {
    border: "none",
    background: "none",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    padding: 0,
  },
  addBtn: {
    backgroundColor: "#0095ff",
    color: "#fff",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export default LabelModal;
