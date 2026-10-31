import React, { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle, Copy, Check } from "lucide-react";
import api from "../../api/axios";
import AlertModal from "./AlertModal";

const EditListModal = ({ list, onClose, onUpdate }) => {
  const [name, setName] = useState(list?.name || "");
  const [color, setColor] = useState(list?.color || "#a0a0a0");
  const [isFinal, setIsFinal] = useState(Boolean(list?.is_final));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);

  // Redesigned color states
  const [tempColor, setTempColor] = useState(list?.color || "#a0a0a0");
  const [copiedColor, setCopiedColor] = useState(false);

  useEffect(() => {
    if (list) {
      setName(list.name || "");
      setColor(list.color || "#a0a0a0");
      setTempColor(list.color || "#a0a0a0");
      setIsFinal(Boolean(list.is_final));
    }
  }, [list]);

  const handleSave = async () => {
    try {
      await api.put(`/cards/list/${list.id}`, { name, color, isFinal });
      onUpdate();
      onClose();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal memperbarui tema list.", type: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cards/list/${list.id}`);
      onUpdate();
      onClose();
    } catch (err) {
      setAlertInfo({ title: "Gagal", message: "Gagal menghapus list.", type: "error" });
    } finally {
      setShowDeleteConfirm(false);
    }
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
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  style={styles.colorInput}
                />
                <input
                  type="text"
                  style={styles.hexInput}
                  value={tempColor.toUpperCase()}
                  onChange={(e) => {
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

            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={isFinal}
                onChange={(e) => setIsFinal(e.target.checked)}
              />
              <span style={styles.checkboxText}>Jadikan sebagai akhir list (Selesai)</span>
            </label>
          </div>

          <footer style={styles.footer}>
            <button
              style={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} /> Hapus List
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
          <div style={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
            <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
              <div style={styles.confirmIcon}>
                <AlertTriangle size={32} color="#ff4d4d" />
              </div>
              <h3 style={styles.confirmTitle}>Hapus list ini?</h3>
              <p style={styles.confirmText}>
                Semua kartu di dalam list ini akan ikut terhapus secara permanen.
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
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1e2125",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "400px",
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
    gap: "20px",
  },
  section: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "11px", color: "#666", fontWeight: "800", textTransform: "uppercase" },
  input: {
    backgroundColor: "#1a1d21",
    border: "1px solid #333",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
  },
  colorInput: {
    width: "38px",
    height: "38px",
    padding: 0,
    border: "1px solid rgba(255,255,255,0.15)",
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
    gap: "10px",
    padding: "12px 14px",
    backgroundColor: "#1a1d21",
    borderRadius: "8px",
    border: "1px solid #333",
    cursor: "pointer",
  },
  checkboxText: { fontSize: "13px", color: "#ddd" },
  footer: {
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  deleteBtn: {
    background: "transparent",
    color: "#ff4d4d",
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
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  confirmModal: {
    width: "360px",
    backgroundColor: "#1e2125",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  confirmIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "32px",
    margin: "0 auto 16px",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    color: "white",
    fontSize: "18px",
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
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },
  confirmDelete: {
    flex: 1,
    backgroundColor: "#ff4d4d",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px",
    cursor: "pointer",
    fontWeight: "800",
  },
};

export default EditListModal;