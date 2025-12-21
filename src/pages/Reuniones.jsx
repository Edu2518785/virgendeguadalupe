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

function Reuniones() {
  const user = useOutletContext(); // <- debe tener nombres y numeroAsociado
  const rol = user.rol;

  const [reuniones, setReuniones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [busquedaFecha, setBusquedaFecha] = useState("");
  const [busquedaAsociado, setBusquedaAsociado] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const asistenciaOriginalRef = useRef([]);

  /* ================= CARGAR REUNIONES ================= */
  useEffect(() => {
    const fetchReuniones = async () => {
      try {
        const q = query(collection(db, "reuniones"), orderBy("fecha", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setReuniones(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchReuniones();
  }, []);

  /* ================= ABRIR REUNIÓN ================= */
  const abrirReunion = async () => {
    const reunionAbierta = reuniones.find(r => !r.cerrada);
    if (reunionAbierta) {
      alert("Ya hay una reunión abierta.");
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

  /* ================= CAMBIAR ESTADO (LOCAL) ================= */
  const cambiarEstado = (index, nuevoEstado) => {
    const copia = [...selectedReunion.asistencia];
    copia[index] = { ...copia[index], estado: nuevoEstado };
    setSelectedReunion(prev => ({ ...prev, asistencia: copia }));
  };

  /* ================= GUARDAR CAMBIOS + LOG ================= */
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

    setSelectedReunion(prev => ({ ...prev, editando: false }));
    setReuniones(prev =>
      prev.map(r => (r.id === selectedReunion.id ? selectedReunion : r))
    );
  };

  /* ================= CANCELAR EDICIÓN ================= */
  const cancelarEdicion = () => {
    const confirmar = window.confirm("¿Seguro que deseas cancelar los cambios?");
    if (!confirmar) return;

    setSelectedReunion(prev => ({
      ...prev,
      asistencia: asistenciaOriginalRef.current,
      editando: false
    }));
  };

  /* ================= CERRAR REUNIÓN ================= */
  const cerrarReunion = async () => {
    const reunionRef = doc(db, "reuniones", selectedReunion.id);
    await updateDoc(reunionRef, { cerrada: true });

    setSelectedReunion(prev => ({ ...prev, cerrada: true }));
    setReuniones(prev =>
      prev.map(r =>
        r.id === selectedReunion.id ? { ...r, cerrada: true } : r
      )
    );
  };

  const reunionesFiltradas = reuniones.filter(r =>
    r.fecha.includes(busquedaFecha)
  );

  const asistentesFiltrados =
    selectedReunion?.asistencia.filter(a => {
      const okNum =
        !busquedaAsociado || a.numeroAsociado.includes(busquedaAsociado);
      const okEstado = !filtroEstado || a.estado === filtroEstado;
      return okNum && okEstado;
    }) || [];

  if (loading) return <p>Cargando reuniones...</p>;

  return (
    <div style={{ display: "flex", gap: "1em" }}>
      <div style={{ width: "220px" }}>
        <button
          onClick={abrirReunion}
          disabled={!(rol === "administrador" || rol === "asistencia")}
        >
          Abrir nueva reunión
        </button>

        <input
          placeholder="Buscar fecha"
          value={busquedaFecha}
          onChange={e => setBusquedaFecha(e.target.value)}
        />

        <ul>
          {reunionesFiltradas.map(r => (
            <li
              key={r.id}
              onClick={() => setSelectedReunion(r)}
              style={{
                cursor: "pointer",
                background:
                  selectedReunion?.id === r.id ? "#e0f7fa" : "#fff"
              }}
            >
              {r.fecha}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        {selectedReunion ? (
          <>
            <h3>
              Reunión {selectedReunion.fecha} {selectedReunion.hora}{" "}
              {selectedReunion.cerrada ? "(Cerrada)" : "(Abierta)"}
            </h3>

            {selectedReunion.cerrada &&
              (rol === "administrador" || rol === "asistencia") && (
                <>
                  {!selectedReunion.editando ? (
                    <button
                      onClick={() => {
                        asistenciaOriginalRef.current =
                          JSON.parse(JSON.stringify(selectedReunion.asistencia));
                        setSelectedReunion(prev => ({
                          ...prev,
                          editando: true
                        }));
                      }}
                    >
                      Editar
                    </button>
                  ) : (
                    <>
                      <button onClick={guardarCambios}>
                        Guardar cambios
                      </button>
                      <button onClick={cancelarEdicion}>
                        Cancelar
                      </button>
                    </>
                  )}
                </>
              )}

            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asistentesFiltrados.map((a, i) => (
                  <tr key={i}>
                    <td>{a.numeroAsociado}</td>
                    <td>
                      {a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}
                    </td>
                    <td>
                      {selectedReunion.editando ? (
                        <select
                          value={a.estado}
                          onChange={e =>
                            cambiarEstado(i, e.target.value)
                          }
                        >
                          <option value="puntual">Puntual</option>
                          <option value="tarde">Tarde</option>
                          <option value="falta">Falta</option>
                        </select>
                      ) : (
                        a.estado
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!selectedReunion.cerrada &&
              (rol === "administrador" || rol === "asistencia") && (
                <button onClick={cerrarReunion}>
                  Cerrar reunión
                </button>
              )}
          </>
        ) : (
          <p>Seleccione una reunión</p>
        )}
      </div>
    </div>
  );
}

export default Reuniones;
