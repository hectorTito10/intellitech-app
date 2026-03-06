import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function Empresas() {
  const { userData } = useAuth();

  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [rut, setRut] = useState("");
  const [plan, setPlan] = useState("pro");
  const [estado, setEstado] = useState("activa");

  const [editando, setEditando] = useState(null);

  const isSuperAdmin = userData?.rol === "superadmin";

  const cargarEmpresas = async () => {
    try {
      const snap = await getDocs(collection(db, "empresas"));
      setEmpresas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      alert("Error al cargar empresas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      cargarEmpresas();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const limpiarFormulario = () => {
    setNombre("");
    setRut("");
    setPlan("pro");
    setEstado("activa");
    setEditando(null);
  };

  const guardarEmpresa = async () => {
    if (!nombre.trim()) return alert("Ingresa nombre de empresa");
    if (!rut.trim()) return alert("Ingresa RUT de empresa");

    try {
      if (editando) {
        await updateDoc(doc(db, "empresas", editando.id), {
          nombre,
          rut,
          plan,
          estado,
        });

        alert("Empresa actualizada ✅");
      } else {
        await addDoc(collection(db, "empresas"), {
          nombre,
          rut,
          plan,
          estado,
          createdAt: new Date(),
        });

        alert("Empresa creada ✅");
      }

      limpiarFormulario();
      await cargarEmpresas();
    } catch (error) {
      console.error(error);
      alert("Error al guardar empresa");
    }
  };

  const editarEmpresa = (empresa) => {
    setEditando(empresa);
    setNombre(empresa.nombre || "");
    setRut(empresa.rut || "");
    setPlan(empresa.plan || "pro");
    setEstado(empresa.estado || "activa");
  };

  const cambiarEstado = async (empresa) => {
    try {
      const nuevoEstado = empresa.estado === "activa" ? "suspendida" : "activa";

      await updateDoc(doc(db, "empresas", empresa.id), {
        estado: nuevoEstado,
      });

      await cargarEmpresas();
    } catch (error) {
      console.error(error);
      alert("Error al cambiar estado");
    }
  };

  const eliminarEmpresa = async (empresa) => {
    const ok = window.confirm(
      `¿Eliminar la empresa "${empresa.nombre}"?\n\nHaz esto solo si estás seguro.`,
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "empresas", empresa.id));
      await cargarEmpresas();
      alert("Empresa eliminada ✅");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar empresa");
    }
  };

  if (loading) return <div className="p-4">Cargando...</div>;

  if (!isSuperAdmin) {
    return (
      <div className="p-4">
        <div className="alert alert-danger mb-0">No autorizado.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="text-center mb-4">
        <h3 className="fw-bold">Empresas</h3>
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

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="mb-3">
              {editando ? "Editar empresa" : "Crear empresa"}
            </h5>

            <div className="mb-3">
              <label className="form-label small text-muted">Nombre</label>
              <input
                className="form-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Empresa Demo"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">RUT</label>
              <input
                className="form-control"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="Ej: 76.123.456-7"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">Plan</label>
              <select
                className="form-select"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="free">free</option>
                <option value="pro">pro</option>
                <option value="enterprise">enterprise</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">Estado</label>
              <select
                className="form-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="activa">activa</option>
                <option value="suspendida">suspendida</option>
              </select>
            </div>

            <button
              className="btn btn-primary w-100 mb-2"
              onClick={guardarEmpresa}
            >
              {editando ? "Guardar cambios" : "Crear empresa"}
            </button>

            {editando && (
              <button
                className="btn btn-outline-secondary w-100"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </div>

        <div className="col-md-8">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="mb-3">Listado de empresas</h5>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>RUT</th>
                    <th>Plan</th>
                    <th>Estado</th>
                    <th style={{ width: 260 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((empresa) => (
                    <tr key={empresa.id}>
                      <td>{empresa.nombre}</td>
                      <td>{empresa.rut}</td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {empresa.plan}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            empresa.estado === "activa"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {empresa.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => editarEmpresa(empresa)}
                        >
                          Editar
                        </button>

                        <button
                          className="btn btn-sm btn-outline-warning me-2"
                          onClick={() => cambiarEstado(empresa)}
                        >
                          {empresa.estado === "activa"
                            ? "Suspender"
                            : "Activar"}
                        </button>

                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarEmpresa(empresa)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!empresas.length && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No hay empresas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-muted small mt-2">
              Solo el superadmin puede administrar empresas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
