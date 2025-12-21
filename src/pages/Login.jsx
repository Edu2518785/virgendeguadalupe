import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

function Login() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    if (!dni || !password) {
      setError("Ingrese DNI y contraseña");
      return;
    }

    if (dni.length !== 8) {
      setError("DNI inválido");
      return;
    }

    try {
      const q = query(
        collection(db, "asociados"),
        where("dni", "==", dni)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("DNI no registrado");
        return;
      }

      // 🔐 validación básica de contraseña (simulada)
      if (password.length < 6) {
        setError("Contraseña incorrecta");
        return;
      }

      sessionStorage.setItem("logged", "true");
      sessionStorage.setItem("dni", dni);

      navigate("/home", { replace: true });

    } catch (err) {
      setError("Error al iniciar sesión");
      console.error(err);
    }
  };

  return (
    <div>
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

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={handleLogin}>Ingresar</button>

      <p>
        ¿Usuario nuevo? <Link to="/register">Regístrate</Link>
      </p>
    </div>
  );
}

export default Login;
