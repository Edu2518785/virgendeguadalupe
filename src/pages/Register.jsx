import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Register.css";

function Register() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");

    if (!dni || !password || !confirm) {
      setError("Completa todos los campos");
      return;
    }

    if (dni.length !== 8) {
      setError("DNI inválido");
      return;
    }

    if (password.length < 6) {
      setError("Contraseña muy corta");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const qA = query(collection(db, "asociados"), where("dni", "==", dni));
      const aSnap = await getDocs(qA);
      if (aSnap.empty) {
        setError("DNI no autorizado");
        return;
      }

      const asociadoData = aSnap.docs[0].data();

      const qU = query(collection(db, "usuariosNuevos"), where("dni", "==", dni));
      const uSnap = await getDocs(qU);
      if (!uSnap.empty) {
        setError("Este DNI ya está registrado");
        return;
      }

      await addDoc(collection(db, "usuariosNuevos"), {
        dni,
        numeroAsociado: asociadoData.numeroAsociado,
        password
      });

      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h2>Registro</h2>

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

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && <p className="register-error">{error}</p>}

        <button onClick={handleRegister} disabled={loading}>
          {loading ? "Procesando..." : "Registrarse"}
        </button>

        <p className="register-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
