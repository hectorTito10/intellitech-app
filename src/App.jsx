import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Topbar from "./components/Topbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Vacaciones from "./pages/Vacaciones";
import Liquidaciones from "./pages/Liquidaciones";
import Reportes from "./pages/Reportes";
import Settings from "./pages/Settings";
import MenuOffcanvas from "./components/MenuOffcanvas";

function Shell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="d-flex">
      <MenuOffcanvas open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div
        className="flex-grow-1"
        style={{ minHeight: "100vh", background: "#f6f7f9" }}
      >
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell>
                  <Dashboard />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <Shell>
                  <Usuarios />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vacaciones"
            element={
              <ProtectedRoute>
                <Shell>
                  <Vacaciones />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/liquidaciones"
            element={
              <ProtectedRoute>
                <Shell>
                  <Liquidaciones />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Reportes />
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Shell>
                  <Settings />
                </Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
