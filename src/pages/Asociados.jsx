import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate, useOutletContext } from "react-router-dom";

function Asociados() {
  const user = useOutletContext();
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [selectedAsociado, setSelectedAsociado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloConDeuda, setSoloConDeuda] = useState(false);

  useEffect(() => {
    if (!["administrador", "asistencia", "directiva"].includes(user.rol)) {
      navigate("/home", { replace: true });
      return;
    }

    const load = async () => {
      const snap = await getDocs(collection(db, "asociados"));
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLista(data);
    };

    load();
  }, [user, navigate]);

  const mostrar = valor =>
    valor && valor !== "" ? valor : "-------------";

  const asociadosFiltrados = lista.filter(a => {
    const coincideNumero = a.numeroAsociado?.includes(busqueda);
    const tieneDeuda = a.deuda && a.deuda !== "" && a.deuda !== "0";
    return coincideNumero && (!soloConDeuda || tieneDeuda);
  });

  return (
    <div style={{ color: "#000" }}>
      <h2 style={{ color: "#000" }}>Asociados</h2>

      {/* Buscador */}
      <div style={{ marginBottom: "1em" }}>
        <input
          type="text"
          placeholder="Buscar por Nº de asociado"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: "250px", marginRight: "1em", color: "#000" }}
        />

        <label style={{ color: "#000" }}>
          <input
            type="checkbox"
            checked={soloConDeuda}
            onChange={e => setSoloConDeuda(e.target.checked)}
            style={{ marginRight: "0.3em" }}
          />
          Solo con deuda
        </label>
      </div>

      {/* Lista */}
      {asociadosFiltrados.map(a => (
        <div
          key={a.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "0.7em",
            marginBottom: "0.7em",
            cursor: "pointer",
            background: "#fff",
            color: "#000"
          }}
          onClick={() =>
            setSelectedAsociado(prev =>
              prev?.id === a.id ? null : a
            )
          }
        >
          {/* Cabecera */}
          <strong>
            {a.numeroAsociado} - {a.nombres} {a.apellidoPaterno} {a.apellidoMaterno}
          </strong>

          {/* Detalle */}
          {selectedAsociado?.id === a.id && (
            <div style={{ marginTop: "0.7em" }}>
              <p><strong>Fecha de Ingreso:</strong> {mostrar(a.fechaIngreso)}</p>

              <p><strong>Nombres:</strong> {mostrar(a.nombres)}</p>
              <p><strong>Apellido Paterno:</strong> {mostrar(a.apellidoPaterno)}</p>
              <p><strong>Apellido Materno:</strong> {mostrar(a.apellidoMaterno)}</p>

              <p><strong>Fecha de Nacimiento:</strong> {mostrar(a.fechaNacimiento)}</p>

              <p><strong>Natural de:</strong> {mostrar(a.departamento)}</p>
              <p><strong>Provincia:</strong> {mostrar(a.provincia)}</p>
              <p><strong>Distrito:</strong> {mostrar(a.distrito)}</p>
              <p><strong>Dpto:</strong> {mostrar(a.departamento)}</p>

              <p><strong>Ocupación:</strong> {mostrar(a.ocupacion)}</p>
              <p><strong>Grado de Instrucción:</strong> {mostrar(a.gradoInstruccion)}</p>
              <p><strong>Estado Civil:</strong> {mostrar(a.estadoCivil)}</p>
              <p><strong>D.N.I.:</strong> {mostrar(a.dni)}</p>
              <p><strong>Dirección:</strong> {mostrar(a.direccion)}</p>

              <p><strong>Esposa / Conviviente:</strong> {mostrar(a.conviviente)}</p>

              <p><strong>Deuda:</strong> {mostrar(a.deuda)}</p>

              {/* Hijos */}
              <p><strong>Hijos:</strong></p>
              {Array.isArray(a.hijos) && a.hijos.length > 0 ? (
                a.hijos.map((hijo, index) => (
                  <div key={index} style={{ marginLeft: "1em" }}>
                    <p>Nombre: {mostrar(hijo.nombre)}</p>
                    <p>Edad: {mostrar(hijo.edad)}</p>
                    <p>Estudios: {mostrar(hijo.estudios)}</p>
                  </div>
                ))
              ) : (
                <p style={{ marginLeft: "1em" }}>-------------</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Asociados;
