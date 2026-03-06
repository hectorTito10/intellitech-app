import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  const login = async () => {
    if (!email || !password) return alert("Completa email y contraseña");

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      nav("/");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "url(https://images.unsplash.com/photo-1605902711622-cfb43c4437d1)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* card login */}
      <div
        className="shadow-lg"
        style={{
          width: 420,
          padding: 35,
          borderRadius: 18,
          background: "rgba(255,255,255,0.95)",
          zIndex: 10,
          animation: "fadeIn 0.8s ease",
        }}
      >
        <div className="text-center mb-4">
          <h3 className="fw-bold mb-1">Panel RRHH</h3>
          <div className="text-muted small">Sistema de gestión de personal</div>
        </div>

        <label className="form-label small text-muted">Email</label>
        <input
          className="form-control mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@empresa.cl"
        />

        <label className="form-label small text-muted">Contraseña</label>
        <input
          type="password"
          className="form-control mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <button
          className="btn btn-primary w-100 py-2"
          onClick={login}
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="text-center mt-4 small text-muted">Plataforma RRHH</div>
      </div>

      {/* animación */}
      <style>
        {`
        @keyframes fadeIn {
          from {
            opacity:0;
            transform: translateY(25px);
          }
          to {
            opacity:1;
            transform: translateY(0);
          }
        }
        `}
      </style>
    </div>
  );
}
