import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Topbar from "./components/Topbar";
import MenuOffcanvas from "./components/MenuOffcanvas";

import Login from "./pages/Login";

// ✅ Lazy load pages (code-splitting)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Vacaciones = lazy(() => import("./pages/Vacaciones"));
const Liquidaciones = lazy(() => import("./pages/Liquidaciones"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Settings = lazy(() => import("./pages/Settings"));
// Si ya creaste Perfil, descomenta:
// const Perfil = lazy(() => import("./pages/Perfil"));

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
        <div className="p-0">{children}</div>
      </div>
    </div>
  );
}

function Page({ children }) {
  return (
    <Suspense fallback={<div className="p-4">Cargando...</div>}>
      {children}
    </Suspense>
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
                  <Page>
                    <Dashboard />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Usuarios />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vacaciones"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Vacaciones />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/liquidaciones"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Liquidaciones />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          {/* Si agregas Perfil:
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Perfil />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />
          */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
