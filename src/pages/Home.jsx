import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../css/Home.css";

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
    <div className="home-container">
      <header className="home-header">
        <div className="user-box">
          <img src={a.fotoUrl} alt="Foto" />
          <div>
            <h2>{a.nombres} {a.apellidoPaterno}</h2>
            <span>N° {a.numeroAsociado}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="cards-grid">
        <div className="info-card"><b>DNI:</b> {a.dni}</div>
        <div className="info-card"><b>Fecha Ingreso:</b> {a.fechaIngreso}</div>
        <div className="info-card"><b>Fecha Nacimiento:</b> {a.fechaNacimiento}</div>
        <div className="info-card"><b>Estado Civil:</b> {a.estadoCivil}</div>
        <div className="info-card"><b>Grado Instrucción:</b> {a.gradoInstruccion}</div>
        <div className="info-card"><b>Conviviente:</b> {a.conviviente}</div>
        <div className="info-card"><b>Departamento:</b> {a.departamento}</div>
        <div className="info-card"><b>Provincia:</b> {a.provincia}</div>
        <div className="info-card"><b>Distrito:</b> {a.distrito}</div>
      </section>

      <section className="hijos-section">
        <h3>Hijos</h3>

        {a.hijos?.length ? (
          a.hijos.map((h, i) => (
            <div key={i} className="info-card">
              {h.nombre} — {h.edad} años — {h.estudios}
            </div>
          ))
        ) : (
          <p>No registra hijos</p>
        )}
      </section>
    </div>
  );
}

export default Home;
