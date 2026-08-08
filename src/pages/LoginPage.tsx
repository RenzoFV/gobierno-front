import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
      navigate("/inventario");
    } catch {
      setError("Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">Change Impact Analyzer</h1>
        <p className="text-sm text-gray-500 mb-6">Inicia sesión para continuar</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Demo: admin@demo.com / Admin123! · analista@demo.com / Analista123!
        </p>
      </div>
    </div>
  );
}
