import React, { useEffect, useState } from "react";
import { X, RefreshCw, Trash2, Archive, AlertTriangle } from "lucide-react";
import api from "../../api/axios";

const ArchivedCardsModal = ({ boardId, onClose, onUpdate, canEditCards }) => {
  const [archivedCards, setArchivedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchArchivedCards();
  }, [boardId]);

  const fetchArchivedCards = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/cards/archived/board/${boardId}`);
      setArchivedCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (cardId) => {
    setActionLoading(true);
    try {
      await api.put(`/cards/card/${cardId}/restore`);
      setArchivedCards((prev) => prev.filter((c) => c.id !== cardId));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (cardId) => {
    setActionLoading(true);
    try {
      await api.delete(`/cards/card/${cardId}/permanent`);
      setArchivedCards((prev) => prev.filter((c) => c.id !== cardId));
      setConfirmDeleteId(null);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Archive size={18} color="#0095ff" />
            <h2 style={{ fontSize: "16px", margin: 0 }}>Arsip & Sampah Kartu</h2>
          </div>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {loading ? (
            <p style={styles.emptyText}>Memuat kartu terarsip...</p>
          ) : archivedCards.length === 0 ? (
            <p style={styles.emptyText}>Tidak ada kartu terarsip di papan ini.</p>
          ) : (
            archivedCards.map((card) => (
              <div key={card.id} style={styles.cardItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ ...styles.colorDot, backgroundColor: card.color || "#0095ff" }} />
                    <span style={{ fontWeight: "600", fontSize: "14px", color: "#fff" }}>{card.title}</span>
                  </div>
                  <span style={styles.listBadge}>Kolom: {card.list_name}</span>
                </div>

                {canEditCards && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleRestore(card.id)}
                      disabled={actionLoading}
                      style={styles.restoreBtn}
                      title="Pulihkan Kartu"
                    >
                      <RefreshCw size={14} style={{ marginRight: "4px" }} />
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(card.id)}
                      disabled={actionLoading}
                      style={styles.deleteBtn}
                      title="Hapus Permanen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {confirmDeleteId && (
          <div style={styles.confirmOverlay} onClick={() => setConfirmDeleteId(null)}>
            <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.confirmIcon}>
                <AlertTriangle size={32} color="#e74c3c" />
              </div>
              <h3 style={styles.confirmTitle}>Hapus Kartu Secara Permanen?</h3>
              <p style={styles.confirmText}>
                Aksi ini tidak dapat dibatalkan. Data kartu dan riwayat komentar akan dimusnahkan secara permanen dari basis data.
              </p>
              <div style={styles.confirmActions}>
                <button
                  style={styles.confirmCancel}
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={actionLoading}
                >
                  Batal
                </button>
                <button
                  style={styles.confirmDelete}
                  onClick={() => handlePermanentDelete(confirmDeleteId)}
                  disabled={actionLoading}
                >
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
    borderRadius: "12px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
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
    gap: "10px",
    overflowY: "auto",
    maxHeight: "60vh",
  },
  emptyText: {
    fontSize: "13px",
    color: "#a0a0a0",
    textAlign: "center",
    padding: "20px 0",
  },
  cardItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "12px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  colorDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  listBadge: {
    fontSize: "11px",
    color: "#a0a0a0",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  restoreBtn: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    color: "#0095ff",
    border: "1px solid rgba(0, 149, 255, 0.3)",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
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
    borderRadius: "16px",
    padding: "24px",
    maxWidth: "380px",
    width: "90%",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  confirmIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px auto",
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
    marginBottom: "20px",
    lineHeight: "1.4",
  },
  confirmActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  confirmCancel: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
  confirmDelete: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e74c3c",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
  },
};

export default ArchivedCardsModal;
