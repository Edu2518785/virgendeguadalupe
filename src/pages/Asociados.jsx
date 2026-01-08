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

  useEffect(() => {
    if (!["administrador", "asistencia", "directiva"].includes(user.rol)) {
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

        // DEUDA GLOBAL (campo CORRECTO: monto)
        const snapGlobal = await getDocs(collection(db, "deudaGlobal"));
        if (!snapGlobal.empty) {
          const globalData = snapGlobal.docs[0].data();
          setDeudaGlobal(globalData.monto || "");
        }

      } catch (error) {
        console.error("Error al cargar asociados:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const mostrar = valor => (valor && valor !== "" ? valor : "-------------");

  const asociadosFiltrados = lista.filter(a => {
    const coincideNumero =
      busqueda === "" ||
      (a.numeroAsociado && String(a.numeroAsociado).includes(busqueda));

    const tieneDeudaPersonal =
      a.deuda && a.deuda !== "" && a.deuda !== "0" && a.deuda !== 0;

    const cumpleDeudaPersonal = !soloConDeuda || tieneDeudaPersonal;
    const cumpleDeudaGlobal = !soloConDeudaGlobal || deudaGlobal !== "";

    return coincideNumero && cumpleDeudaPersonal && cumpleDeudaGlobal;
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
        <h2 style={{ margin: 0, color: "#fff" }}>
          Asociados Registrados ({asociadosFiltrados.length})
        </h2>

        <div className="acciones-header">
          <input
            type="text"
            className="input-busqueda"
            placeholder="🔍 Buscar por Nº de asociado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={soloConDeuda}
              onChange={e => setSoloConDeuda(e.target.checked)}
            />
            Solo con deuda personal
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={soloConDeudaGlobal}
              onChange={e => setSoloConDeudaGlobal(e.target.checked)}
            />
            Solo con deuda global
          </label>
        </div>
      </div>

      <div className="grid-asociados">
        {asociadosFiltrados.map(a => {
          const tieneDeuda =
            a.deuda && a.deuda !== "" && a.deuda !== "0" && a.deuda !== 0;

          return (
            <div
              key={a.id}
              className={`card-asociado ${
                selectedAsociado?.id === a.id ? "active" : ""
              }`}
              onClick={() =>
                setSelectedAsociado(prev =>
                  prev?.id === a.id ? null : a
                )
              }
            >
              <div className="card-asociado-header">
                <span className="nombre-asociado">
                  {a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}
                </span>
                <span className="badge-numero">N° {a.numeroAsociado}</span>
              </div>

              <div className="detalle-asociado">
                <div className="info-box">
                  <span className="info-label">D.N.I.</span>
                  <span className="info-value">{mostrar(a.dni)}</span>
                </div>

                <div className="info-box">
                  <span className="info-label">Deuda personal</span>
                  <span className={`info-value deuda-badge ${tieneDeuda ? "con-deuda" : "sin-deuda"}`}>
                    S/ {mostrar(a.deuda)}
                  </span>
                </div>

                <div className="info-box">
                  <span className="info-label">Deuda general</span>
                  <span className="info-value">
                    {deudaGlobal !== "" ? deudaGlobal : "Sin deuda general"}
                  </span>
                </div>
              </div>

              {selectedAsociado?.id === a.id && (
                <div className="seccion-expandida">
                  <hr />
                  <div className="detalle-grid-completo">
                    <div className="info-box"><span className="info-label">Fecha Ingreso</span><span className="info-value">{mostrar(a.fechaIngreso)}</span></div>
                    <div className="info-box"><span className="info-label">F. Nacimiento</span><span className="info-value">{mostrar(a.fechaNacimiento)}</span></div>
                    <div className="info-box"><span className="info-label">Departamento</span><span className="info-value">{mostrar(a.departamento)}</span></div>
                    <div className="info-box"><span className="info-label">Provincia</span><span className="info-value">{mostrar(a.provincia)}</span></div>
                    <div className="info-box"><span className="info-label">Distrito</span><span className="info-value">{mostrar(a.distrito)}</span></div>
                    <div className="info-box"><span className="info-label">Grado</span><span className="info-value">{mostrar(a.gradoInstruccion)}</span></div>
                    <div className="info-box"><span className="info-label">Estado Civil</span><span className="info-value">{mostrar(a.estadoCivil)}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Asociados;
