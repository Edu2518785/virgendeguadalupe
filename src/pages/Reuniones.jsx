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

    const reunionAbierta = reuniones.find(r => r.cerrada === false);
    if (reunionAbierta) {
      alert("⚠️ Ya hay una reunión aperturada. No se puede crear otra.");
      return;
    }

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
      asistencia: listaAsociados,
      cerrada: false
    };

    setReuniones(prev => [nueva, ...prev]);
    setSelectedReunion({ ...nueva, editando: false });
    asistenciaOriginalRef.current = JSON.parse(JSON.stringify(listaAsociados));
  };

  /* ================= CAMBIAR ESTADO ================= */
  const cambiarEstado = (numeroAsociado, nuevoEstado) => {
    setSelectedReunion(prev => ({
      ...prev,
      asistencia: prev.asistencia.map(a => 
        a.numeroAsociado === numeroAsociado 
          ? { ...a, estado: nuevoEstado } 
          : a
      )
    }));
  };

  /* ================= GUARDAR CAMBIOS ================= */
  const guardarCambios = async () => {
    try {
      const reunionRef = doc(db, "reuniones", selectedReunion.id);
      await updateDoc(reunionRef, { asistencia: selectedReunion.asistencia });

      for (const despues of selectedReunion.asistencia) {
        const antes = asistenciaOriginalRef.current.find(a => a.numeroAsociado === despues.numeroAsociado);
        if (antes && antes.estado !== despues.estado) {
          await addDoc(collection(db, "cambios"), {
            reunionId: selectedReunion.id,
            fechaCambio: new Date().toLocaleDateString(),
            horaCambio: new Date().toLocaleTimeString(),
            realizadoPor: user?.nombres || "Usuario", 
            asociadoModificado: despues.numeroAsociado,
            estadoAnterior: antes.estado,
            estadoNuevo: despues.estado,
            timestamp: serverTimestamp()
          });
        }
      }

      asistenciaOriginalRef.current = JSON.parse(JSON.stringify(selectedReunion.asistencia));
      setSelectedReunion(prev => ({ ...prev, editando: false }));
      setReuniones(prev => prev.map(r => r.id === selectedReunion.id ? { ...r, asistencia: selectedReunion.asistencia } : r));
      alert("✅ Cambios guardados correctamente.");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error al guardar.");
    }
  };

  /* ================= CERRAR REUNIÓN ================= */
  const cerrarReunion = async () => {
    if (!window.confirm("¿Cerrar definitivamente la reunión?")) return;
    try {
      const reunionRef = doc(db, "reuniones", selectedReunion.id);
      await updateDoc(reunionRef, { cerrada: true, asistencia: selectedReunion.asistencia });
      setSelectedReunion(prev => ({ ...prev, cerrada: true, editando: false }));
      setReuniones(prev => prev.map(r => r.id === selectedReunion.id ? { ...r, cerrada: true, asistencia: selectedReunion.asistencia } : r));
    } catch (error) {
      console.error("Error al cerrar:", error);
    }
  };

  const reunionesFiltradas = reuniones.filter(r => r.fecha?.includes(busquedaFecha));
  const asistentesFiltrados = selectedReunion?.asistencia.filter(a =>
    !busquedaAsociado || String(a.numeroAsociado).includes(busquedaAsociado)
  ) || [];

  if (loading) return <p>Cargando reuniones...</p>;

  return (
    <div className="reu-page-container">
      <div className="reu-card-left">
        {/* 🔒 BLOQUEO: Solo rol 'asistencia' crea reuniones */}
        {rol === "asistencia" && (
          <button className="reu-btn-primary" onClick={abrirReunion}>
            ➕ Abrir nueva reunión
          </button>
        )}
        <input className="reu-input-dark" placeholder="🔍 Buscar fecha..." value={busquedaFecha} onChange={e => setBusquedaFecha(e.target.value)} />
        <ul className="reu-list">
          {reunionesFiltradas.map(r => (
            <li key={r.id} className={`reu-list-item ${selectedReunion?.id === r.id ? "is-selected" : ""}`} onClick={() => {
              asistenciaOriginalRef.current = JSON.parse(JSON.stringify(r.asistencia));
              setSelectedReunion({ ...r, editando: false });
            }}>
              <strong>{r.fecha}</strong>
              <span className={`reu-status-tag ${r.cerrada ? "is-closed" : "is-open"}`}>
                {r.cerrada ? "Cerrada" : "En curso"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="reu-card-right">
        {selectedReunion && (
          <>
            <div className="reu-detail-header">
              <h3>Asistencia {selectedReunion.fecha}</h3>
              {/* 🔒 BLOQUEO: Solo rol 'asistencia' edita reuniones cerradas */}
              {rol === "asistencia" && selectedReunion.cerrada && !selectedReunion.editando && (
                <button className="reu-btn-edit" onClick={() => setSelectedReunion(prev => ({ ...prev, editando: true }))}>✏️ Editar</button>
              )}
              {selectedReunion.editando && (
                <div className="reu-edit-group">
                  <button className="reu-btn-save" onClick={guardarCambios}>Guardar</button>
                  <button className="reu-btn-cancel" onClick={() => setSelectedReunion(prev => ({ ...prev, editando: false, asistencia: asistenciaOriginalRef.current }))}>Cancelar</button>
                </div>
              )}
            </div>

            <input className="reu-input-dark reu-input-small" placeholder="🔢 N° Asociado..." value={busquedaAsociado} onChange={e => setBusquedaAsociado(e.target.value)} />

            <div className="reu-table-container">
              <table className="reu-table">
                <thead><tr><th>N°</th><th>Nombre</th><th>Estado</th></tr></thead>
                <tbody>
                  {asistentesFiltrados.map(a => (
                    <tr key={a.numeroAsociado}>
                      <td><strong>{a.numeroAsociado}</strong></td>
                      <td>{a.nombres} {a.apellidoPaterno}</td>
                      <td>
                        {/* 🔒 LA CLAVE: Solo muestra el SELECT si el rol es 'asistencia' 
                            Y la reunión permite edición (abierta o en modo edición) */}
                        {rol === "asistencia" && (!selectedReunion.cerrada || selectedReunion.editando) ? (
                          <select className={`reu-select-state state-${a.estado}`} value={a.estado} onChange={e => cambiarEstado(a.numeroAsociado, e.target.value)}>
                            <option value="falta">🔴 Falta</option>
                            <option value="puntual">🟢 Puntual</option>
                            <option value="tarde">🟡 Tarde</option>
                          </select>
                        ) : (
                          <span className={`reu-badge state-${a.estado}`}>{a.estado}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔒 BLOQUEO: Solo rol 'asistencia' cierra la reunión */}
            {rol === "asistencia" && !selectedReunion.cerrada && (
              <button className="reu-btn-close-final" onClick={cerrarReunion}>Cerrar reunión definitivamente</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reuniones;