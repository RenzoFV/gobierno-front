import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import InventarioPage from "./pages/InventarioPage";
import GrafoPage from "./pages/GrafoPage";
import CambiosPage from "./pages/CambiosPage";
import CambioDetallePage from "./pages/CambioDetallePage";
import DashboardPage from "./pages/DashboardPage";

function Layout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/inventario" element={
              <ProtectedRoute><InventarioPage /></ProtectedRoute>
            } />
            <Route path="/grafo" element={
              <ProtectedRoute><GrafoPage /></ProtectedRoute>
            } />
            <Route path="/cambios" element={
              <ProtectedRoute><CambiosPage /></ProtectedRoute>
            } />
            <Route path="/cambios/:id" element={
              <ProtectedRoute><CambioDetallePage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
          </Route>
          <Route path="/" element={<Navigate to="/inventario" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
