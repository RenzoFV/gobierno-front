import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function NavBar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-md ${
      isActive ? "bg-blue-700 text-white" : "text-gray-200 hover:bg-blue-700/50"
    }`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-800 text-white flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-lg">Change Impact Analyzer</span>
      </div>
      <div className="flex items-center gap-1">
        <NavLink to="/inventario" className={linkClass}>Inventario</NavLink>
        <NavLink to="/grafo" className={linkClass}>Grafo</NavLink>
        <NavLink to="/cambios" className={linkClass}>Cambios</NavLink>
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-200">
          {usuario?.nombre} ({usuario?.rol})
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-xs bg-blue-700 hover:bg-blue-900 rounded-md"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
