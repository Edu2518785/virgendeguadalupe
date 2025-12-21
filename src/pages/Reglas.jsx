import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

function Reglas() {
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReglas = async () => {
      try {
        const snap = await getDocs(collection(db, "reglas")); // tu colección
        const reglasData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReglas(reglasData);
      } catch (error) {
        console.error("Error cargando reglas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReglas();
  }, []);

  if (loading) return <p>Cargando reglas...</p>;
  if (reglas.length === 0) return <p>No hay reglas disponibles.</p>;

  return (
    <div>
      <h2>Reglas de la Asociación</h2>
      <ul>
        {reglas.map((r) => (
          <li key={r.id}>{r.titulo}</li> // mostramos el campo "titulo" de cada regla
        ))}
      </ul>
    </div>
  );
}

export default Reglas;
