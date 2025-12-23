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
import "../css/Reuniones.css"; // Importamos CSS específico

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
    const confirmar = window.confirm(
      "¿Seguro que deseas abrir una nueva reunión?"
    );
    if (!confirmar) return;

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

    const nueva = {
      id: docRef.id,
      fecha,
      hora,
      asistencia: listaAsociados,
      cerrada: false
    };

    setReuniones(prev => [nueva, ...prev]);
    setSelectedReunion(nueva);
  };

  const cambiarEstado = (index, nuevoEstado) => {
    const copia = [...selectedReunion.asistencia];
    copia[index] = { ...copia[index], estado: nuevoEstado };
    setSelectedReunion(prev => ({ ...prev, asistencia: copia }));
  };

  const guardarCambios = async () => {
    const confirmar = window.confirm("¿Seguro que deseas guardar los cambios?");
    if (!confirmar) return;

    const reunionRef = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(reunionRef, {
      asistencia: selectedReunion.asistencia
    });

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

    const actualizada = { ...selectedReunion, editando: false };
    setSelectedReunion(actualizada);
    setReuniones(prev =>
      prev.map(r => (r.id === actualizada.id ? actualizada : r))
    );
  };

  const cancelarEdicion = () => {
    const confirmar = window.confirm("¿Seguro que deseas cancelar los cambios?");
    if (!confirmar) return;

    const restaurada = {
      ...selectedReunion,
      asistencia: asistenciaOriginalRef.current,
      editando: false
    };

    setSelectedReunion(restaurada);
    setReuniones(prev =>
      prev.map(r => (r.id === restaurada.id ? restaurada : r))
    );
  };

  const cerrarReunion = async () => {
    const confirmar = window.confirm("¿Seguro que deseas cerrar la reunión?");
    if (!confirmar) return;

    const reunionRef = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(reunionRef, { cerrada: true });

    const cerrada = { ...selectedReunion, cerrada: true, editando: false };
    setSelectedReunion(cerrada);
    setReuniones(prev =>
      prev.map(r => (r.id === cerrada.id ? cerrada : r))
    );
  };

  const reunionesFiltradas = reuniones.filter(r =>
    r.fecha.includes(busquedaFecha)
  );

  const asistentesFiltrados =
    selectedReunion?.asistencia.filter(a => {
      const okNum = !busquedaAsociado || a.numeroAsociado.includes(busquedaAsociado);
      const okEstado = !filtroEstado || a.estado === filtroEstado;
      return okNum && okEstado;
    }) || [];

  if (loading) return <p>Cargando reuniones...</p>;

return (
  <div className="reuniones-container">
    <div className="sidebar">
      <button 
        className="btn-principal" 
        onClick={abrirReunion}
        disabled={!(rol === "administrador" || rol === "asistencia")}
      >
        Abrir nueva reunión
      </button>
      
      {/* Buscador de reuniones por fecha */}
      <input 
        className="input-busqueda" 
        placeholder="🔍 Buscar fecha de reunión..." 
        value={busquedaFecha} 
        onChange={e => setBusquedaFecha(e.target.value)} 
      />

      <ul className="lista-reuniones">
        {reunionesFiltradas.map(r => (
          <li 
            key={r.id} 
            className={`item-reunion ${selectedReunion?.id === r.id ? "selected" : ""}`}
            onClick={() => {
                asistenciaOriginalRef.current = JSON.parse(JSON.stringify(r.asistencia));
                setSelectedReunion({ ...r, asistencia: [...r.asistencia], editando: false });
            }}
          >
            {r.fecha} {r.cerrada ? "(Cerrada)" : "(Abierta)"}
          </li>
        ))}
      </ul>
    </div>

    <div className="contenido">
      {selectedReunion ? (
        <>
          <div className="header-seccion">
            <h3 style={{ margin: 0 }}>
                Reunión {selectedReunion.fecha} {selectedReunion.hora} - {selectedReunion.cerrada ? "CERRADA" : "ABIERTA"}
            </h3>
            
            <div className="acciones-header">
                {/* Buscador de asociados dentro de la reunión seleccionada */}
                <input 
                    className="input-busqueda" 
                    style={{ width: '200px', marginBottom: 0 }}
                    placeholder="🔢 Buscar N° asociado..." 
                    value={busquedaAsociado} 
                    onChange={e => setBusquedaAsociado(e.target.value)} 
                />

                {/* Lógica de botones de edición para reuniones cerradas */}
                {selectedReunion.cerrada && (rol === "administrador" || rol === "asistencia") && (
                    !selectedReunion.editando ? (
                        <button className="btn-principal" onClick={() => setSelectedReunion(prev => ({ ...prev, editando: true }))}>
                            Editar Historia
                        </button>
                    ) : (
                        <>
                            <button className="btn-principal" style={{backgroundColor: '#10b981'}} onClick={guardarCambios}>Guardar</button>
                            <button className="btn-principal" onClick={cancelarEdicion}>Cancelar</button>
                        </>
                    )
                )}
            </div>
          </div>

          <div className="tabla-container">
            <table className="tabla-asistencia">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre completo</th>
                  <th style={{ textAlign: 'right' }}>Estado de Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {asistentesFiltrados.length > 0 ? (
                    asistentesFiltrados.map((a, i) => {
                        // Encontrar el índice original para el cambio de estado correcto
                        const originalIndex = selectedReunion.asistencia.findIndex(asoc => asoc.id === a.id);
                        
                        return (
                            <tr key={a.id || i}>
                                <td>{a.numeroAsociado}</td>
                                <td>{a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}</td>
                                <td style={{ textAlign: 'right' }}>
                                    {!selectedReunion.cerrada || selectedReunion.editando ? (
                                        <select 
                                            className="select-estado"
                                            value={a.estado} 
                                            onChange={e => cambiarEstado(originalIndex, e.target.value)}
                                        >
                                            <option value="falta">🔴 Falta</option>
                                            <option value="puntual">🟢 Puntual</option>
                                            <option value="tarde">🟡 Tarde</option>
                                        </select>
                                    ) : (
                                        <span className={`badge-estado ${a.estado}`}>{a.estado}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron asociados con ese número.</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Botón para cerrar la reunión si está abierta */}
          {!selectedReunion.cerrada && (rol === "administrador" || rol === "asistencia") && (
            <button 
                className="btn-principal" 
                style={{ marginTop: '10px', backgroundColor: '#ef4444', width: '100%' }} 
                onClick={cerrarReunion}
              >
                Cerrar reunión definitivamente
            </button>
          )}
        </>
      ) : (
        <div className="no-selection">
            <p>Seleccione una reunión del historial para ver la asistencia o abrir una nueva.</p>
        </div>
      )}
    </div>
  </div>
);
}

export default Reuniones;
