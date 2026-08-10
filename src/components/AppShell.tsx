import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  Bot,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tooltip } from "./ui/tooltip";
import FloatingAssistant from "./FloatingAssistant";

const navigation = [
  {
    label: "Resumen",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Gestion",
    items: [
      { label: "Inventario", to: "/inventario", icon: Boxes },
      { label: "Cambios", to: "/cambios", icon: GitBranch },
    ],
  },
  {
    label: "Analisis",
    items: [{ label: "Grafo", to: "/grafo", icon: Network }],
  },
];

const titles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Resumen ejecutivo de cambios, riesgos y activos impactados.",
  },
  "/inventario": {
    title: "Inventario",
    description: "Activos TI, procesos de negocio y criticidad operativa.",
  },
  "/grafo": {
    title: "Grafo de dependencias",
    description: "Mapa visual de relaciones entre activos y procesos.",
  },
  "/cambios": {
    title: "Solicitudes de cambio",
    description: "Registro, seguimiento y analisis de impacto.",
  },
};

export default function AppShell() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const page = useMemo(() => {
    if (location.pathname.startsWith("/cambios/")) {
      return { title: "Detalle del cambio", description: "Evaluacion por reglas, IA y comparacion de resultados." };
    }
    return titles[location.pathname] ?? titles["/dashboard"];
  }, [location.pathname]);

  const confirm = () => {
    logout();
    toast.success("Sesion cerrada correctamente.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 bg-slate-950 text-white transition-all duration-200 lg:flex lg:flex-col",
          collapsed ? "w-28" : "w-72",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          usuario={usuario}
          onLogout={() => setConfirmLogout(true)}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 animate-fade lg:hidden">
          <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" aria-label="Cerrar menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 animate-slide-left flex-col bg-slate-950 text-white shadow-2xl">
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-white hover:bg-white/10" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent collapsed={false} usuario={usuario} onLogout={() => setConfirmLogout(true)} />
          </aside>
        </div>
      )}

      <div className={cn("min-h-screen transition-all duration-200", collapsed ? "lg:pl-28" : "lg:pl-72")}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-100/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-slate-950">{page.title}</h1>
                <p className="hidden truncate text-sm text-slate-500 sm:block">{page.description}</p>
              </div>
            </div>
            <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold leading-tight">{usuario?.nombre ?? "Usuario"}</p>
                <p className="text-xs capitalize text-slate-500">{usuario?.rol ?? "rol"}</p>
              </div>
            </div>
          </div>
        </header>

        <main key={location.pathname} className="animate-page mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

      <FloatingAssistant />

      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar salida</DialogTitle>
            <DialogDescription>Tu sesion local se cerrara y volveras al inicio de sesion.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirm}>
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarContent({
  collapsed,
  usuario,
  onLogout,
  onToggle,
}: {
  collapsed: boolean;
  usuario: { nombre: string; email: string; rol: string } | null;
  onLogout: () => void;
  onToggle?: () => void;
}) {
  return (
    <>
      <div className={cn("flex h-20 items-center gap-3", collapsed ? "px-3" : "px-5")}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Change Impact</p>
            <p className="truncate text-xs text-slate-400">Analyzer</p>
          </div>
        )}
        {onToggle && (
          <Tooltip label={collapsed ? "Expandir" : "Contraer"}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "ml-auto hidden text-slate-300 hover:bg-white/10 hover:text-white lg:inline-flex",
                collapsed && "h-9 w-9 shrink-0",
              )}
              onClick={onToggle}
              aria-label={collapsed ? "Expandir sidebar" : "Contraer sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </Tooltip>
        )}
      </div>

      <nav className="flex-1 space-y-6 px-3">
        {navigation.map((group) => (
          <div key={group.label}>
            {!collapsed && <p className="mb-2 px-3 text-xs font-semibold uppercase text-slate-500">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white",
                      collapsed && "justify-center px-0",
                      isActive && "bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-slate-800 p-3">
        {!collapsed && (
          <div className="rounded-lg bg-white/5 p-3">
            <p className="truncate text-sm font-semibold">{usuario?.nombre ?? "Usuario"}</p>
            <p className="truncate text-xs text-slate-400">{usuario?.email ?? "Sin correo"}</p>
            <p className="mt-2 inline-flex rounded-full bg-sky-400/15 px-2 py-1 text-xs font-semibold capitalize text-sky-200">
              {usuario?.rol ?? "rol"}
            </p>
          </div>
        )}
        <Button
          variant="destructive"
          className={cn("w-full", collapsed && "px-0")}
          onClick={onLogout}
          aria-label="Salir"
          title={collapsed ? "Salir" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Salir"}
        </Button>
      </div>
    </>
  );
}
