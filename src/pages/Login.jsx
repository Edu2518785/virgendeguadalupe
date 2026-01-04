// Login.jsx (MISMA FUNCIONALIDAD – SOLO MENSAJE GENÉRICO)
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Login.css";

function Login() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const GENERIC_ERROR = "DNI o contraseña incorrectos";

  const handleLogin = async () => {
    setError("");

    if (!dni || !password) {
      setError("Ingrese DNI y contraseña");
      return;
    }

    if (dni.length !== 8) {
      setError(GENERIC_ERROR);
      return;
    }

    try {
      // 1️⃣ Verificar que el DNI exista en ASOCIADOS
      const qAsociado = query(
        collection(db, "asociados"),
        where("dni", "==", dni)
      );

      const asociadoSnap = await getDocs(qAsociado);

      if (asociadoSnap.empty) {
        setError(GENERIC_ERROR);
        return;
      }

      // 2️⃣ Verificar que el usuario esté registrado (usuariosNuevos)
      const qUsuario = query(
        collection(db, "usuariosNuevos"),
        where("dni", "==", dni)
      );

      const usuarioSnap = await getDocs(qUsuario);

      if (usuarioSnap.empty) {
        setError(GENERIC_ERROR);
        return;
      }

      const usuarioData = usuarioSnap.docs[0].data();

      // 3️⃣ Validar contraseña real
      if (usuarioData.password !== password) {
        setError(GENERIC_ERROR);
        return;
      }

      // 4️⃣ Login exitoso
      sessionStorage.setItem("logged", "true");
      sessionStorage.setItem("dni", dni);
      sessionStorage.setItem("numeroAsociado", usuarioData.numeroAsociado);

      navigate("/home", { replace: true });

    } catch (err) {
      setError("Error al iniciar sesión");
      console.error(err);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Iniciar sesión</h2>

        <input
          placeholder="DNI"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="login-error">{error}</p>}

        <button onClick={handleLogin}>Ingresar</button>

        <p className="login-footer">
          ¿Usuario nuevo? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
