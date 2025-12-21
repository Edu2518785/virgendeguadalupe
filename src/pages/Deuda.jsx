import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

function Deuda() {
  const user = useOutletContext(); // usuario logueado
  const [deudaGlobal, setDeudaGlobal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeudaGlobal = async () => {
      try {
        const snap = await getDocs(collection(db, "deudaGlobal"));
        const globalData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(), // tipo, monto, fecha
        }));
        setDeudaGlobal(globalData);
      } catch (error) {
        console.error("Error cargando deuda global:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeudaGlobal();
  }, []);

  if (!user || loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Estado de Deuda</h2>

      <p>
        <strong>Deuda:</strong>{" "}
        {user.deuda ? user.deuda : "Felicidades no cuentas con ninguna deuda personal😊"}
      </p>

      <p>
        <strong>Colecta general:</strong>{" "}
        {deudaGlobal.length > 0 && deudaGlobal.some(d => d.monto)
        ? deudaGlobal
        .filter(d => d.monto) // solo los que tienen monto
        .map(d => d.monto)
        .join(" / ")
    : "Por el momento no se solicita ningun tipo colecta general 😊"}
</p>
    </div>
  );
}

export default Deuda;
