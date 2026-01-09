import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Deuda.css";

function Deuda() {
  const user = useOutletContext();
  const [deudaGlobal, setDeudaGlobal] = useState([]);
  const [pagosGlobales, setPagosGlobales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "deudaGlobal"));
        const globalData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDeudaGlobal(globalData);

        const pagosSnap = await getDocs(
          collection(db, "pagosGlobales", "actual", "asociados")
        );
        setPagosGlobales(pagosSnap.docs);

      } catch (error) {
        console.error("Error cargando deuda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user || loading) return <p>Cargando...</p>;

  return (
    <div className="deuda-container">
      <h2>Estado de Deuda</h2>

      <p>
        <strong>Deuda personal:</strong>{" "}
        {user.deuda && user.deuda !== "0"
          ? user.deuda
          : "Felicidades, no cuentas con ninguna deuda personal 😊"}
      </p>

      <p>
        <strong>Colecta general:</strong>{" "}
        {deudaGlobal.length > 0
          ? deudaGlobal.map(d => d.monto).join(" / ")
          : "No hay colecta activa"}
      </p>

      {deudaGlobal.length > 0 && (
        <p>
          <strong>Pagos registrados:</strong> {pagosGlobales.length}
        </p>
      )}
    </div>
  );
}

export default Deuda;
