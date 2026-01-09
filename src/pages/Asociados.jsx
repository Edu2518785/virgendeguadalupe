import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate, useOutletContext } from "react-router-dom";
import "../css/Asociados.css";

function Asociados() {
  const user = useOutletContext();
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsociado, setSelectedAsociado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const [soloConDeuda, setSoloConDeuda] = useState(false);
  const [soloConDeudaGlobal, setSoloConDeudaGlobal] = useState(false);

  const [deudaGlobal, setDeudaGlobal] = useState("");
  const [pagosGlobales, setPagosGlobales] = useState([]);

  useEffect(() => {
    if (!["administrador", "asistencia", "directiva"].includes(user?.rol)) {
      navigate("/home", { replace: true });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        // ASOCIADOS
        const snap = await getDocs(collection(db, "asociados"));
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLista(data);

        // DEUDA GLOBAL
        const snapGlobal = await getDocs(collection(db, "deudaGlobal"));
        if (!snapGlobal.empty) {
          setDeudaGlobal(snapGlobal.docs[0].data().monto || "");
        } else {
          setDeudaGlobal("");
        }

        // PAGOS GLOBALES (🔥 CORREGIDO)
        const pagosSnap = await getDocs(
          collection(db, "pagosGlobales", "actual", "asociados")
        );

        const pagos = pagosSnap.docs.map(doc => doc.data().numeroAsociado);
        setPagosGlobales(pagos);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const mostrar = v => (v && v !== "" ? v : "-------------");

  const asociadosFiltrados = lista.filter(a => {
    const coincideNumero =
      busqueda === "" ||
      (a.numeroAsociado && String(a.numeroAsociado).includes(busqueda));

    const tieneDeudaPersonal =
      a.deuda && a.deuda !== "" && a.deuda !== "0" && a.deuda !== 0;

    const pagoGlobal = pagosGlobales.includes(a.numeroAsociado);

    const cumplePersonal = !soloConDeuda || tieneDeudaPersonal;
    const cumpleGlobal = !soloConDeudaGlobal || (deudaGlobal && !pagoGlobal);

    return coincideNumero && cumplePersonal && cumpleGlobal;
  });

  if (loading)
    return (
      <div className="asociados-container">
        <p style={{ color: "white" }}>Cargando asociados...</p>
      </div>
    );

  return (
    <div className="asociados-container">
      <div className="filtros-asociados">
        <h2 style={{ color: "#fff" }}>
          Asociados Registrados ({asociadosFiltrados.length})
        </h2>

        <div className="acciones-header">
          <input
            type="text"
            placeholder="🔍 Buscar por Nº de asociado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={soloConDeuda}
              onChange={e => setSoloConDeuda(e.target.checked)}
            />
            Solo deuda personal
          </label>

          <label>
            <input
              type="checkbox"
              checked={soloConDeudaGlobal}
              onChange={e => setSoloConDeudaGlobal(e.target.checked)}
            />
            Solo deuda global
          </label>
        </div>
      </div>

      <div className="grid-asociados">
        {asociadosFiltrados.map(a => {
          const pagoGlobal = pagosGlobales.includes(a.numeroAsociado);

          return (
            <div
              key={a.id}
              className={`card-asociado ${selectedAsociado?.id === a.id ? "active" : ""}`}
              onClick={() => setSelectedAsociado(a)}
            >
              <div className="card-asociado-header">
                <span>{a.nombres} {a.apellidoPaterno}</span>
                <span>N° {a.numeroAsociado}</span>
              </div>

              <div className="detalle-asociado">
                <p>DNI: {mostrar(a.dni)}</p>
                <p>Deuda personal: S/ {mostrar(a.deuda)}</p>
                <p>
                  Deuda global:{" "}
                  {deudaGlobal === ""
                    ? "No aplica"
                    : pagoGlobal
                    ? "PAGADO ✅"
                    : "DEBE ❌"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Asociados;
