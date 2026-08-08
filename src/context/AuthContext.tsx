import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import client from "../api/client";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email: string, password: string) => {
    const { data } = await client.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
