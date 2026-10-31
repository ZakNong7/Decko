import React from "react";
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react";

const AlertModal = ({ title, message, type = "error", onClose }) => {
  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          {type === "success" ? (
            <CheckCircle size={32} color="#2ecc71" style={{ marginBottom: "12px" }} />
          ) : type === "info" ? (
            <Info size={32} color="#0095ff" style={{ marginBottom: "12px" }} />
          ) : (
            <AlertTriangle size={32} color="#ff4d4d" style={{ marginBottom: "12px" }} />
          )}
          <h3 style={styles.title}>{title}</h3>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>{message}</p>
        </div>
        <div style={styles.footer}>
          <button style={styles.btn} onClick={onClose}>
            OK
          </button>
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
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: "#1e2125",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "24px",
    width: "90%",
    maxWidth: "360px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#fff",
    margin: 0,
  },
  body: {
    marginTop: "12px",
    marginBottom: "20px",
  },
  message: {
    fontSize: "14px",
    color: "#ccc",
    margin: 0,
    lineHeight: "1.5",
  },
  footer: {
    width: "100%",
  },
  btn: {
    width: "100%",
    backgroundColor: "#0095ff",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default AlertModal;
