import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "../css/Navbar.css";

function Navbar({ rol }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRol = rol || sessionStorage.getItem("rol");
  const [open, setOpen] = useState(false);

  const logout = () => {
    if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
      sessionStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const can = (roles) => roles.includes(userRol);

  const links = [
    { to: "/home", label: "Inicio", roles: ["administrador","asistencia","directiva","asociado"] },
    { to: "/noticias", label: "Noticias", roles: ["administrador","asistencia","directiva","asociado"] },
    { to: "/reglas", label: "Reglas", roles: ["administrador","asistencia","directiva","asociado"] },
    { to: "/deuda", label: "Deuda", roles: ["administrador","asistencia","directiva","asociado"] },
    { to: "/reuniones", label: "Reuniones", roles: ["administrador","asistencia","directiva","asociado"] },
    { to: "/asociados", label: "Asociados", roles: ["administrador","asistencia","directiva"] },
    { to: "/crear-asociado", label: "Crear Asociado", roles: ["administrador"] },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo"></div>

        {/* Desktop links */}
        <div className="nav-links-desktop">
          {links.map(
            (link) =>
              can(link.roles) && (
                <Link
                  key={link.to}
                  to={link.to}
                  className={location.pathname === link.to ? "active" : ""}
                >
                  {link.label}
                </Link>
              )
          )}
          <button className="logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="hamburger" onClick={() => setOpen(!open)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        {links.map(
          (link) =>
            can(link.roles) && (
              <Link
                key={link.to}
                to={link.to}
                className={location.pathname === link.to ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            )
        )}
        <button
          className="logout-btn"
          onClick={() => {
            setOpen(false);
            logout();
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
    </nav>
  );
}

export default Navbar;
