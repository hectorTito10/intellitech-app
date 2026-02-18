import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAbKTQTr5FyPTgXHfAocz4Newi1VFk1y8o",
  authDomain: "intellitech-app.firebaseapp.com",
  projectId: "intellitech-app",
  storageBucket: "intellitech-app.firebasestorage.app",
  messagingSenderId: "835740887277",
  appId: "1:835740887277:web:789a28ec48f96cb6cd84e4",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function App() {
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
    if (!fechaInicio || !fechaFin) return alert("Selecciona fechas válidas");

    const dias = diasHabiles(fechaInicio, fechaFin);

    if (dias > diasDisponibles) return alert("No tienes suficientes días");

    await addDoc(collection(db, "vacaciones"), {
      userId: user.uid,
      nombre: userData.nombre,
      inicio: fechaInicio,
      fin: fechaFin,
      dias,
      estado: "Pendiente",
    });

    setFechaInicio("");
    setFechaFin("");
    cargarVacaciones();
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
    if (!usuarioLiquidacion) return alert("Selecciona usuario");
    if (!fileToUpload) return alert("Selecciona PDF");

    const fileRef = ref(
      storage,
      `liquidaciones/${usuarioLiquidacion}/${Date.now()}-${fileToUpload.name}`
    );

    await uploadBytes(fileRef, fileToUpload);
    const url = await getDownloadURL(fileRef);

    await addDoc(collection(db, "liquidaciones"), {
      userId: usuarioLiquidacion,
      nombreArchivo: fileToUpload.name,
      url,
      fecha: new Date(),
    });

    alert("Liquidación subida");
    cargarLiquidaciones();
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
          <div className="card p-3 shadow">
            <h5>Solicitar Vacaciones</h5>

            <input
              type="date"
              className="form-control mb-2"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />

            <input
              type="date"
              className="form-control mb-2"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />

            <button
              className="btn btn-primary w-100"
              onClick={solicitarVacaciones}
            >
              Solicitar
            </button>
          </div>
        </div>
        {userData?.rol === "admin" && (
          <div className="col-12">
            <div className="card shadow p-4">
              <h5 className="mb-3">Crear Nuevo Usuario</h5>

              <div className="row">
                <div className="col-md-3">
                  <input
                    className="form-control mb-2"
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <input
                    className="form-control mb-2"
                    placeholder="Cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                  />
                </div>

                <div className="col-md-3">
                  <input
                    className="form-control mb-2"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="password"
                    className="form-control mb-2"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={fechaIngreso}
                    onChange={(e) => setFechaIngreso(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-success mt-2" onClick={register}>
                Crear Usuario
              </button>
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

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Empleado</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Días</th>
                    <th>Estado</th>
                    {userData?.rol === "admin" && <th>Acciones</th>}
                  </tr>
                </thead>

                <tbody>
                  {vacaciones
                    .filter(
                      (v) => userData?.rol === "admin" || v.userId === user?.uid
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
                                  className="btn btn-sm btn-danger"
                                  onClick={() => rechazar(v)}
                                >
                                  Rechazar
                                </button>
                              </>
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
