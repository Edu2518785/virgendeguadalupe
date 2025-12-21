import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../services/firebase";

const CrearAsociado = () => {
  const user = useOutletContext();
  if (user?.rol !== "administrador") return null;

  const [asociado, setAsociado] = useState({
    nombres: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    dni: "",
    numeroAsociado: "",
    fechaNacimiento: "",
    fechaIngreso: "",
    estadoCivil: "",
    conviviente: "",
    gradoInstruccion: "",
    departamento: "",
    provincia: "",
    distrito: "",
    fotoUrl: "",
    rol: "asociado",
    deuda: "0",
    hijos: []
  });

  const [hijo, setHijo] = useState({
    nombre: "",
    edad: "",
    estudios: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAsociado({ ...asociado, [name]: value });
  };

  const handleHijoChange = (e) => {
    const { name, value } = e.target;
    setHijo({ ...hijo, [name]: value });
  };

  const agregarHijo = () => {
    if (!hijo.nombre) return;
    setAsociado({
      ...asociado,
      hijos: [...asociado.hijos, hijo]
    });
    setHijo({ nombre: "", edad: "", estudios: "" });
  };

  const dniExiste = async (dni) => {
    const q = query(collection(db, "asociados"), where("dni", "==", dni));
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const numeroAsociadoExiste = async (numero) => {
    const ref = doc(db, "asociados", numero);
    const snap = await getDoc(ref);
    return snap.exists();
  };

  const guardarAsociado = async (e) => {
    e.preventDefault();

    if (!confirm("¿Estás seguro de crear este nuevo asociado?")) return;

    // validar DNI
    if (await dniExiste(asociado.dni)) {
      alert("⚠️ El DNI ya existe en el sistema");
      return;
    }

    // validar número de asociado
    if (await numeroAsociadoExiste(asociado.numeroAsociado)) {
      alert("⚠️ El número de asociado ya existe");
      return;
    }

    await setDoc(
      doc(db, "asociados", asociado.numeroAsociado),
      asociado
    );

    alert("✅ Asociado creado correctamente");

    setAsociado({
      nombres: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      dni: "",
      numeroAsociado: "",
      fechaNacimiento: "",
      fechaIngreso: "",
      estadoCivil: "",
      conviviente: "",
      gradoInstruccion: "",
      departamento: "",
      provincia: "",
      distrito: "",
      fotoUrl: "",
      rol: "asociado",
      deuda: "0",
      hijos: []
    });
  };

  return (
    <div>
      <h2>Registrar Asociado</h2>

      <form onSubmit={guardarAsociado}>
        <input name="nombres" placeholder="Nombres" value={asociado.nombres} onChange={handleChange} />
        <input name="apellidoPaterno" placeholder="Apellido Paterno" value={asociado.apellidoPaterno} onChange={handleChange} />
        <input name="apellidoMaterno" placeholder="Apellido Materno" value={asociado.apellidoMaterno} onChange={handleChange} />
        <input name="dni" placeholder="DNI" value={asociado.dni} onChange={handleChange} />
        <input name="numeroAsociado" placeholder="Número de Asociado (ID)" value={asociado.numeroAsociado} onChange={handleChange} />

        <label>Fecha de Nacimiento</label>
        <input type="date" name="fechaNacimiento" value={asociado.fechaNacimiento} onChange={handleChange} />

        <label>Fecha de Ingreso</label>
        <input type="date" name="fechaIngreso" value={asociado.fechaIngreso} onChange={handleChange} />

        <select name="estadoCivil" value={asociado.estadoCivil} onChange={handleChange}>
          <option value="">Estado civil</option>
          <option value="Soltero">Soltero</option>
          <option value="Casado">Casado</option>
          <option value="Conviviente">Conviviente</option>
          <option value="Viudo">Viudo</option>
        </select>

        <input name="conviviente" placeholder="Nombre del conviviente" value={asociado.conviviente} onChange={handleChange} />
        <input name="gradoInstruccion" placeholder="Grado de Instrucción" value={asociado.gradoInstruccion} onChange={handleChange} />

        <input name="departamento" placeholder="Departamento" value={asociado.departamento} onChange={handleChange} />
        <input name="provincia" placeholder="Provincia" value={asociado.provincia} onChange={handleChange} />
        <input name="distrito" placeholder="Distrito" value={asociado.distrito} onChange={handleChange} />
        <input name="fotoUrl" placeholder="URL Foto" value={asociado.fotoUrl} onChange={handleChange} />

        <p>Rol</p>
        {["asociado", "directiva", "asistencia", "administrador"].map((r) => (
          <label key={r}>
            <input
              type="radio"
              name="rol"
              value={r}
              checked={asociado.rol === r}
              onChange={handleChange}
            />
            {r}
          </label>
        ))}

        <h4>Hijos</h4>
        <input name="nombre" placeholder="Nombre" value={hijo.nombre} onChange={handleHijoChange} />
        <input name="edad" placeholder="Edad" value={hijo.edad} onChange={handleHijoChange} />
        <input name="estudios" placeholder="Estudios" value={hijo.estudios} onChange={handleHijoChange} />
        <button type="button" onClick={agregarHijo}>Agregar hijo</button>

        <ul>
          {asociado.hijos.map((h, i) => (
            <li key={i}>{h.nombre} - {h.edad} años - {h.estudios}</li>
          ))}
        </ul>

        <button type="submit">Guardar Asociado</button>
      </form>
    </div>
  );
};

export default CrearAsociado;
