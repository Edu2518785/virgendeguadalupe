import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

function Home() {
  const [a, setA] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () =>
      window.history.pushState(null, "", window.location.href);

    const logged = sessionStorage.getItem("logged");
    const dni = sessionStorage.getItem("dni");

    if (!logged || !dni) {
      navigate("/login", { replace: true });
      return;
    }

    const loadData = async () => {
      const q = query(collection(db, "asociados"), where("dni", "==", dni));
      const snap = await getDocs(q);

      if (snap.empty) {
        navigate("/login", { replace: true });
        return;
      }

      setA(snap.docs[0].data());
    };

    loadData();
  }, [navigate]);

  const logout = () => {
    if (!window.confirm("¿Estás seguro de cerrar sesión?")) return;
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  if (!a) return <p>Cargando...</p>;

  return (
    <div>
      <button onClick={logout}>Cerrar sesión</button>

      <img src={a.fotoUrl} width="120" alt="Foto asociado" />

      <p><b>DNI:</b> {a.dni}</p>
      <p><b>N° Asociado:</b> {a.numeroAsociado}</p>
      <p><b>Fecha Ingreso:</b> {a.fechaIngreso}</p>

      <p><b>Nombres:</b> {a.nombres}</p>
      <p><b>Apellido Paterno:</b> {a.apellidoPaterno}</p>
      <p><b>Apellido Materno:</b> {a.apellidoMaterno}</p>

      <p><b>Fecha Nacimiento:</b> {a.fechaNacimiento}</p>
      <p><b>Departamento:</b> {a.departamento}</p>
      <p><b>Provincia:</b> {a.provincia}</p>
      <p><b>Distrito:</b> {a.distrito}</p>

      <p><b>Estado Civil:</b> {a.estadoCivil}</p>
      <p><b>Grado Instrucción:</b> {a.gradoInstruccion}</p>
      <p><b>Conviviente:</b> {a.conviviente}</p>

      <h3>Hijos</h3>
      {a.hijos?.length
        ? a.hijos.map((h, i) => (
            <p key={i}>
              {h.nombre} - {h.edad} años - {h.estudios}
            </p>
          ))
        : <p>No registra hijos</p>}
    </div>
  );
}

export default Home;
