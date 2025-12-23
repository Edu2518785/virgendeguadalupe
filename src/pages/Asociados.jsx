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

  useEffect(() => {
    if (!["administrador", "asistencia", "directiva"].includes(user.rol)) {
      navigate("/home", { replace: true });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "asociados"));
        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLista(data);
      } catch (error) {
        console.error("Error al cargar asociados:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  // Mantenemos tu función original para no perder datos vacíos
  const mostrar = valor => (valor && valor !== "" ? valor : "-------------");

  // Lógica de filtrado exacta a la tuya
  const asociadosFiltrados = lista.filter(a => {
    const coincideNumero = busqueda === "" || (a.numeroAsociado && String(a.numeroAsociado).includes(busqueda));
    const tieneDeuda = a.deuda && a.deuda !== "" && a.deuda !== "0" && a.deuda !== 0;
    const filtroDeuda = !soloConDeuda || tieneDeuda;
    return coincideNumero && filtroDeuda;
  });

  if (loading) return <div className="asociados-container"><p style={{color: "white"}}>Cargando asociados...</p></div>;

  return (
    <div className="asociados-container">
      <div className="filtros-asociados">
        <h2 style={{ margin: 0, color: "#fff" }}>Asociados Registrados ({asociadosFiltrados.length})</h2>
        <div className="acciones-header">
          <input
            type="text"
            className="input-busqueda"
            placeholder="🔍 Buscar por Nº de asociado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <label className="checkbox-label" style={{color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px"}}>
            <input 
              type="checkbox" 
              checked={soloConDeuda} 
              onChange={e => setSoloConDeuda(e.target.checked)} 
            />
            Solo con deuda
          </label>
        </div>
      </div>

      <div className="grid-asociados">
        {asociadosFiltrados.map(a => {
          const tieneDeuda = a.deuda && a.deuda !== "" && a.deuda !== "0" && a.deuda !== 0;

          return (
            <div
              key={a.id}
              className={`card-asociado ${selectedAsociado?.id === a.id ? "active" : ""}`}
              onClick={() => setSelectedAsociado(prev => prev?.id === a.id ? null : a)}
            >
              {/* CABECERA: Nombre y Número */}
              <div className="card-asociado-header">
                <span className="nombre-asociado">{a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}</span>
                <span className="badge-numero">N° {a.numeroAsociado}</span>
              </div>

              {/* VISTA RÁPIDA: DNI y Deuda */}
              <div className="detalle-asociado">
                <div className="info-box">
                  <span className="info-label">D.N.I.</span>
                  <span className="info-value">{mostrar(a.dni)}</span>
                </div>
                <div className="info-box">
                    <span className="info-label">Deuda</span>
                    <span className={`info-value deuda-badge ${tieneDeuda ? "con-deuda" : "sin-deuda"}`}>
                        S/ {mostrar(a.deuda)}
                    </span>
                </div>
              </div>

              {/* DETALLE COMPLETO (Se abre al hacer clic) */}
              {selectedAsociado?.id === a.id && (
                <div className="seccion-expandida">
                  <hr />
                  <div className="detalle-grid-completo">
                    <div className="info-box"><span className="info-label">Fecha Ingreso</span><span className="info-value">{mostrar(a.fechaIngreso)}</span></div>
                    <div className="info-box"><span className="info-label">F. Nacimiento</span><span className="info-value">{mostrar(a.fechaNacimiento)}</span></div>
                    <div className="info-box"><span className="info-label">Natural de</span><span className="info-value">{mostrar(a.departamento)}</span></div>
                    <div className="info-box"><span className="info-label">Provincia</span><span className="info-value">{mostrar(a.provincia)}</span></div>
                    <div className="info-box"><span className="info-label">Distrito</span><span className="info-value">{mostrar(a.distrito)}</span></div>
                    <div className="info-box"><span className="info-label">Ocupación</span><span className="info-value">{mostrar(a.ocupacion)}</span></div>
                    <div className="info-box"><span className="info-label">Instrucción</span><span className="info-value">{mostrar(a.gradoInstruccion)}</span></div>
                    <div className="info-box"><span className="info-label">Estado Civil</span><span className="info-value">{mostrar(a.estadoCivil)}</span></div>
                    
                    {/* Campos de ancho completo */}
                    <div className="info-box" style={{ gridColumn: "span 2" }}>
                        <span className="info-label">Dirección</span>
                        <span className="info-value">{mostrar(a.direccion)}</span>
                    </div>
                    <div className="info-box" style={{ gridColumn: "span 2" }}>
                        <span className="info-label">Esposa / Conviviente</span>
                        <span className="info-value">{mostrar(a.conviviente)}</span>
                    </div>
                  </div>

                  {/* LISTA DE HIJOS: Accediendo a los objetos de tu Firebase */}
                  <div className="hijos-container">
                    <span className="info-label" style={{display: 'block', marginBottom: '10px'}}>Hijos:</span>
                    {Array.isArray(a.hijos) && a.hijos.length > 0 ? (
                      a.hijos.map((hijo, index) => (
                        <div key={index} className="hijo-item-card">
                           <div className="hijo-row">
                             <strong>Nombre:</strong> {mostrar(hijo.nombre)}
                           </div>
                           <div className="hijo-row">
                             <strong>Edad:</strong> {mostrar(hijo.edad)} años | <strong>Estudios:</strong> {mostrar(hijo.estudios)}
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="info-value">Sin hijos registrados</p>
                    )}
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