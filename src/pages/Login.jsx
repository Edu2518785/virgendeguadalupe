import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginFirebaseUser, getAsociadoByDNI, getUsuarioByDNI } from "../services/firebase";
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
      // 🔹 1️⃣ Verificar que el DNI exista en ASOCIADOS
      const asociadoData = await getAsociadoByDNI(dni);
      if (!asociadoData) {
        setError(GENERIC_ERROR);
        return;
      }

      // 🔹 2️⃣ Verificar que el usuario exista en usuariosNuevos
      const usuarioData = await getUsuarioByDNI(dni);
      if (!usuarioData) {
        setError(GENERIC_ERROR);
        return;
      }

      // 🔹 3️⃣ Validar contraseña
      if (usuarioData.password !== password) {
        setError(GENERIC_ERROR);
        return;
      }

      // 🔹 4️⃣ Login exitoso en Firebase
      // Usamos un email ficticio basado en el DNI para Firebase Auth
      const firebaseUser = await loginFirebaseUser(dni + "@demo.com", password);
      if (!firebaseUser) {
        setError("Error al autenticar Firebase");
        return;
      }

      // 🔹 5️⃣ Guardar sesión local para PrivateRoute
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
