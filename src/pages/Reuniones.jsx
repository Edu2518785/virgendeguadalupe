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
  const rol = user.rol;

  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [busquedaFecha, setBusquedaFecha] = useState("");
  const [busquedaAsociado, setBusquedaAsociado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const asistenciaOriginalRef = useRef([]);

  useEffect(() => {
    const fetchReuniones = async () => {
      const q = query(collection(db, "reuniones"), orderBy("fecha", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReuniones(data);
      setLoading(false);
    };
    fetchReuniones();
  }, []);

  const abrirReunion = async () => {
    if (!window.confirm("¿Seguro que deseas abrir una nueva reunión?")) return;

    const reunionAbierta = reuniones.find(r => r.cerrada === false);
    if (reunionAbierta) {
      alert("Ya hay una reunión abierta.");
      setSelectedReunion(reunionAbierta);
      return;
    }

    const snapAsociados = await getDocs(collection(db, "asociados"));
    const listaAsociados = snapAsociados.docs.map(d => ({
      id: d.id,
      numeroAsociado: d.data().numeroAsociado,
      nombres: d.data().nombres,
      apellidoPaterno: d.data().apellidoPaterno,
      apellidoMaterno: d.data().apellidoMaterno,
      estado: "falta"
    }));

    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    const docRef = await addDoc(collection(db, "reuniones"), {
      fecha,
      hora,
      asistencia: listaAsociados,
      cerrada: false
    });

    const nueva = { id: docRef.id, fecha, hora, asistencia: listaAsociados, cerrada: false };

    setReuniones(prev => [nueva, ...prev]);
    setSelectedReunion(nueva);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const copia = [...selectedReunion.asistencia];
    copia[index] = { ...copia[index], estado: nuevoEstado };
    setSelectedReunion(prev => ({ ...prev, asistencia: copia }));
  };

  const guardarCambios = async () => {
    if (!window.confirm("¿Seguro que deseas guardar los cambios?")) return;

    const reunionRef = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(reunionRef, { asistencia: selectedReunion.asistencia });

    for (let i = 0; i < selectedReunion.asistencia.length; i++) {
      const antes = asistenciaOriginalRef.current[i];
      const despues = selectedReunion.asistencia[i];

      if (antes.estado !== despues.estado) {
        await addDoc(collection(db, "cambios"), {
          reunionId: selectedReunion.id,
          fechaReunion: selectedReunion.fecha,
          fechaCambio: new Date().toLocaleDateString(),
          horaCambio: new Date().toLocaleTimeString(),
          realizadoPor: user.nombres,
          numeroAsociadoEditor: user.numeroAsociado,
          asociadoModificado: despues.numeroAsociado,
          cambio: `Cambió de ${antes.estado} a ${despues.estado}`,
          timestamp: serverTimestamp()
        });
      }
    }

    setSelectedReunion(prev => ({ ...prev, editando: false }));
    setReuniones(prev => prev.map(r => (r.id === selectedReunion.id ? { ...selectedReunion, editando: false } : r)));
  };

  const cancelarEdicion = () => {
    if (!window.confirm("¿Seguro que deseas cancelar los cambios?")) return;

    const restaurada = {
      ...selectedReunion,
      asistencia: asistenciaOriginalRef.current,
      editando: false
    };

    setSelectedReunion(restaurada);
    setReuniones(prev => prev.map(r => (r.id === restaurada.id ? restaurada : r)));
  };

  const cerrarReunion = async () => {
    if (!window.confirm("¿Seguro que deseas cerrar la reunión?")) return;

    const reunionRef = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(reunionRef, { cerrada: true });

    setSelectedReunion(prev => ({ ...prev, cerrada: true, editando: false }));
    setReuniones(prev => prev.map(r => (r.id === selectedReunion.id ? { ...r, cerrada: true } : r)));
  };

  const reunionesFiltradas = reuniones.filter(r => r.fecha.includes(busquedaFecha));

  const asistentesFiltrados = selectedReunion?.asistencia.filter(a => {
    const okNum = !busquedaAsociado || a.numeroAsociado.includes(busquedaAsociado);
    const okEstado = !filtroEstado || a.estado === filtroEstado;
    return okNum && okEstado;
  }) || [];

  if (loading) return <p>Cargando reuniones...</p>;

return (
    <div className="reu-page-container">
      {/* PANEL IZQUIERDO: HISTORIAL */}
      <div className="reu-card-left">
        <button
          className="reu-btn-primary"
          onClick={abrirReunion}
          disabled={!(rol === "administrador" || rol === "asistencia")}
        >
          ➕ Abrir nueva reunión
        </button>

        <div className="reu-search-wrapper">
          <input
            className="reu-input-dark"
            placeholder="🔍 Buscar fecha..."
            value={busquedaFecha}
            onChange={e => setBusquedaFecha(e.target.value)}
          />
        </div>

        <ul className="reu-list">
          {reunionesFiltradas.map(r => (
            <li
              key={r.id}
              className={`reu-list-item ${selectedReunion?.id === r.id ? "is-selected" : ""}`}
              onClick={() => {
                asistenciaOriginalRef.current = JSON.parse(JSON.stringify(r.asistencia));
                setSelectedReunion({ ...r, asistencia: [...r.asistencia], editando: false });
              }}
            >
              <div className="reu-item-info">
                <strong>{r.fecha}</strong>
                <span className={`reu-status-tag ${r.cerrada ? 'is-closed' : 'is-open'}`}>
                  {r.cerrada ? "Cerrada" : "En curso"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* PANEL DERECHO: CONTENIDO */}
      <div className="reu-card-right">
        {selectedReunion ? (
          <>
            <div className="reu-detail-header">
              <div className="reu-title-group">
                <h3>Asistencia: {selectedReunion.fecha}</h3>
                <p>{selectedReunion.hora} • {selectedReunion.cerrada ? "Cerrada" : "Abierta"}</p>
              </div>

              <div className="reu-header-actions">
                <input
                  className="reu-input-dark reu-input-small"
                  placeholder="🔢 N° Asociado..."
                  value={busquedaAsociado}
                  onChange={e => setBusquedaAsociado(e.target.value)}
                />

                {selectedReunion.cerrada && (rol === "administrador" || rol === "asistencia") && (
                  !selectedReunion.editando ? (
                    <button className="reu-btn-edit" onClick={() => setSelectedReunion(prev => ({ ...prev, editando: true }))}>
                      ✏️ Editar Historia
                    </button>
                  ) : (
                    <div className="reu-edit-group">
                      <button className="reu-btn-save" onClick={guardarCambios}>Guardar</button>
                      <button className="reu-btn-cancel" onClick={cancelarEdicion}>Cancelar</button>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="reu-table-container">
              <table className="reu-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Nombre del Asociado</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {asistentesFiltrados.length > 0 ? (
                    asistentesFiltrados.map((a, i) => {
                      const originalIndex = selectedReunion.asistencia.findIndex(asoc => asoc.id === a.id);
                      return (
                        <tr key={a.id || i}>
                          <td><strong>{a.numeroAsociado}</strong></td>
                          <td>{a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}</td>
                          <td style={{ textAlign: 'center' }}>
                            {!selectedReunion.cerrada || selectedReunion.editando ? (
                              <select
                                className={`reu-select-state state-${a.estado}`}
                                value={a.estado}
                                onChange={e => cambiarEstado(originalIndex, e.target.value)}
                              >
                                <option value="falta">🔴 Falta</option>
                                <option value="puntual">🟢 Puntual</option>
                                <option value="tarde">🟡 Tarde</option>
                              </select>
                            ) : (
                              <span className={`reu-badge state-${a.estado}`}>{a.estado}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="3" className="reu-empty">No se encontraron resultados</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {!selectedReunion.cerrada && (rol === "administrador" || rol === "asistencia") && (
              <button className="reu-btn-close-final" onClick={cerrarReunion}>
                Cerrar reunión definitivamente
              </button>
            )}
          </>
        ) : (
          <div className="reu-no-selection">
            <div className="reu-placeholder-icon">📅</div>
            <p>Selecciona una reunión del historial para ver el detalle o gestionar la asistencia.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reuniones;
