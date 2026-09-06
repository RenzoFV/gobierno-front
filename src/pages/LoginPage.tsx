import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { defaultPathForRole } from "../components/ProtectedRoute";
import { userMessage } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input, Label } from "../components/ui/form";

const demoUsers = [
  { label: "Admin", email: "admin@demo.com", password: "Admin123!" },
  { label: "Analista", email: "analista@demo.com", password: "Analista123!" },
  { label: "Solicitante", email: "solicitante@demo.com", password: "Solicitante123!" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCargando(true);
    try {
      const usuario = await login(email, password);
      toast.success("Bienvenido. Sesion iniciada correctamente.");
      navigate(defaultPathForRole(usuario.rol), { replace: true });
    } catch (error) {
      toast.error(userMessage(error, "Credenciales invalidas. Revisa tu correo y contrasena."));
    } finally {
      setCargando(false);
    }
  };

  const fillDemo = (demo: (typeof demoUsers)[number]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    toast.info(`Credenciales demo cargadas: ${demo.label}.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="animate-panel mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-300 to-amber-300" />
          <div>
            <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-950">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-300">Gobierno TI</p>
            <h1 className="max-w-lg text-4xl font-bold leading-tight">Change Impact Analyzer</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Evalua el impacto de cambios tecnologicos con inventario, dependencias, reglas y asistencia de IA en una sola vista operacional.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Activos", "Criticidad"],
              ["Cambios", "Riesgo"],
              ["IA", "Analisis"],
            ].map(([title, subtitle]) => (
              <div key={title} className="animate-pop rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-lg font-bold">{title}</p>
                <p className="text-xs text-slate-400">{subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex animate-page items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md border-0 shadow-none">
            <div className="mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700 lg:hidden">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Acceso seguro
              </div>
              <h2 className="text-2xl font-bold text-slate-950">Inicia sesion</h2>
              <p className="mt-1 text-sm text-slate-500">Continua con tu cuenta para revisar cambios y riesgos.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="email" type="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={cargando}>
                Ingresar
              </Button>
            </form>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Acceso demo</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {demoUsers.map((demo) => (
                  <Button key={demo.email} type="button" variant="outline" size="sm" onClick={() => fillDemo(demo)}>
                    {demo.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
