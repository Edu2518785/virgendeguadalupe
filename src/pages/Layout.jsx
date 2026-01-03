import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import Navbar from "../components/Navbar";
import AuthChecker from "../components/AuthChecker";

function Layout() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dni = sessionStorage.getItem("dni");
    if (!dni) return navigate("/login", { replace: true });

    const load = async () => {
      const q = query(collection(db, "asociados"), where("dni", "==", dni));
      const snap = await getDocs(q);
      if (snap.empty) return navigate("/login", { replace: true });
      setUser(snap.docs[0].data());
    };

    load();
  }, [navigate]);

  if (!user) return <p>Cargando...</p>;

  return (
    <>
      {/* Componente que verifica si el usuario sigue existiendo */}
      <AuthChecker dni={user.dni} />

      <Navbar rol={user.rol} />
      <Outlet context={user} />
    </>
  );
}

export default Layout;
