import React, { useEffect, useState } from "react";
import { Users, Layout, FolderGit2, Layers, ShieldCheck, RefreshCw, ExternalLink, UserCheck, AlertTriangle, Trash2, Settings } from "lucide-react";
import api from "../api/axios";
import UserActionModal from "./modals/UserActionModal";

const SuperAdminDashboard = ({ user, onSwitchToUserView }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'workspaces', or 'reports'
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserAction, setSelectedUserAction] = useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const handleResolveReport = async (reportId) => {
    try {
      await api.put(`/auth/reports/${reportId}/resolve`);
      fetchSystemStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDeleteUser = async (userId) => {
    try {
      await api.delete(`/auth/users/${userId}/permanent`);
      setConfirmDeleteUser(null);
      fetchSystemStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await api.put(`/auth/users/${userId}/toggle-status`);
      fetchSystemStats();
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/auth/system-stats");
      setData(response.data || null);
    } catch (err) {
      console.error("Error fetching system stats:", err);
    }

    try {
      const repRes = await api.get("/auth/reports");
      setReports(Array.isArray(repRes.data) ? repRes.data : []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const usersList = Array.isArray(data?.users) ? data.users : [];
  const workspacesList = Array.isArray(data?.workspaces) ? data.workspaces : [];
  const safeReports = Array.isArray(reports) ? reports : [];

  const filteredUsers = usersList.filter((u) => {
    const q = (searchQuery || "").toLowerCase();
    const matchSearch = (
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
    const uStatus = u.is_active !== false ? "active" : "inactive";
    const matchStatus = statusFilter === "all" || uStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredWorkspaces = workspacesList.filter((w) => {
    const q = (searchQuery || "").toLowerCase();
    return (
      (w.name || "").toLowerCase().includes(q) ||
      (w.owner_name || "").toLowerCase().includes(q) ||
      (w.invitation_code || "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={styles.container}>
      {/* HEADER BAR */}
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.badgeWrap}>
            <ShieldCheck size={22} color="#0095ff" />
          </div>
          <div>
            <h1 style={styles.title}>PANEL KONTROL SUPER ADMIN DECKO</h1>
            <p style={styles.subtitle}>Selamat datang, {user?.username} &bull; Pengawasan Platform & Resource Sistem</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={fetchSystemStats} style={styles.refreshBtn} title="Perbarui Data">
            <RefreshCw size={15} />
            Refresh
          </button>
          {onSwitchToUserView && (
            <button onClick={onSwitchToUserView} style={styles.switchBtn}>
              <UserCheck size={15} />
              Tampilan Workspace User
            </button>
          )}
        </div>
      </header>

      {/* METRICS STATS CARDS */}
      {loading ? (
        <p style={styles.loadingText}>Memuat data statistik sistem...</p>
      ) : !data ? (
        <p style={styles.loadingText}>Gagal memuat statistik platform.</p>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.iconWrap, backgroundColor: "rgba(0, 149, 255, 0.15)", color: "#0095ff" }}>
                <Users size={22} />
              </div>
              <div>
                <div style={styles.statValue}>{data.stats.totalUsers}</div>
                <div style={styles.statLabel}>Total Akun Terdaftar</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.iconWrap, backgroundColor: "rgba(155, 89, 182, 0.15)", color: "#9b59b6" }}>
                <Layout size={22} />
              </div>
              <div>
                <div style={styles.statValue}>{data.stats.totalWorkspaces}</div>
                <div style={styles.statLabel}>Total Workspace Sistem</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.iconWrap, backgroundColor: "rgba(241, 196, 15, 0.15)", color: "#f1c40f" }}>
                <FolderGit2 size={22} />
              </div>
              <div>
                <div style={styles.statValue}>{data.stats.totalBoards}</div>
                <div style={styles.statLabel}>Total Papan Proyek</div>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{ ...styles.iconWrap, backgroundColor: "rgba(46, 204, 113, 0.15)", color: "#2ecc71" }}>
                <Layers size={22} />
              </div>
              <div>
                <div style={styles.statValue}>{data.stats.totalCards}</div>
                <div style={styles.statLabel}>Total Kartu Tugas</div>
              </div>
            </div>
          </div>

          {/* MAIN MANAGEMENT CONSOLE */}
          <div style={styles.consoleBox}>
            {/* NAVIGATION TABS & SEARCH */}
            <div style={styles.consoleHeader}>
              <div style={styles.tabsGroup}>
                <button
                  style={activeTab === "users" ? styles.activeTab : styles.inactiveTab}
                  onClick={() => setActiveTab("users")}
                >
                  <Users size={16} />
                  Pengguna Sistem ({usersList.length})
                </button>
                <button
                  style={activeTab === "workspaces" ? styles.activeTab : styles.inactiveTab}
                  onClick={() => setActiveTab("workspaces")}
                >
                  <Layout size={16} />
                  Seluruh Workspace ({workspacesList.length})
                </button>
                <button
                  style={activeTab === "reports" ? styles.activeTab : styles.inactiveTab}
                  onClick={() => setActiveTab("reports")}
                >
                  <AlertTriangle size={16} color={safeReports.filter(r => r.status !== 'Selesai').length > 0 ? "#e74c3c" : "inherit"} />
                  Pusat Aduan ({safeReports.filter(r => r.status !== 'Selesai').length})
                </button>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {activeTab === "users" && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={styles.filterSelect}
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Status: Aktif</option>
                    <option value="inactive">Status: Nonaktif</option>
                  </select>
                )}
                <input
                  type="text"
                  placeholder={
                    activeTab === "users"
                      ? "Cari username / email..."
                      : activeTab === "workspaces"
                      ? "Cari workspace / owner..."
                      : "Cari laporan..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {/* TAB 1: USERS DIRECTORY */}
            {activeTab === "users" && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Username</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Nama Lengkap</th>
                      <th style={styles.th}>Status Workspace</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyTd}>Tidak ada pengguna ditemukan.</td>
                      </tr>
                    ) : (
                      filteredUsers?.map((u) => (
                        <tr key={u.id} style={styles.tr}>
                          <td style={styles.td}>#{u.id}</td>
                          <td style={{ ...styles.td, fontWeight: "700", color: "#fff" }}>{u.username}</td>
                          <td style={styles.td}>{u.email}</td>
                          <td style={styles.td}>{u.full_name || "-"}</td>
                          <td style={styles.td}>
                            {u.workspace_count} Workspace ({u.owned_workspace_count} Owner)
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {u.is_active !== false ? (
                                <span style={styles.activeBadgeBtn}>Aktif</span>
                              ) : (
                                <span style={styles.inactiveBadgeBtn}>Nonaktif</span>
                              )}

                              {(u.username || "").toLowerCase() !== "admin" && (
                                <button
                                  onClick={() => setSelectedUserAction(u)}
                                  style={styles.gearActionBtn}
                                  title="Kelola Akun (Aksi Nonaktif / Hapus)"
                                >
                                  <Settings size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: WORKSPACES MONITOR */}
            {activeTab === "workspaces" && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nama Workspace</th>
                      <th style={styles.th}>Pemilik (Owner)</th>
                      <th style={styles.th}>Kode Undangan</th>
                      <th style={styles.th}>Jumlah Papan</th>
                      <th style={styles.th}>Anggota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkspaces?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={styles.emptyTd}>Tidak ada workspace ditemukan.</td>
                      </tr>
                    ) : (
                      filteredWorkspaces?.map((w) => (
                        <tr key={w.id} style={styles.tr}>
                          <td style={styles.td}>#{w.id}</td>
                          <td style={{ ...styles.td, fontWeight: "700", color: "#fff" }}>{w.name}</td>
                          <td style={styles.td}>{w.owner_name} ({w.owner_email})</td>
                          <td style={styles.td}>
                            {w.invitation_code ? (
                              <span style={styles.codeBadge}>{w.invitation_code}</span>
                            ) : (
                              <span style={{ color: "#777" }}>Private</span>
                            )}
                          </td>
                          <td style={styles.td}>{w.board_count} Papan</td>
                          <td style={styles.td}>{w.member_count} Anggota</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: USER REPORTS INBOX */}
            {activeTab === "reports" && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Pelapor</th>
                      <th style={styles.th}>Target Terlapor</th>
                      <th style={styles.th}>Kategori Violasi</th>
                      <th style={styles.th}>Rincian Laporan</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={styles.emptyTd}>Tidak ada aduan / laporan pelanggaran.</td>
                      </tr>
                    ) : (
                      safeReports.map((r) => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.td}>#{r.id}</td>
                          <td style={styles.td}>{r.reporter_username || "Anonim"} ({r.reporter_email || "-"})</td>
                          <td style={{ ...styles.td, fontWeight: "700", color: "#e74c3c" }}>@{r.target_username}</td>
                          <td style={styles.td}>
                            <span style={styles.reasonBadge}>{r.reason}</span>
                          </td>
                          <td style={styles.td}>{r.description || "-"}</td>
                          <td style={styles.td}>
                            {r.status === "Selesai" ? (
                              <span style={styles.activeBadgeBtn}>Selesai</span>
                            ) : (
                              <span style={styles.pendingBadge}>Menunggu</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            {r.status !== "Selesai" && (
                              <button
                                onClick={() => handleResolveReport(r.id)}
                                style={styles.resolveBtn}
                                title="Tandai Selesai"
                              >
                                Tandai Selesai
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {selectedUserAction && (
        <UserActionModal
          user={selectedUserAction}
          onClose={() => setSelectedUserAction(null)}
          onUpdate={fetchSystemStats}
        />
      )}
      {confirmDeleteUser && (
        <div style={styles.confirmOverlay} onClick={() => setConfirmDeleteUser(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmIcon}>
              <AlertTriangle size={32} color="#e74c3c" />
            </div>
            <h3 style={styles.confirmTitle}>Hapus Akun Permanen?</h3>
            <p style={styles.confirmText}>
              Akun <strong>@{confirmDeleteUser.username}</strong> akan dimusnahkan secara permanen dari basis data PostgreSQL. Aksi ini tidak dapat dibatalkan.
            </p>
            <div style={styles.confirmActions}>
              <button style={styles.confirmCancel} onClick={() => setConfirmDeleteUser(null)}>
                Batal
              </button>
              <button
                style={styles.confirmDelete}
                onClick={() => handlePermanentDeleteUser(confirmDeleteUser.id)}
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "24px 36px",
    backgroundColor: "#121417",
    minHeight: "100vh",
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "18px",
  },
  badgeWrap: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "0.5px",
    color: "#fff",
  },
  subtitle: {
    fontSize: "13px",
    color: "#a0a0a0",
    margin: "3px 0 0 0",
  },
  refreshBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  switchBtn: {
    backgroundColor: "#0095ff",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  loadingText: {
    fontSize: "14px",
    color: "#a0a0a0",
    textAlign: "center",
    padding: "40px 0",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },
  statCard: {
    backgroundColor: "#1e2125",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },
  iconWrap: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: "1.2",
  },
  statLabel: {
    fontSize: "12px",
    color: "#a0a0a0",
    fontWeight: "500",
  },
  consoleBox: {
    backgroundColor: "#1e2125",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "20px",
  },
  consoleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    gap: "16px",
    flexWrap: "wrap",
  },
  tabsGroup: {
    display: "flex",
    gap: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: "4px",
    borderRadius: "10px",
  },
  activeTab: {
    backgroundColor: "#0095ff",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  inactiveTab: {
    backgroundColor: "transparent",
    color: "#a0a0a0",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterSelect: {
    backgroundColor: "#2a2e33",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    padding: "8px 12px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  },
  reasonBadge: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
  },
  pendingBadge: {
    backgroundColor: "rgba(241, 196, 15, 0.15)",
    color: "#f1c40f",
    padding: "3px 8px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "600",
  },
  resolveBtn: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    border: "1px solid rgba(46, 204, 113, 0.3)",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
  },
  searchInput: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "8px",
    padding: "8px 14px",
    color: "#fff",
    fontSize: "13px",
    width: "260px",
    outline: "none",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    textAlign: "left",
  },
  th: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: "#a0a0a0",
    padding: "12px 16px",
    fontWeight: "600",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  td: {
    padding: "12px 16px",
    color: "#ccc",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  tr: {
    ":hover": {
      backgroundColor: "rgba(255, 255, 255, 0.02)",
    },
  },
  emptyTd: {
    textAlign: "center",
    color: "#777",
    padding: "24px",
  },
  gearActionBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    padding: "5px 8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  deleteUserBtn: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    padding: "4px 8px",
    borderRadius: "8px",
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
  activeBadgeBtn: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    border: "1px solid rgba(46, 204, 113, 0.3)",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
  inactiveBadgeBtn: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
  },
  activeBadge: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    color: "#2ecc71",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600",
  },
  codeBadge: {
    backgroundColor: "rgba(0, 149, 255, 0.15)",
    color: "#0095ff",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "700",
    fontFamily: "monospace",
  },
};

export default SuperAdminDashboard;
