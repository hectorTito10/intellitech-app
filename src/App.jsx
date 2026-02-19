import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-datepicker/dist/react-datepicker.css";
import { useMemo } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAbKTQTr5FyPTgXHfAocz4Newi1VFk1y8o",
  authDomain: "intellitech-app.firebaseapp.com",
  projectId: "intellitech-app",
  storageBucket: "intellitech-app.appspot.com",
  messagingSenderId: "835740887277",
  appId: "1:835740887277:web:789a28ec48f96cb6cd84e4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const CLOUD_NAME = "dhv7uncze";
const UPLOAD_PRESET = "intellitech_unsigned";

export default function App() {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [notificacion, setNotificacion] = useState(null);
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [usuarioLiquidacion, setUsuarioLiquidacion] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [showLiqModal, setShowLiqModal] = useState(false);

  const abrirLiquidaciones = () => setShowLiqModal(true);
  const cerrarLiquidaciones = () => setShowLiqModal(false);

  // ===== AUTH STATE =====
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await cargarDatos(u.uid);
        await cargarUsuarios();
        await cargarVacaciones();
        await cargarLiquidaciones();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const abrirPdfEnModal = (url) => {
    if (!url) return;

    const inlineUrl = url + "?fl_attachment=false";

    setPdfPreviewUrl(inlineUrl);
    setShowPdfModal(true);
  };

  const cerrarPdf = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl("");
  };

  const cargarDatos = async (uid) => {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (snap.exists()) setUserData({ id: uid, ...snap.data() });
  };

  const cargarUsuarios = async () => {
    const snap = await getDocs(collection(db, "usuarios"));
    setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const cargarVacaciones = async () => {
    const snap = await getDocs(collection(db, "vacaciones"));
    setVacaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };
  const diasTotales = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 0;

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) return -1;

    const diferencia = fin - inicio;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
  }, [fechaInicio, fechaFin]);

  const cargarLiquidaciones = async () => {
    const snap = await getDocs(collection(db, "liquidaciones"));
    setLiquidaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // ===== CÁLCULOS =====
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

  const vacacionesVisibles = vacaciones
    .filter((v) => !v.archivado)
    .filter((v) => userData?.rol === "admin" || v.userId === user?.uid)
    .filter((v) =>
      (v?.nombre || "")
        .toLowerCase()
        .includes((filtroNombre || "").toLowerCase()),
    );

  const countPendientes = vacacionesVisibles.filter(
    (v) => v.estado === "Pendiente",
  ).length;
  const countAprobadas = vacacionesVisibles.filter(
    (v) => v.estado === "Aprobado",
  ).length;
  const countRechazadas = vacacionesVisibles.filter(
    (v) => v.estado === "Rechazado",
  ).length;

  // ===== LOGIN =====
  const login = async () => {
    if (!email || !password) return alert("Completa email y contraseña");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ===== REGISTER =====
  const register = async () => {
    if (userData?.rol !== "admin")
      return alert("Solo el administrador puede crear usuarios");

    if (!email || !password || !nombre || !cargo || !fechaIngreso)
      return alert("Completa todos los campos");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre,
        cargo,
        email,
        rol: "usuario",
        fechaIngreso: fechaIngreso,
        diasExtra: 0,
        diasDescontados: 0,
      });

      alert("Usuario creado correctamente");

      setNombre("");
      setCargo("");
      setEmail("");
      setPassword("");
      setFechaIngreso("");

      cargarUsuarios();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  // ===== VACACIONES =====

  const solicitarVacaciones = async () => {
    if (!fechaInicio || !fechaFin) {
      setNotificacion({
        tipo: "error",
        mensaje: "Selecciona fechas válidas",
      });
      return;
    }

    const dias = diasHabiles(fechaInicio, fechaFin);

    if (dias > diasDisponibles) {
      setNotificacion({
        tipo: "error",
        mensaje: "No tienes suficientes días disponibles",
      });
      return;
    }

    try {
      await addDoc(collection(db, "vacaciones"), {
        userId: user.uid,
        nombre: userData?.nombre || "",
        inicio: fechaInicio,
        fin: fechaFin,
        dias,
        estado: "Pendiente",
        archivado: false, // ✅
        fechaSolicitud: new Date(),
      });

      setFechaInicio("");
      setFechaFin("");
      cargarVacaciones();

      setNotificacion({
        tipo: "success",
        mensaje: "Solicitud enviada correctamente",
      });
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje: "Error al enviar la solicitud",
      });
    }

    setTimeout(() => {
      setNotificacion(null);
    }, 3000);
  };

  const aprobar = async (v) => {
    try {
      // Cambiar estado
      await updateDoc(doc(db, "vacaciones", v.id), {
        estado: "Aprobado",
        aprobadoPor: userData.nombre,
      });

      // Descontar días al usuario
      const userRef = doc(db, "usuarios", v.userId);
      const snap = await getDoc(userRef);

      await updateDoc(userRef, {
        diasDescontados: (snap.data().diasDescontados || 0) + v.dias,
      });

      cargarVacaciones();
      cargarUsuarios();
    } catch (err) {
      alert("Error al aprobar: " + err.message);
    }
  };

  const rechazar = async (v) => {
    try {
      await updateDoc(doc(db, "vacaciones", v.id), {
        estado: "Rechazado",
        aprobadoPor: userData.nombre,
      });

      cargarVacaciones();
    } catch (err) {
      alert("Error al rechazar: " + err.message);
    }
  };

  // ===== SUBIR LIQUIDACIÓN =====
  const subirLiquidacion = async () => {
    try {
      if (!usuarioLiquidacion) return alert("Selecciona usuario");
      if (!fileToUpload) return alert("Selecciona PDF");
      if (!fileToUpload.name.toLowerCase().endsWith(".pdf"))
        return alert("Solo archivos PDF");

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", `liquidaciones/${usuarioLiquidacion}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Cloudinary error:", data);
        return alert("Error al subir PDF a Cloudinary");
      }

      const url = data.secure_url;

      const downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");

      await addDoc(collection(db, "liquidaciones"), {
        userId: usuarioLiquidacion,
        nombreArchivo: fileToUpload.name,
        url,
        downloadUrl,
        fecha: new Date(),
      });

      alert("Liquidación subida correctamente ✅");

      setFileToUpload(null);
      setUsuarioLiquidacion("");
      cargarLiquidaciones();
    } catch (error) {
      console.error(error);
      alert("Error inesperado: " + error.message);
    }
  };

  const archivarVacacion = async (v) => {
    const confirmar = window.confirm(`¿Archivar la solicitud de ${v.nombre}?`);

    if (!confirmar) return;

    await updateDoc(doc(db, "vacaciones", v.id), {
      archivado: true,
    });

    cargarVacaciones();
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  // ===== LOGIN UI =====
  if (!user)
    return (
      <div className="container vh-100 d-flex justify-content-center align-items-center">
        <div className="card p-4 shadow" style={{ width: "400px" }}>
          <h4 className="text-center mb-3">Login RRHH</h4>

          <input
            className="form-control mb-2"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="form-control mb-3"
            placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="btn btn-primary w-100" onClick={login}>
            Ingresar
          </button>
        </div>
      </div>
    );

  // ===== DASHBOARD =====
  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">{userData?.nombre}</h4>
          <small className="text-muted">{userData?.rol}</small>
        </div>
        <button className="btn btn-danger" onClick={logout}>
          Salir
        </button>
      </div>

      <div className="row g-4">
        {/* Días disponibles */}
        <div className="col-md-4">
          <div className="card p-3 shadow text-center">
            <h5>Días disponibles</h5>
            <h2 className="text-primary">{diasDisponibles.toFixed(2)}</h2>
          </div>
        </div>

        {/* Solicitar Vacaciones */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 p-4">
            <h5 className="mb-3 fw-bold text-secondary">
              Solicitar Vacaciones
            </h5>

            <div className="mb-3">
              <label className="form-label small text-muted">Desde</label>
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted">Hasta</label>
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            {/* Resultado dinámico */}
            {fechaInicio && fechaFin && (
              <div className="mb-3">
                {diasTotales === -1 ? (
                  <div className="alert alert-danger py-2 mb-0">
                    La fecha final no puede ser menor que la inicial.
                  </div>
                ) : (
                  <div className="bg-light rounded-3 p-3 text-center border">
                    <span className="text-muted small">Total solicitado</span>
                    <div className="fs-5 fw-bold text-primary">
                      {diasTotales} día{diasTotales > 1 && "s"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 🔔 NOTIFICACIÓN FUERA DEL LAYOUT */}
            {notificacion && (
              <div
                className={`toast-custom ${
                  notificacion.tipo === "success"
                    ? "toast-success"
                    : "toast-error"
                }`}
              >
                {notificacion.mensaje}
              </div>
            )}
            <button
              className="btn btn-primary w-100 py-2 fw-semibold"
              onClick={solicitarVacaciones}
              disabled={diasTotales <= 0}
            >
              Solicitar
            </button>
          </div>
        </div>

        {userData?.rol === "admin" && (
          <div className="col-12">
            <div className="card shadow-sm p-4 border-0">
              <h5 className="mb-4 fw-bold text-secondary">
                Crear Nuevo Usuario
              </h5>

              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small text-muted">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ingrese nombre"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label small text-muted">Email</label>
                  <input type="email" className="form-control" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small text-muted">
                    Contraseña
                  </label>
                  <input type="password" className="form-control" />
                </div>

                <div className="col-md-3">
                  <label className="form-label small text-muted">
                    Fecha de ingreso
                  </label>
                  <input type="date" className="form-control" />
                </div>

                <div className="col-12 mt-3">
                  <button className="btn btn-success w-100 py-2 fw-semibold">
                    Crear Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subir Liquidación (ADMIN) */}
        {userData?.rol === "admin" && (
          <div className="col-md-4">
            <div className="card p-3 shadow">
              <h5>Subir Liquidación</h5>

              <select
                className="form-select mb-2"
                value={usuarioLiquidacion}
                onChange={(e) => setUsuarioLiquidacion(e.target.value)}
              >
                <option value="">Seleccionar usuario</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>

              <input
                type="file"
                className="form-control mb-2"
                accept=".pdf"
                onChange={(e) => setFileToUpload(e.target.files[0])}
              />

              <button
                className="btn btn-success w-100"
                onClick={subirLiquidacion}
              >
                Subir
              </button>
            </div>
          </div>
        )}

        {/* TABLA SOLICITUDES */}
        <div className="col-12">
          <div className="card shadow p-3">
            <h5 className="mb-3">Solicitudes de Vacaciones</h5>
            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small">Pendientes</div>
                  <div className="fs-5 fw-bold text-warning">
                    {countPendientes}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small">Aprobadas</div>
                  <div className="fs-5 fw-bold text-success">
                    {countAprobadas}
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small">Rechazadas</div>
                  <div className="fs-5 fw-bold text-danger">
                    {countRechazadas}
                  </div>
                </div>
              </div>
            </div>
            {/* 👇 CONTADOR AQUÍ */}
            <p className="text-muted small mb-3">
              Mostrando{" "}
              {
                vacacionesVisibles.map(
                  (v) =>
                    !v.archivado &&
                    (userData?.rol === "admin" || v.userId === user?.uid),
                ).length
              }{" "}
              solicitudes activas
            </p>
            <div className="input-group mb-3">
              <span className="input-group-text bg-white">🔍</span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar empleado..."
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
              />
            </div>
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre empleado</th>
                    <th>Inicio de vacaciones</th>
                    <th>Fin de vacaciones</th>
                    <th>Días solicitados</th>
                    <th>Estado de solicitud</th>
                    {userData?.rol === "admin" && <th>Acciones</th>}
                  </tr>
                </thead>

                <tbody>
                  {vacaciones
                    .filter((v) => !v.archivado)
                    .filter(
                      (v) =>
                        userData?.rol === "admin" || v.userId === user?.uid,
                    )
                    .filter((v) =>
                      (v?.nombre || "")
                        .toLowerCase()
                        .includes((filtroNombre || "").toLowerCase()),
                    )
                    .map((v) => (
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

                        {userData?.rol === "admin" && (
                          <td>
                            {v.estado === "Pendiente" && (
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
                            )}

                            {v.estado !== "Pendiente" && !v.archivado && (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => archivarVacacion(v)}
                              >
                                Quitar de la lista
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
