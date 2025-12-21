import { Link, useNavigate } from "react-router-dom";

function Navbar({ rol }) {
  const navigate = useNavigate();
  const userRol = rol || sessionStorage.getItem("rol"); // prioridad al rol que viene de Layout

  const logout = () => {
    if (confirm("¿Seguro que deseas cerrar sesión?")) {
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const can = (roles) => roles.includes(userRol);

  return (
    <nav>
      <Link to="/home">Inicio</Link>

      {can(["administrador", "asistencia", "directiva", "asociado"]) && (
        <Link to="/noticias">Noticias</Link>
      )}

      {can(["administrador", "asistencia", "directiva", "asociado"]) && (
        <Link to="/reglas">Reglas</Link>
      )}

      {can(["administrador", "asistencia", "directiva", "asociado"]) && (
        <Link to="/deuda">Deuda</Link>
      )}

      {can(["administrador", "asistencia", "directiva", "asociado"]) && (
        <Link to="/reuniones">Reuniones</Link>
      )}

      {can(["administrador", "asistencia", "directiva"]) && (
        <Link to="/asociados">Asociados</Link>
      )}
      {can(["administrador"]) && (
  <Link to="/crear-asociado">Crear Asociado</Link>
)}

      <button onClick={logout}>Cerrar sesión</button>
    </nav>
  );
}

export default Navbar;
