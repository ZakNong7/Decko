import React, { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import AlertModal from "./AlertModal";

const AddListModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#0095ff");
  const [isFinal, setIsFinal] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Redesigned color states
  const [tempColor, setTempColor] = useState("#0095ff");
  const [copiedColor, setCopiedColor] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, color, isFinal);
    setName("");
    setColor("#0095ff");
    setTempColor("#0095ff");
    setIsFinal(false);
  };

  return (
    <>
      {alertInfo && (
        <AlertModal
          title={alertInfo.title}
          message={alertInfo.message}
          type={alertInfo.type}
          onClose={() => setAlertInfo(null)}
        />
      )}
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
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="color"
                  value={tempColor}
                  onChange={e => setTempColor(e.target.value)}
                  style={styles.colorInput}
                />
                <input
                  type="text"
                  style={styles.hexInput}
                  value={tempColor.toUpperCase()}
                  onChange={e => {
                    let val = e.target.value;
                    if (!val.startsWith("#")) val = "#" + val;
                    setTempColor(val);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempColor);
                    setCopiedColor(true);
                    setTimeout(() => setCopiedColor(false), 1500);
                  }}
                  style={styles.iconBtn}
                  title="Salin Kode Hex"
                >
                  {copiedColor ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                </button>
                {tempColor.toLowerCase() !== color.toLowerCase() && (
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setColor(tempColor)}
                      style={{
                        backgroundColor: "#2ecc71",
                        border: "none",
                        color: "white",
                        padding: "6px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Simpan Warna"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempColor(color)}
                      style={{
                        backgroundColor: "#ff4d4d",
                        border: "none",
                        color: "white",
                        padding: "6px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Batal"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
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
    </>
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
  colorInput: {
    width: "38px",
    height: "38px",
    padding: 0,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    background: "transparent",
    cursor: "pointer",
  },
  hexInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    width: "90px",
    fontFamily: "monospace",
    outline: "none",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "9px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  saveColorBtn: {
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  cancelColorBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#ccc",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
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
