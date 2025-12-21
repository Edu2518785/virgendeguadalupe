import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

function Register() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    if (!dni || !password || !confirm) return setError("Completa todos los campos");
    if (dni.length !== 8) return setError("DNI inválido");
    if (password.length < 6) return setError("Contraseña muy corta");
    if (password !== confirm) return setError("Las contraseñas no coinciden");

    setLoading(true);
    try {
      const qA = query(collection(db, "asociados"), where("dni", "==", dni));
      const aSnap = await getDocs(qA);
      if (aSnap.empty) return setError("DNI no autorizado");

      const qU = query(collection(db, "usuarios"), where("dni", "==", dni));
      const uSnap = await getDocs(qU);
      if (!uSnap.empty) return setError("Este DNI ya está registrado");

      await addDoc(collection(db, "usuarios"), { dni, password });

      sessionStorage.setItem("logged", "true");
      sessionStorage.setItem("dni", dni);
      navigate("/home", { replace: true });
    } catch {
      setError("Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Registro</h2>
      <input placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} />
      <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
      <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />
      {error && <p style={{color:"red"}}>{error}</p>}
      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Procesando..." : "Registrarse"}
      </button>
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}

export default Register;
