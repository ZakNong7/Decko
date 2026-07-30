import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Board from "./pages/Board";
import Landing from "./pages/Landing";

// Komponen Log untuk memantau perubahan URL
const DebugLogger = () => {
  const location = useLocation();
  useEffect(() => {
    console.log(`[ROUTE CHANGE] Path: ${location.pathname}`);
  }, [location]);
  return null;
};

// Komponen Pembungkus untuk proteksi route secara dinamis
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[DECKO ERROR BOUNDARY]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          backgroundColor: "#1e2125",
          color: "#fff",
          padding: "40px 20px",
          textAlign: "center",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <h2 style={{ color: "#e74c3c", marginBottom: "10px" }}>Terjadi Kesalahan Tampilan</h2>
          <p style={{ color: "#a0a0a0", marginBottom: "20px", maxWidth: "500px" }}>
            {this.state.error?.toString() || "Gagal memuat antarmuka."}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = window.location.origin + window.location.pathname;
            }}
            style={{
              backgroundColor: "#0095ff",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Reset Sesi & Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("[AUTH ERROR] No token. Redirecting.");
    return <Navigate to="/" replace />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <div className="route-shell route-shell-enter" key={location.pathname}>
      <Routes location={location}>
        <Route path="/" element={<Landing />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary><Dashboard /></ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* RUTE UTAMA: Menangkap /workspace/Sesuatu/ID/Sesuatu */}
        <Route
          path="/workspace/:workspaceName/:boardId/:boardName"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />

        {/* RUTE CADANGAN 3 SEGMEN: Untuk mengamankan rute jika nama papan tidak terkirim */}
        <Route
          path="/workspace/:workspaceName/:boardId"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />

        {/* RUTE CADANGAN: Jika hanya ada ID */}
        <Route
          path="/workspace/:boardId"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />

        {/* Rute lama jika masih ada link yang tertinggal */}
        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />

        {/* Catch everything else */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <DebugLogger />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;