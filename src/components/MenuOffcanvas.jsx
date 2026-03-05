import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItem = ({ isActive }) =>
  `d-flex align-items-start gap-3 px-3 py-2 rounded-3 text-decoration-none ${
    isActive ? "bg-primary text-white" : "text-dark"
  }`;

function Item({ to, icon, title, desc, badge, onClose }) {
  return (
    <NavLink to={to} className={navItem} onClick={onClose}>
      <div style={{ fontSize: 18, lineHeight: "18px", marginTop: 2 }}>
        {icon}
      </div>
      <div className="flex-grow-1">
        <div className="d-flex align-items-center justify-content-between">
          <div className="fw-semibold">{title}</div>
          {badge ? (
            <span className="badge bg-warning text-dark">{badge}</span>
          ) : null}
        </div>
        <div className="small opacity-75">{desc}</div>
      </div>
    </NavLink>
  );
}

export default function MenuOffcanvas({ open, onClose, badges = {} }) {
  const { userData } = useAuth();
  const isAdmin = userData?.rol === "admin";

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1040,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: 320,
          background: "#fff",
          zIndex: 1050,
          boxShadow: "0 0 30px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-3 border-bottom"
          style={{
            background:
              "linear-gradient(135deg, rgba(13,110,253,0.12), rgba(25,135,84,0.08))",
          }}
        >
          <div className="d-flex justify-content-between align-items-start">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "rgba(13,110,253,0.15)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  color: "#0d6efd",
                }}
              >
                {(userData?.nombre || "U").trim().slice(0, 1).toUpperCase()}
              </div>

              <div>
                <div className="fw-bold" style={{ lineHeight: 1.1 }}>
                  Panel RRHH
                </div>
                <div className="small text-muted">
                  {userData?.nombre || "Usuario"}
                </div>
                <span className="badge bg-secondary mt-1">
                  {userData?.rol || "usuario"}
                </span>
              </div>
            </div>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3" style={{ overflowY: "auto" }}>
          <div className="text-uppercase small text-muted fw-semibold mb-2">
            Principal
          </div>
          <div className="d-grid gap-2">
            <Item
              to="/"
              icon="🏠"
              title="Dashboard"
              desc="Resumen y métricas."
              onClose={onClose}
            />
            <Item
              to="/vacaciones"
              icon="🌴"
              title="Vacaciones"
              desc="Solicitudes y aprobaciones."
              badge={
                badges.pendientes ? `Pendientes: ${badges.pendientes}` : ""
              }
              onClose={onClose}
            />
            <Item
              to="/liquidaciones"
              icon="📄"
              title="Liquidaciones"
              desc="Ver y descargar PDFs."
              onClose={onClose}
            />
          </div>

          {isAdmin && (
            <>
              <hr className="my-3" />
              <div className="text-uppercase small text-muted fw-semibold mb-2">
                Administración
              </div>
              <div className="d-grid gap-2">
                <Item
                  to="/usuarios"
                  icon="👥"
                  title="Usuarios"
                  desc="Crear y editar personal."
                  onClose={onClose}
                />
              </div>
            </>
          )}
        </div>

        <div className="border-top p-3">
          <div className="small text-muted">Tip: usa el menú para navegar.</div>
        </div>
      </div>
    </>
  );
}
