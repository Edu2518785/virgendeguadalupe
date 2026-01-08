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

  const asistenciaOriginalRef = useRef([]);

  /* ================= CARGAR REUNIONES ================= */
  useEffect(() => {
    const fetchReuniones = async () => {
      const q = query(collection(db, "reuniones"), orderBy("fechaTS", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReuniones(data);
      setLoading(false);
    };
    fetchReuniones();
  }, []);

  /* ================= ABRIR NUEVA REUNIÓN ================= */
  const abrirReunion = async () => {
    if (!window.confirm("¿Seguro que deseas abrir una nueva reunión?")) return;

    // 🔥🔥🔥 FIX: NO permitir más de una reunión abierta
    const reunionAbierta = reuniones.find(r => r.cerrada === false);
    if (reunionAbierta) {
      alert("⚠️ Ya hay una reunión aperturada. No se puede crear otra.");
      asistenciaOriginalRef.current = JSON.parse(
        JSON.stringify(reunionAbierta.asistencia)
      );
      setSelectedReunion({
        ...reunionAbierta,
        asistencia: [...reunionAbierta.asistencia],
        editando: false
      });
      return;
    }
    // 🔥🔥🔥 FIN FIX

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

    asistenciaOriginalRef.current = JSON.parse(JSON.stringify(listaAsociados));

    const nueva = {
      id: docRef.id,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      fechaTS: ahora,
      asistencia: listaAsociados,
      cerrada: false,
      editando: false
    };

    setReuniones(prev => [nueva, ...prev]);
    setSelectedReunion(nueva);
  };

  /* ================= CAMBIAR ESTADO ================= */
  const cambiarEstado = (index, nuevoEstado) => {
    const copia = [...selectedReunion.asistencia];
    copia[index] = { ...copia[index], estado: nuevoEstado };
    setSelectedReunion(prev => ({ ...prev, asistencia: copia }));
  };

  /* ================= GUARDAR CAMBIOS ================= */
  const guardarCambios = async () => {
    const reunionRef = doc(db, "reuniones", selectedReunion.id);

    await updateDoc(reunionRef, {
      asistencia: selectedReunion.asistencia
    });

    for (const despues of selectedReunion.asistencia) {
      const antes = asistenciaOriginalRef.current.find(
        a => a.numeroAsociado === despues.numeroAsociado
      );

      if (antes && antes.estado !== despues.estado) {
        await addDoc(collection(db, "cambios"), {
          reunionId: selectedReunion.id,
          fechaReunion: selectedReunion.fecha,
          fechaCambio: new Date().toLocaleDateString(),
          horaCambio: new Date().toLocaleTimeString(),
          realizadoPor: user.nombres,
          numeroAsociadoEditor: user.numeroAsociado,
          asociadoModificado: despues.numeroAsociado,
          estadoAnterior: antes.estado,
          estadoNuevo: despues.estado,
          timestamp: serverTimestamp()
        });
      }
    }

    asistenciaOriginalRef.current = JSON.parse(
      JSON.stringify(selectedReunion.asistencia)
    );

    setSelectedReunion(prev => ({ ...prev, editando: false }));
  };

  /* ================= CANCELAR EDICIÓN ================= */
  const cancelarEdicion = () => {
    setSelectedReunion(prev => ({
      ...prev,
      asistencia: JSON.parse(JSON.stringify(asistenciaOriginalRef.current)),
      editando: false
    }));
  };

  /* ================= CERRAR REUNIÓN ================= */
  const cerrarReunion = async () => {
    if (!window.confirm("¿Cerrar definitivamente la reunión?")) return;

    const reunionRef = doc(db, "reuniones", selectedReunion.id);

    await updateDoc(reunionRef, {
      asistencia: selectedReunion.asistencia,
      cerrada: true
    });

    asistenciaOriginalRef.current = JSON.parse(
      JSON.stringify(selectedReunion.asistencia)
    );

    setSelectedReunion(prev => ({
      ...prev,
      cerrada: true,
      editando: false
    }));
  };

  const reunionesFiltradas = reuniones.filter(r =>
    r.fecha?.includes(busquedaFecha)
  );

  const asistentesFiltrados =
    selectedReunion?.asistencia.filter(a =>
      !busquedaAsociado ||
      String(a.numeroAsociado).includes(busquedaAsociado)
    ) || [];

  if (loading) return <p>Cargando reuniones...</p>;

  return (
    <div className="reu-page-container">
      {/* ================= LEFT ================= */}
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

      {/* ================= RIGHT ================= */}
      <div className="reu-card-right">
        {selectedReunion && (
          <>
            <div className="reu-detail-header">
              <h3>Asistencia {selectedReunion.fecha}</h3>

              {selectedReunion.cerrada &&
                (rol === "administrador" || rol === "asistencia") &&
                !selectedReunion.editando && (
                  <button
                    className="reu-btn-edit"
                    onClick={() =>
                      setSelectedReunion(prev => ({
                        ...prev,
                        editando: true
                      }))
                    }
                  >
                    ✏️ Editar reunión
                  </button>
                )}

              {selectedReunion.editando && (
                <div className="reu-edit-group">
                  <button className="reu-btn-save" onClick={guardarCambios}>
                    Guardar
                  </button>
                  <button className="reu-btn-cancel" onClick={cancelarEdicion}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <input
              className="reu-input-dark reu-input-small"
              placeholder="🔢 N° Asociado..."
              value={busquedaAsociado}
              onChange={e => setBusquedaAsociado(e.target.value)}
            />

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
                    <tr key={a.numeroAsociado}>
                      <td><strong>{a.numeroAsociado}</strong></td>
                      <td>
                        {a.nombres} {a.apellidoPaterno}{" "}
                        {a.apellidoMaterno}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!selectedReunion.cerrada ||
                        selectedReunion.editando ? (
                          <select
                            className={`reu-select-state state-${a.estado}`}
                            value={a.estado}
                            onChange={e =>
                              cambiarEstado(i, e.target.value)
                            }
                          >
                            <option value="falta">🔴 Falta</option>
                            <option value="puntual">🟢 Puntual</option>
                            <option value="tarde">🟡 Tarde</option>
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
        )}
      </div>
    </div>
  );
}

export default Reuniones;
