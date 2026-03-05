import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { userData, user } = useAuth();
  const isAdmin = userData?.rol === "admin";

  const [usuarios, setUsuarios] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const u = await getDocs(collection(db, "usuarios"));
      setUsuarios(u.docs.map((d) => ({ id: d.id, ...d.data() })));

      const v = await getDocs(collection(db, "vacaciones"));
      setVacaciones(v.docs.map((d) => ({ id: d.id, ...d.data() })));

      const l = await getDocs(collection(db, "liquidaciones"));
      setLiquidaciones(l.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    cargar();
  }, []);

  const vacacionesVisibles = useMemo(() => {
    return vacaciones
      .filter((v) => !v.archivado)
      .filter((v) => isAdmin || v.userId === user?.uid);
  }, [vacaciones]);

  const pendientes = vacacionesVisibles.filter(
    (v) => v.estado === "Pendiente",
  ).length;

  const aprobadas = vacacionesVisibles.filter(
    (v) => v.estado === "Aprobado",
  ).length;

  const rechazadas = vacacionesVisibles.filter(
    (v) => v.estado === "Rechazado",
  ).length;

  const totalUsuarios = isAdmin ? usuarios.length : 1;

  const totalLiquidaciones = isAdmin
    ? liquidaciones.length
    : liquidaciones.filter((l) => l.userId === user?.uid).length;

  return (
    <div className="p-4">
      {/* TITULO */}
      <div className="text-center mb-4">
        <h3 className="fw-bold">Dashboard</h3>

        <div
          style={{
            width: "80px",
            height: "3px",
            background: "#0d6efd",
            margin: "8px auto",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* CARDS */}
      <div className="row g-4">
        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center border-0">
            <div style={{ fontSize: "28px" }}>👥</div>
            <div className="text-muted small">Usuarios</div>
            <h2 className="fw-bold">{totalUsuarios}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center border-0">
            <div style={{ fontSize: "28px" }}>🌴</div>
            <div className="text-muted small">Vacaciones pendientes</div>
            <h2 className="fw-bold text-warning">{pendientes}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center border-0">
            <div style={{ fontSize: "28px" }}>✅</div>
            <div className="text-muted small">Vacaciones aprobadas</div>
            <h2 className="fw-bold text-success">{aprobadas}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm p-3 text-center border-0">
            <div style={{ fontSize: "28px" }}>📄</div>
            <div className="text-muted small">Liquidaciones</div>
            <h2 className="fw-bold">{totalLiquidaciones}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
