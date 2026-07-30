import React, { useEffect, useState } from "react";
import { X, Users, Layout, FolderGit2, Layers, ShieldCheck, Calendar } from "lucide-react";
import api from "../../api/axios";

const SystemStatsModal = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/system-stats");
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop modal-backdrop-enter" style={styles.overlay} onClick={onClose}>
      <div className="modal-panel modal-panel-enter" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={20} color="#0095ff" />
            <h2 style={{ fontSize: "16px", margin: 0, fontWeight: "700" }}>
              Panel Statistik & Admin Sistem Decko
            </h2>
          </div>
          <X onClick={onClose} style={{ cursor: "pointer" }} />
        </header>

        <div style={styles.body}>
          {loading ? (
            <p style={styles.loadingText}>Memuat statistik sistem...</p>
          ) : !data ? (
            <p style={styles.loadingText}>Gagal memuat statistik sistem.</p>
          ) : (
            <>
              {/* SYSTEM STATS WIDGET GRID */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{ ...styles.iconWrap, backgroundColor: "rgba(0, 149, 255, 0.15)", color: "#0095ff" }}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div style={styles.statValue}>{data.stats.totalUsers}</div>
                    <div style={styles.statLabel}>Pengguna Terdaftar</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.iconWrap, backgroundColor: "rgba(155, 89, 182, 0.15)", color: "#9b59b6" }}>
                    <Layout size={20} />
                  </div>
                  <div>
                    <div style={styles.statValue}>{data.stats.totalWorkspaces}</div>
                    <div style={styles.statLabel}>Total Workspace</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.iconWrap, backgroundColor: "rgba(241, 196, 15, 0.15)", color: "#f1c40f" }}>
                    <FolderGit2 size={20} />
                  </div>
                  <div>
                    <div style={styles.statValue}>{data.stats.totalBoards}</div>
                    <div style={styles.statLabel}>Total Papan Proyek</div>
                  </div>
                </div>

                <div style={styles.statCard}>
                  <div style={{ ...styles.iconWrap, backgroundColor: "rgba(46, 204, 113, 0.15)", color: "#2ecc71" }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <div style={styles.statValue}>{data.stats.totalCards}</div>
                    <div style={styles.statLabel}>Total Kartu Tugas</div>
                  </div>
                </div>
              </div>

              {/* USER MANAGEMENT TABLE */}
              <div style={styles.tableSection}>
                <h3 style={styles.tableTitle}>Daftar Akun Pengguna Terdaftar</h3>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Username</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Nama Lengkap</th>
                        <th style={styles.th}>Workspace</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((u) => (
                        <tr key={u.id} style={styles.tr}>
                          <td style={styles.td}>#{u.id}</td>
                          <td style={{ ...styles.td, fontWeight: "600", color: "#fff" }}>{u.username}</td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>{u.full_name || "-"}</td>
                          <td style={styles.td}>{u.workspace_count} Workspace ({u.owned_workspace_count} Owner)</td>
                          <td style={styles.td}>
                            <span style={styles.badgeActive}>Aktif</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
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
    borderRadius: "16px",
    width: "90%",
    maxWidth: "750px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  body: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    overflowY: "auto",
  },
  loadingText: {
    fontSize: "14px",
    color: "#a0a0a0",
    textAlign: "center",
    padding: "30px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "14px",
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    lineHeight: "1.2",
  },
  statLabel: {
    fontSize: "11px",
    color: "#a0a0a0",
    fontWeight: "500",
  },
  tableSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  tableTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#a0a0a0",
    textTransform: "uppercase",
    margin: 0,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    textAlign: "left",
  },
  th: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#a0a0a0",
    padding: "10px 14px",
    fontWeight: "600",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  },
  td: {
    padding: "10px 14px",
    color: "#ccc",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  tr: {
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.02)",
    },
  },
  badgeActive: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
};

export default SystemStatsModal;
