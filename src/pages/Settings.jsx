import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { userData } = useAuth();
  if (userData?.rol !== "admin")
    return <div className="p-3">No autorizado.</div>;

  return (
    <div className="p-3">
      <h4 className="mb-2">Configuración</h4>
      <div className="alert alert-secondary">
        Aquí puedes configurar: tasa de acumulación (1.25), correos, políticas,
        roles, etc.
      </div>
    </div>
  );
}
