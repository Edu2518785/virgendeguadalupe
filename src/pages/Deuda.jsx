import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import "../css/Deuda.css";

function Deuda() {
  const user = useOutletContext();
  const [deudaGlobal, setDeudaGlobal] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const dg = await getDocs(collection(db, "deudaGlobal"));
      setDeudaGlobal(dg.docs.map(d => d.data()));

      const pg = await getDocs(
        collection(db, "pagosGlobales", "actual", "asociados")
      );
      setPagos(pg.docs.map(d => d.data()));

      setLoading(false);
    };

    load();
  }, []);

  if (!user || loading) return <p>Cargando...</p>;

  return (
    <div className="deuda-container">
      <h2>Estado de Deuda</h2>

      <p>
        <strong>Deuda personal:</strong>{" "}
        {user.deuda && user.deuda !== "0" ? user.deuda : "Sin deuda 😊"}
      </p>

      <p>
        <strong>Colecta general:</strong>{" "}
        {deudaGlobal.length ? deudaGlobal.map(d => d.monto).join(" / ") : "No hay"}
      </p>

      <p>
        <strong>Pagos registrados:</strong> {pagos.length}
      </p>
    </div>
  );
}

export default Deuda;
