import { useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";

function AuthChecker({ dni }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!dni) return;

    // Referencia a la colección completa
    const colRef = collection(db, "asociados");

    // Query para encontrar el documento con ese DNI
    const q = query(colRef, where("dni", "==", dni));

    // Listener en tiempo real
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        // ⚡ Solo si ya no existe el usuario
        sessionStorage.clear();
        navigate("/login", { replace: true });
      }
      // ⚡ Si existe, no hacer nada
    });

    return () => unsubscribe();
  }, [dni, navigate]);

  return null;
}

export default AuthChecker;
