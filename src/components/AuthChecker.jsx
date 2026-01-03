// src/components/AuthChecker.jsx
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";

function AuthChecker({ dni }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!dni) {
      navigate("/login", { replace: true });
      return;
    }

    // Check periódico cada 60 segundos
    const interval = setInterval(async () => {
      try {
        const docRef = doc(db, "asociados", dni);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          // Usuario eliminado → cerrar sesión
          sessionStorage.clear();
          navigate("/login", { replace: true });
        }
      } catch (err) {
        console.error("Error comprobando usuario:", err);
      }
    }, 60000); // 60 segundos, puedes ajustar

    return () => clearInterval(interval);
  }, [dni, navigate]);

  return null;
}

export default AuthChecker;
