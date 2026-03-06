import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onOpenMenu }) {
  const { logout, userData } = useAuth();

  return (
    <div
      className="border-bottom bg-white px-3 py-2"
      style={{ width: "100%", overflowX: "hidden" }}
    >
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div
          className="d-flex align-items-center gap-2"
          style={{ minWidth: 0, flex: "1 1 auto" }}
        >
          <button
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={() => onOpenMenu?.()}
            type="button"
          >
            ☰
          </button>

          <div style={{ minWidth: 0, lineHeight: 1.1 }}>
            <div className="fw-semibold text-truncate">Panel RRHH</div>
            <div className="text-muted small text-truncate">
              {userData?.nombre || ""}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button className="btn btn-outline-danger btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
