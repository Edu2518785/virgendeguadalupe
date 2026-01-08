import { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Reuniones.css";

function Reuniones() {
  const user = useOutletContext();
  const rol = user?.rol;

  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [busquedaFecha, setBusquedaFecha] = useState("");
  const [busquedaAsociado, setBusquedaAsociado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const asistenciaOriginalRef = useRef([]);

  useEffect(() => {
    const fetchReuniones = async () => {
      const q = query(
        collection(db, "reuniones"),
        orderBy("fechaTS", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setReuniones(data);
      setLoading(false);
    };
    fetchReuniones();
  }, []);

  const abrirReunion = async () => {
    if (!window.confirm("¿Seguro que deseas abrir una nueva reunión?")) return;

    const snapAsociados = await getDocs(collection(db, "asociados"));
    if (snapAsociados.empty) return;

    const listaAsociados = snapAsociados.docs.map(d => ({
      id: d.id,
      numeroAsociado: String(d.data().numeroAsociado ?? ""),
      nombres: d.data().nombres ?? "",
      apellidoPaterno: d.data().apellidoPaterno ?? "",
      apellidoMaterno: d.data().apellidoMaterno ?? "",
      estado: "falta"
    }));

    const ahora = new Date();

    const docRef = await addDoc(collection(db, "reuniones"), {
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      fechaTS: serverTimestamp(),
      asistencia: listaAsociados,
      cerrada: false
    });

    const nueva = {
      id: docRef.id,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      fechaTS: ahora,
      asistencia: listaAsociados,
      cerrada: false,
      editando: false
    };

    asistenciaOriginalRef.current = JSON.parse(JSON.stringify(listaAsociados));
    setBusquedaAsociado("");
    setFiltroEstado("");
    setReuniones(prev => [nueva, ...prev]);
    setSelectedReunion(nueva);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const copia = [...selectedReunion.asistencia];
    copia[index] = { ...copia[index], estado: nuevoEstado };
    setSelectedReunion(prev => ({ ...prev, asistencia: copia }));
  };

  const guardarCambios = async () => {
    const ref = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(ref, {
      asistencia: selectedReunion.asistencia
    });

    setSelectedReunion(prev => ({ ...prev, editando: false }));
  };

  const cancelarEdicion = () => {
    setSelectedReunion(prev => ({
      ...prev,
      asistencia: asistenciaOriginalRef.current,
      editando: false
    }));
  };

  const cerrarReunion = async () => {
    const ref = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(ref, { cerrada: true });

    setSelectedReunion(prev => ({ ...prev, cerrada: true }));
    setReuniones(prev =>
      prev.map(r =>
        r.id === selectedReunion.id ? { ...r, cerrada: true } : r
      )
    );
  };

  const reunionesFiltradas = reuniones.filter(r =>
    r.fecha?.includes(busquedaFecha)
  );

  const asistentesFiltrados =
    selectedReunion?.asistencia.filter(a => {
      const okNum =
        !busquedaAsociado ||
        String(a.numeroAsociado).includes(busquedaAsociado);
      const okEstado = !filtroEstado || a.estado === filtroEstado;
      return okNum && okEstado;
    }) || [];

  if (loading) return <p>Cargando reuniones...</p>;

  return (
    <div className="reu-page-container">
      {/* ================= COLUMNA IZQUIERDA ================= */}
      <div className="reu-card-left">
        <button
          className="reu-btn-primary"
          onClick={abrirReunion}
          disabled={!(rol === "administrador" || rol === "asistencia")}
        >
          ➕ Abrir nueva reunión
        </button>

        <input
          className="reu-input-dark"
          placeholder="🔍 Buscar fecha..."
          value={busquedaFecha}
          onChange={e => setBusquedaFecha(e.target.value)}
        />

        <ul className="reu-list">
          {reunionesFiltradas.map(r => (
            <li
              key={r.id}
              className={`reu-list-item ${
                selectedReunion?.id === r.id ? "is-selected" : ""
              }`}
              onClick={() => {
                asistenciaOriginalRef.current = JSON.parse(
                  JSON.stringify(r.asistencia)
                );
                setBusquedaAsociado("");
                setFiltroEstado("");
                setSelectedReunion({
                  ...r,
                  asistencia: [...r.asistencia],
                  editando: false
                });
              }}
            >
              <strong>{r.fecha}</strong>
              <span
                className={`reu-status-tag ${
                  r.cerrada ? "is-closed" : "is-open"
                }`}
              >
                {r.cerrada ? "Cerrada" : "En curso"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ================= COLUMNA DERECHA ================= */}
      <div className="reu-card-right">
        {selectedReunion ? (
          <>
            <div className="reu-detail-header">
              <div>
                <h3>Asistencia: {selectedReunion.fecha}</h3>
                <p>{selectedReunion.hora}</p>
              </div>

              <div className="reu-header-actions">
                <input
                  className="reu-input-dark reu-input-small"
                  placeholder="🔢 N° Asociado..."
                  value={busquedaAsociado}
                  onChange={e => setBusquedaAsociado(e.target.value)}
                />
              </div>
            </div>

            <div className="reu-table-container">
              <table className="reu-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Nombre del Asociado</th>
                    <th style={{ textAlign: "center" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentesFiltrados.map((a, i) => (
                    <tr key={a.id}>
                      <td>{a.numeroAsociado}</td>
                      <td>
                        {a.nombres} {a.apellidoPaterno}{" "}
                        {a.apellidoMaterno}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!selectedReunion.cerrada ? (
                          <select
                            className={`reu-select-state state-${a.estado}`}
                            value={a.estado}
                            onChange={e =>
                              cambiarEstado(i, e.target.value)
                            }
                          >
                            <option value="falta">Falta</option>
                            <option value="puntual">Puntual</option>
                            <option value="tarde">Tarde</option>
                          </select>
                        ) : (
                          <span className={`reu-badge state-${a.estado}`}>
                            {a.estado}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!selectedReunion.cerrada &&
              (rol === "administrador" || rol === "asistencia") && (
                <button
                  className="reu-btn-close-final"
                  onClick={cerrarReunion}
                >
                  Cerrar reunión definitivamente
                </button>
              )}
          </>
        ) : (
          <div className="reu-no-selection">
            <div className="reu-placeholder-icon">📅</div>
            <p>Selecciona una reunión para ver la asistencia</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reuniones;
