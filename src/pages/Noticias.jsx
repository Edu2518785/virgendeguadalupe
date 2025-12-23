import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "../pages/Noticias.jsx";
import "../css/Noticias.css"
function Noticias() {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const snap = await getDocs(collection(db, "noticias"));
        const noticiasData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNoticias(noticiasData);
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticias();
  }, []);

  if (loading) return <p>Cargando noticias...</p>;
  if (noticias.length === 0) return <p>No hay noticias disponibles.</p>;

  return (
    <div className="noticias-container">
      <h2>Noticias</h2>
      <ul>
        {noticias.map((n) => (
          <li key={n.id}>{n.titulo}</li>
        ))}
      </ul>
    </div>
  );
}

export default Noticias;
