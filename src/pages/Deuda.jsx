import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Deuda.css";

function Deuda() {
  const user = useOutletContext();
  const [deudaGlobal, setDeudaGlobal] = useState([]);
  const [pagosGlobales, setPagosGlobales] = useState([]);
  const [yaPagoGlobal, setYaPagoGlobal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // DEUDA GLOBAL
        const snap = await getDocs(collection(db, "deudaGlobal"));
        const globalData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDeudaGlobal(globalData);

        // PAGOS GLOBALES
        const pagosSnap = await getDocs(
          collection(db, "pagosGlobales", "actual", "asociados")
        );

        const pagos = [];
        let pagoEncontrado = false;

        pagosSnap.forEach(doc => {
          const data = doc.data();
          pagos.push(data);

          if (String(data.numeroAsociado) === String(user?.numeroAsociado)) {
            pagoEncontrado = true;
          }
        });

        setPagosGlobales(pagos);
        setYaPagoGlobal(pagoEncontrado);

      } catch (error) {
        console.error("Error cargando deuda:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

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
        {deudaGlobal.length === 0
          ? "No hay colecta activa"
          : yaPagoGlobal
          ? "Usted ya colaboró con la colecta general ✅"
          : deudaGlobal.map(d => d.monto).join(" / ")}
      </p>
    </div>
  );
}

export default Deuda;
