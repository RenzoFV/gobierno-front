import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes,
  Bot,
  ChevronsUpDown,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, type Rol } from "../context/AuthContext";
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

const navigation: {
  label: string;
  items: { label: string; to: string; icon: typeof LayoutDashboard; roles: Rol[] }[];
}[] = [
  {
    label: "Resumen",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, roles: ["admin", "analista"] }],
  },
  {
    label: "Gestion",
    items: [
      { label: "Inventario", to: "/inventario", icon: Boxes, roles: ["admin", "analista"] },
      { label: "Cambios", to: "/cambios", icon: GitBranch, roles: ["admin", "analista", "solicitante"] },
    ],
  },
  {
    label: "Analisis",
    items: [{ label: "Grafo", to: "/grafo", icon: Network, roles: ["admin", "analista"] }],
  },
];

const titles: Record<string, { title: string; description: string }> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Resumen ejecutivo de cambios, riesgos y componentes TI impactados.",
  },
  "/inventario": {
    title: "Inventario",
    description: "Componentes TI, procesos de negocio y criticidad operativa.",
  },
  "/grafo": {
    title: "Grafo de dependencias",
    description: "Mapa visual de relaciones entre componentes TI y procesos.",
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const puedeUsarAsistente = usuario?.rol === "admin" || usuario?.rol === "analista";

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const page = useMemo(() => {
    if (location.pathname.startsWith("/cambios/")) {
      if (usuario?.rol === "solicitante") {
        return { title: "Detalle de solicitud", description: "Seguimiento de la solicitud registrada." };
      }
      return { title: "Detalle del cambio", description: "Evaluacion por reglas, IA y comparacion de resultados." };
    }
    if (location.pathname === "/cambios" && usuario?.rol === "solicitante") {
      return { title: "Mis solicitudes", description: "Registro y seguimiento de solicitudes de cambio." };
    }
    return titles[location.pathname] ?? titles["/dashboard"];
  }, [location.pathname, usuario?.rol]);

  const confirm = () => {
    logout();
    toast.success("Sesion cerrada correctamente.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-sidebar-border bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] lg:flex lg:flex-col"
      >
        <SidebarContent usuario={usuario} onLogout={() => setConfirmLogout(true)} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 animate-fade lg:hidden">
          <button className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" aria-label="Cerrar menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex h-full w-72 animate-slide-left flex-col border-r border-sidebar-border bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] shadow-2xl">
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent usuario={usuario} onLogout={() => setConfirmLogout(true)} />
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-foreground">{page.title}</h1>
                <p className="hidden truncate text-sm text-muted-foreground sm:block">{page.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {puedeUsarAsistente && (
                <Tooltip label="Asistente" side="bottom">
                  <FloatingAssistant placement="nav" />
                </Tooltip>
              )}
              <Tooltip label={usuario?.nombre ?? "Usuario"} side="bottom">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm" aria-label={usuario?.nombre ?? "Usuario"}>
                  <UserCircle className="h-5 w-5" />
                </div>
              </Tooltip>
            </div>
          </div>
        </header>

        <main key={location.pathname} className="animate-page mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>

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

function visibleNavigation(rol?: Rol | string | null) {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (rol && item.roles.includes(rol as Rol))),
    }))
    .filter((group) => group.items.length > 0);
}

function SidebarContent({
  usuario,
  onLogout,
}: {
  usuario: { nombre: string; email: string; rol: string } | null;
  onLogout: () => void;
}) {
  const itemsVisibles = visibleNavigation(usuario?.rol);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 pr-14 lg:pr-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">Change Impact</p>
          <p className="truncate text-xs text-sidebar-foreground/60">Analyzer</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 px-3 py-4">
        {itemsVisibles.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-xs font-medium text-sidebar-foreground/45">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-sidebar-foreground/75 outline-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div
        ref={footerRef}
        className="relative border-t border-sidebar-border p-3"
        onBlur={(event) => {
          if (!footerRef.current?.contains(event.relatedTarget as Node | null)) {
            setUserMenuOpen(false);
          }
        }}
      >
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-md text-left text-sidebar-foreground outline-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            "px-2 py-2",
            userMenuOpen && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
          onClick={() => setUserMenuOpen((value) => !value)}
          aria-expanded={userMenuOpen}
          aria-label="Abrir menu de usuario"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            <UserCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{usuario?.nombre ?? "Usuario"}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{usuario?.email ?? "Sin correo"}</p>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50" />
        </button>

        {userMenuOpen && (
          <div className="absolute bottom-16 left-3 right-3 z-50 overflow-hidden rounded-lg border bg-[hsl(var(--popover))] text-[hsl(var(--popover-foreground))] shadow-2xl ring-1 ring-border lg:bottom-3 lg:left-full lg:right-auto lg:ml-2 lg:w-56">
            <div className="flex items-center gap-3 border-b px-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{usuario?.nombre ?? "Usuario"}</p>
                <p className="truncate text-xs text-muted-foreground">{usuario?.email ?? "Sin correo"}</p>
              </div>
            </div>
            <div className="border-b p-1">
              <MenuItem icon={<ShieldCheck className="h-4 w-4" />} label={usuario?.rol ?? "Rol"} />
              <MenuItem icon={<UserCircle className="h-4 w-4" />} label="Cuenta" />
            </div>
            <div className="p-1">
              <MenuItem icon={<LogOut className="h-4 w-4" />} label="Cerrar sesion" onClick={onLogout} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-foreground outline-none transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
    >
      {icon}
      <span className="truncate capitalize">{label}</span>
    </button>
  );
}
