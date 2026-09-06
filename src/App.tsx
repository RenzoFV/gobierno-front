import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute, { defaultPathForRole } from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import InventarioPage from "./pages/InventarioPage";
import GrafoPage from "./pages/GrafoPage";
import CambiosPage from "./pages/CambiosPage";
import CambioDetallePage from "./pages/CambioDetallePage";
import DashboardPage from "./pages/DashboardPage";

function Layout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function HomeRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={defaultPathForRole(usuario?.rol)} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route element={<AppShell />}>
            <Route path="/inventario" element={
              <ProtectedRoute roles={["admin", "analista"]}><InventarioPage /></ProtectedRoute>
            } />
            <Route path="/grafo" element={
              <ProtectedRoute roles={["admin", "analista"]}><GrafoPage /></ProtectedRoute>
            } />
            <Route path="/cambios" element={
              <ProtectedRoute roles={["admin", "analista", "solicitante"]}><CambiosPage /></ProtectedRoute>
            } />
            <Route path="/cambios/:id" element={
              <ProtectedRoute roles={["admin", "analista", "solicitante"]}><CambioDetallePage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute roles={["admin", "analista"]}><DashboardPage /></ProtectedRoute>
            } />
            </Route>
          </Route>
          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
