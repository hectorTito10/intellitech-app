import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function Vacaciones() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.rol === "admin" || userData?.rol === "superadmin";

  const [vacaciones, setVacaciones] = useState([]);
  const [filtro, setFiltro] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const cargar = async () => {
    if (!userData) return;

    let qRef;

    if (userData?.rol === "superadmin") {
      qRef = collection(db, "vacaciones");
    } else {
      qRef = query(
        collection(db, "vacaciones"),
        where("empresaId", "==", userData?.empresaId),
      );
    }

    const snap = await getDocs(qRef);
    setVacaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (userData) {
      cargar();
    }
  }, [userData]);

  const mesesTrabajados = () => {
    if (!userData?.fechaIngreso) return 0;
    const ingreso = new Date(userData.fechaIngreso + "T00:00:00");
    const hoy = new Date();
    let meses =
      (hoy.getFullYear() - ingreso.getFullYear()) * 12 +
      (hoy.getMonth() - ingreso.getMonth());
    if (hoy.getDate() < ingreso.getDate()) meses--;
    return meses >= 0 ? meses : 0;
  };

  const diasAcumulados = () => mesesTrabajados() * 1.25;

  const diasDisponibles = userData
    ? diasAcumulados() +
      (userData.diasExtra || 0) -
      (userData.diasDescontados || 0)
    : 0;

  const diasHabiles = (inicio, fin) => {
    let count = 0;
    let current = new Date(inicio);
    const end = new Date(fin);
    while (current <= end) {
      if (current.getDay() !== 0 && current.getDay() !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const solicitar = async () => {
    if (!fechaInicio || !fechaFin) return alert("Selecciona fechas");
    const dias = diasHabiles(fechaInicio, fechaFin);
    if (dias > diasDisponibles) return alert("No tienes suficientes días");

    await addDoc(collection(db, "vacaciones"), {
      userId: user.uid,
      empresaId: userData?.empresaId || "demo_empresa",
      nombre: userData?.nombre || "",
      inicio: fechaInicio,
      fin: fechaFin,
      dias,
      estado: "Pendiente",
      archivado: false,
      fechaSolicitud: new Date(),
    });

    setFechaInicio("");
    setFechaFin("");
    await cargar();
    alert("Solicitud enviada ✅");
  };

  const aprobar = async (v) => {
    await updateDoc(doc(db, "vacaciones", v.id), {
      estado: "Aprobado",
      aprobadoPor: userData?.nombre || "",
    });

    const userRef = doc(db, "usuarios", v.userId);
    const snap = await getDoc(userRef);

    await updateDoc(userRef, {
      diasDescontados: (snap.data().diasDescontados || 0) + v.dias,
    });

    await cargar();
    alert("Aprobada ✅");
  };

  const rechazar = async (v) => {
    await updateDoc(doc(db, "vacaciones", v.id), {
      estado: "Rechazado",
      aprobadoPor: userData?.nombre || "",
    });
    await cargar();
    alert("Rechazada ✅");
  };

  const archivar = async (v) => {
    const ok = window.confirm(
      `¿Quitar de la lista la solicitud de ${v.nombre}?`,
    );
    if (!ok) return;

    await updateDoc(doc(db, "vacaciones", v.id), { archivado: true });
    await cargar();
  };

  const visibles = useMemo(() => {
    return vacaciones
      .filter((v) => !v.archivado)
      .filter((v) => isAdmin || v.userId === user?.uid)
      .filter((v) =>
        (v.nombre || "").toLowerCase().includes((filtro || "").toLowerCase()),
      );
  }, [vacaciones, isAdmin, user?.uid, filtro]);

  const pendientes = visibles.filter((v) => v.estado === "Pendiente").length;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Vacaciones</h4>
        <div className="text-muted small">
          Días disponibles: <b>{diasDisponibles.toFixed(2)}</b>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <div className="card p-3 shadow-sm">
            <div className="fw-bold mb-2">Solicitar</div>
            <label className="form-label small text-muted">Desde</label>
            <input
              type="date"
              className="form-control mb-2"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
            <label className="form-label small text-muted">Hasta</label>
            <input
              type="date"
              className="form-control mb-3"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
            <button className="btn btn-primary w-100" onClick={solicitar}>
              Solicitar
            </button>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">Solicitudes</div>
              <input
                className="form-control"
                style={{ width: 280 }}
                placeholder="Buscar empleado..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Días</th>
                    <th>Estado</th>
                    {isAdmin && <th style={{ width: 260 }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((v) => (
                    <tr key={v.id}>
                      <td>{v.nombre}</td>
                      <td>{v.inicio}</td>
                      <td>{v.fin}</td>
                      <td>{v.dias}</td>
                      <td>
                        <span
                          className={`badge ${
                            v.estado === "Aprobado"
                              ? "bg-success"
                              : v.estado === "Rechazado"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                          }`}
                        >
                          {v.estado}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          {v.estado === "Pendiente" ? (
                            <>
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => aprobar(v)}
                              >
                                Aprobar
                              </button>
                              <button
                                className="btn btn-sm btn-danger me-2"
                                onClick={() => rechazar(v)}
                              >
                                Rechazar
                              </button>
                            </>
                          ) : null}

                          {v.estado !== "Pendiente" && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => archivar(v)}
                            >
                              Quitar de la lista
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}

                  {!visibles.length && (
                    <tr>
                      <td
                        colSpan={isAdmin ? 6 : 5}
                        className="text-center text-muted"
                      >
                        Sin solicitudes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
