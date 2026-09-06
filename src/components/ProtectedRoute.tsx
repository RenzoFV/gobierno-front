import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Rol } from "../context/AuthContext";

export function defaultPathForRole(rol?: Rol | string | null) {
  return rol === "solicitante" ? "/cambios" : "/dashboard";
}

export default function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: Rol[] }) {
  const { token, usuario } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (roles?.length && (!usuario || !roles.includes(usuario.rol))) {
    return <Navigate to={defaultPathForRole(usuario?.rol)} replace />;
  }
  return children;
}
