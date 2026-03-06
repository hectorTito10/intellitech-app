import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Topbar from "./components/Topbar";
import MenuOffcanvas from "./components/MenuOffcanvas";
import Login from "./pages/Login";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Vacaciones = lazy(() => import("./pages/Vacaciones"));
const Liquidaciones = lazy(() => import("./pages/Liquidaciones"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Settings = lazy(() => import("./pages/Settings"));
const Empresas = lazy(() => import("./pages/Empresas"));

function Shell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="d-flex">
      <MenuOffcanvas open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div
        className="flex-grow-1"
        style={{
          minHeight: "100vh",
          background: "#f6f7f9",
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        {children}
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

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Reportes />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Settings />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />

          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <Shell>
                  <Page>
                    <Empresas />
                  </Page>
                </Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
