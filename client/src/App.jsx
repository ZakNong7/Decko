import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
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
              <Dashboard />
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