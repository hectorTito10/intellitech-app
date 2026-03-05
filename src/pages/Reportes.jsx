import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Reportes() {
  const { userData } = useAuth();

  if (userData?.rol !== "admin") {
    return <div className="p-3">No autorizado.</div>;
  }

  return (
    <div className="p-3">
      <h4 className="mb-2">Reportes</h4>
      <div className="alert alert-secondary mb-0">
        Aquí irán los reportes (vacaciones por mes, días usados por usuario,
        etc).
      </div>
    </div>
  );
}
