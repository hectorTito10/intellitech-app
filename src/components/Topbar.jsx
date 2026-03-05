import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onOpenMenu }) {
  const { logout, userData } = useAuth();

  return (
    <div className="d-flex justify-content-between align-items-center border-bottom bg-white px-3 py-2">
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onOpenMenu?.()}
          type="button"
        >
          ☰
        </button>

        <div style={{ lineHeight: 1.1 }}>
          <div className="fw-semibold">Panel RRHH</div>
          <div className="text-muted small">{userData?.nombre}</div>
        </div>
      </div>

      <button className="btn btn-outline-danger btn-sm" onClick={logout}>
        Salir
      </button>
    </div>
  );
}
