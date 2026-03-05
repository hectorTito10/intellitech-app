import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

const CLOUD_NAME = "dhv7uncze";
const UPLOAD_PRESET = "intellitech_unsigned";

export default function Liquidaciones() {
  const { user, userData } = useAuth();
  const isAdmin = userData?.rol === "admin";

  const [usuarios, setUsuarios] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);

  const [usuarioLiquidacion, setUsuarioLiquidacion] = useState("");
  const [fileToUpload, setFileToUpload] = useState(null);
  const [q, setQ] = useState("");

  const cargar = async () => {
    const u = await getDocs(collection(db, "usuarios"));
    setUsuarios(u.docs.map((d) => ({ id: d.id, ...d.data() })));

    const l = await getDocs(collection(db, "liquidaciones"));
    setLiquidaciones(l.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(() => {
    const base = isAdmin
      ? liquidaciones
      : liquidaciones.filter((x) => x.userId === user?.uid);
    const qq = (q || "").toLowerCase();
    return base.filter((x) =>
      `${x.nombreArchivo || ""} ${x.userId || ""}`.toLowerCase().includes(qq),
    );
  }, [liquidaciones, isAdmin, user?.uid, q]);

  const subir = async () => {
    try {
      if (!isAdmin) return alert("Solo admin puede subir");
      if (!usuarioLiquidacion) return alert("Selecciona usuario");
      if (!fileToUpload) return alert("Selecciona PDF");
      if (!fileToUpload.name.toLowerCase().endsWith(".pdf"))
        return alert("Solo PDF");

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
        return alert("Error al subir a Cloudinary");
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

      setFileToUpload(null);
      setUsuarioLiquidacion("");
      await cargar();
      alert("Liquidación subida ✅");
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    }
  };

  const eliminar = async (l) => {
    if (!isAdmin) return;
    const ok = window.confirm("¿Eliminar registro de liquidación?");
    if (!ok) return;
    await deleteDoc(doc(db, "liquidaciones", l.id));
    await cargar();
    alert("Eliminado ✅");
  };

  return (
    <div className="p-3">
      <h4 className="mb-3">Liquidaciones</h4>

      <div className="row g-3">
        {isAdmin && (
          <div className="col-md-4">
            <div className="card p-3 shadow-sm">
              <div className="fw-bold mb-2">Subir liquidación (PDF)</div>

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
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
              />
              <button className="btn btn-success w-100" onClick={subir}>
                Subir
              </button>
            </div>
          </div>
        )}

        <div className={isAdmin ? "col-md-8" : "col-12"}>
          <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">Listado</div>
              <input
                className="form-control"
                style={{ width: 280 }}
                placeholder="Buscar..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Archivo</th>
                    <th>Usuario</th>
                    <th>Acciones</th>
                    {isAdmin && <th style={{ width: 110 }}>Admin</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((l) => (
                    <tr key={l.id}>
                      <td>{l.nombreArchivo}</td>
                      <td>{l.userId}</td>
                      <td>
                        {l.url && (
                          <a
                            className="btn btn-sm btn-outline-primary me-2"
                            href={l.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver
                          </a>
                        )}
                        {l.downloadUrl && (
                          <a
                            className="btn btn-sm btn-outline-success"
                            href={l.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Descargar
                          </a>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminar(l)}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!visibles.length && (
                    <tr>
                      <td
                        colSpan={isAdmin ? 4 : 3}
                        className="text-center text-muted"
                      >
                        Sin liquidaciones
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
