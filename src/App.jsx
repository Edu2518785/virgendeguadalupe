import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Noticias from "./pages/Noticias";
import Reglas from "./pages/Reglas";
import Deuda from "./pages/Deuda";
import Reuniones from "./pages/Reuniones";
import Asociados from "./pages/Asociados";
import Layout from "./pages/Layout";
import CrearAsociado from "./pages/crearAsociado";

const PrivateRoute = () =>
  sessionStorage.getItem("logged") === "true"
    ? <Layout />
    : <Navigate to="/login" replace />;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PrivateRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/noticias" element={<Noticias />} />
        <Route path="/reglas" element={<Reglas />} />
        <Route path="/reuniones" element={<Reuniones />} />
        <Route path="/asociados" element={<Asociados />} />
        <Route path="/deuda" element={<Deuda />} />
        <Route path="/crear-asociado" element={<CrearAsociado />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
