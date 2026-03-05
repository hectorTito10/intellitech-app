import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, secondaryAuth } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function Usuarios() {
  const { userData, user } = useAuth();
  const isAdmin = userData?.rol === "admin";

  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState("");

  // Crear usuario
  const [newNombre, setNewNombre] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newFechaIngreso, setNewFechaIngreso] = useState("");
  const [newRol, setNewRol] = useState("usuario");

  // Modal editar
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState(null);

  const cargarUsuarios = async () => {
    const snap = await getDocs(collection(db, "usuarios"));
    setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (isAdmin) cargarUsuarios();
  }, [isAdmin]);

  const filtrados = useMemo(() => {
    const qq = (q || "").toLowerCase();
    return usuarios.filter((u) =>
      `${u.nombre || ""} ${u.email || ""} ${u.cargo || ""} ${u.rol || ""}`
        .toLowerCase()
        .includes(qq),
    );
  }, [usuarios, q]);

  const crearUsuario = async () => {
    if (!isAdmin) return alert("Solo admin");
    if (!newNombre || !newCargo || !newEmail || !newPass || !newFechaIngreso)
      return alert("Completa todo");

    try {
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        newEmail,
        newPass,
      );

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre: newNombre,
        cargo: newCargo,
        email: newEmail,
        rol: newRol,
        fechaIngreso: newFechaIngreso,
        diasExtra: 0,
        diasDescontados: 0,
      });

      // cerrar sesión secundaria (opcional)
      await signOut(secondaryAuth);

      setNewNombre("");
      setNewCargo("");
      setNewEmail("");
      setNewPass("");
      setNewFechaIngreso("");
      setNewRol("usuario");
      await cargarUsuarios();
      alert("Usuario creado ✅");
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  const abrirEditar = (u) => {
    setEdit({
      id: u.id,
      nombre: u.nombre || "",
      cargo: u.cargo || "",
      email: u.email || "",
      rol: u.rol || "usuario",
      fechaIngreso: u.fechaIngreso || "",
      diasExtra: Number(u.diasExtra || 0),
      diasDescontados: Number(u.diasDescontados || 0),
    });
    setShowModal(true);
  };

  const guardar = async () => {
    if (!edit?.id) return;
    try {
      await updateDoc(doc(db, "usuarios", edit.id), {
        nombre: edit.nombre,
        cargo: edit.cargo,
        email: edit.email,
        rol: edit.rol,
        fechaIngreso: edit.fechaIngreso,
        diasExtra: Number(edit.diasExtra || 0),
        diasDescontados: Number(edit.diasDescontados || 0),
      });
      setShowModal(false);
      setEdit(null);
      await cargarUsuarios();
      alert("Actualizado ✅");
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  const eliminarDoc = async (u) => {
    if (u.id === user?.uid)
      return alert("No puedes eliminar tu propio usuario logueado.");
    const ok = window.confirm(
      `¿Eliminar documento de Firestore del usuario "${u.nombre}"?`,
    );
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "usuarios", u.id));
      await cargarUsuarios();
      alert("Eliminado de Firestore ✅");
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  if (!isAdmin) return <div className="p-3">No autorizado.</div>;

  return (
    <div className="p-3">
      <h4 className="mb-3">Usuarios</h4>

      <div className="row g-3">
        <div className="col-12">
          <div className="card p-3 shadow-sm">
            <div className="fw-bold mb-2">Crear usuario</div>
            <div className="row g-2">
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Nombre"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Cargo"
                  value={newCargo}
                  onChange={(e) => setNewCargo(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  className="form-control"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Contraseña"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={newFechaIngreso}
                  onChange={(e) => setNewFechaIngreso(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value)}
                >
                  <option value="usuario">usuario</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="col-md-6">
                <button
                  className="btn btn-success w-100"
                  onClick={crearUsuario}
                >
                  Crear
                </button>
              </div>
            </div>

            <div className="alert alert-warning mt-3 mb-0">
              Nota: eliminar aquí borra el documento en Firestore. Para borrar
              también de Firebase Auth se requiere Cloud Functions/Admin SDK.
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">Listado</div>
              <input
                className="form-control"
                style={{ width: 320 }}
                placeholder="Buscar..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Cargo</th>
                    <th>Rol</th>
                    <th>Ingreso</th>
                    <th>Días Extra</th>
                    <th>Días Desc.</th>
                    <th style={{ width: 170 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>{u.cargo}</td>
                      <td>
                        <span
                          className={`badge ${u.rol === "admin" ? "bg-primary" : "bg-secondary"}`}
                        >
                          {u.rol}
                        </span>
                      </td>
                      <td>{u.fechaIngreso || "-"}</td>
                      <td>{u.diasExtra || 0}</td>
                      <td>{u.diasDescontados || 0}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => abrirEditar(u)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminarDoc(u)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filtrados.length && (
                    <tr>
                      <td colSpan="8" className="text-center text-muted">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && edit && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar usuario</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      value={edit.nombre}
                      onChange={(e) =>
                        setEdit({ ...edit, nombre: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      value={edit.email}
                      onChange={(e) =>
                        setEdit({ ...edit, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Cargo</label>
                    <input
                      className="form-control"
                      value={edit.cargo}
                      onChange={(e) =>
                        setEdit({ ...edit, cargo: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={edit.rol}
                      onChange={(e) =>
                        setEdit({ ...edit, rol: e.target.value })
                      }
                    >
                      <option value="usuario">usuario</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Fecha ingreso</label>
                    <input
                      type="date"
                      className="form-control"
                      value={edit.fechaIngreso}
                      onChange={(e) =>
                        setEdit({ ...edit, fechaIngreso: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Días extra</label>
                    <input
                      type="number"
                      className="form-control"
                      value={edit.diasExtra}
                      onChange={(e) =>
                        setEdit({ ...edit, diasExtra: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Días desc.</label>
                    <input
                      type="number"
                      className="form-control"
                      value={edit.diasDescontados}
                      onChange={(e) =>
                        setEdit({ ...edit, diasDescontados: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEdit(null);
                  }}
                >
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={guardar}>
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
