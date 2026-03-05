import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const itemClass = ({ isActive }) =>
  `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded ${isActive ? "bg-primary text-white" : "text-dark"}`;

export default function Sidebar() {
  const { userData } = useAuth();
  const isAdmin = userData?.rol === "admin";

  return (
    <div
      className="border-end bg-white"
      style={{ width: 260, minHeight: "100vh" }}
    >
      <div className="p-3 border-bottom">
        <div className="fw-bold">RRHH Panel</div>
        <div className="text-muted small">{userData?.nombre || ""}</div>
        <div className="badge bg-secondary mt-1">
          {userData?.rol || "usuario"}
        </div>
      </div>

      <nav className="p-2">
        <div className="nav nav-pills flex-column gap-1">
          <NavLink to="/" className={itemClass}>
            🏠 Dashboard
          </NavLink>
          {isAdmin && (
            <NavLink to="/usuarios" className={itemClass}>
              👥 Usuarios
            </NavLink>
          )}
          <NavLink to="/vacaciones" className={itemClass}>
            🌴 Vacaciones
          </NavLink>
          <NavLink to="/liquidaciones" className={itemClass}>
            📄 Liquidaciones
          </NavLink>
          {isAdmin && (
            <NavLink to="/reportes" className={itemClass}>
              📊 Reportes
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/settings" className={itemClass}>
              ⚙️ Configuración
            </NavLink>
          )}
        </div>
      </nav>
    </div>
  );
}
