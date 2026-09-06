import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { crearCambio, getCambios } from "../api/cambios";
import { getActivos } from "../api/activos";
import { useAuth } from "../context/AuthContext";
import RiesgoBadge from "../components/RiesgoBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import TablePagination from "../components/TablePagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input, Label, Select, Textarea } from "../components/ui/form";
import { formatDate, userMessage } from "../lib/utils";

const PAGE_SIZE = 8;

export default function CambiosPage() {
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const esSolicitante = usuario?.rol === "solicitante";
  const { data: cambios, isLoading } = useQuery({ queryKey: ["cambios"], queryFn: getCambios });
  const { data: activos } = useQuery({ queryKey: ["activos"], queryFn: getActivos });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("todos");
  const [solicitante, setSolicitante] = useState("todos");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ titulo: "", descripcion: "", activo_objetivo_id: "" });

  const estados = useMemo(() => {
    const values = new Set((cambios ?? []).map((c) => c.estado).filter(Boolean));
    return ["todos", ...Array.from(values)];
  }, [cambios]);

  const solicitantes = useMemo(() => {
    const values = new Map<string, { id: string; nombre: string; email?: string }>();
    for (const cambio of cambios ?? []) {
      if (!cambio.creado_por) continue;
      values.set(cambio.creado_por, {
        id: cambio.creado_por,
        nombre: cambio.creado_por_nombre || cambio.creado_por_email || cambio.creado_por,
        email: cambio.creado_por_email,
      });
    }
    return Array.from(values.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [cambios]);

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cambios ?? []).filter((cambio) => {
      const solicitanteTexto = `${cambio.creado_por_nombre ?? ""} ${cambio.creado_por_email ?? ""} ${cambio.creado_por ?? ""}`;
      const matchesSearch = !term || `${cambio.titulo} ${cambio.descripcion} ${cambio.activo_nombre ?? ""} ${solicitanteTexto}`.toLowerCase().includes(term);
      const matchesEstado = estado === "todos" || cambio.estado === estado;
      const matchesSolicitante = esSolicitante || solicitante === "todos" || cambio.creado_por === solicitante;
      return matchesSearch && matchesEstado && matchesSolicitante;
    });
  }, [cambios, esSolicitante, estado, search, solicitante]);

  useEffect(() => {
    setPage(1);
  }, [estado, search, solicitante]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginados = filtrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const colSpan = esSolicitante ? 5 : 6;

  const crear = useMutation({
    mutationFn: crearCambio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cambios"] });
      setForm({ titulo: "", descripcion: "", activo_objetivo_id: "" });
      setDialogOpen(false);
      toast.success("Solicitud de cambio registrada.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo registrar la solicitud.")),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[minmax(220px,1fr)_220px] lg:grid-cols-[minmax(260px,1fr)_220px_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar por titulo, descripcion o activo..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={estado} onChange={(event) => setEstado(event.target.value)}>
            {estados.map((item) => <option key={item} value={item}>{item === "todos" ? "Todos los estados" : item}</option>)}
          </Select>
          {!esSolicitante && (
            <Select value={solicitante} onChange={(event) => setSolicitante(event.target.value)}>
              <option value="todos">Todos los solicitantes</option>
              {solicitantes.map((item) => (
                <option key={item.id} value={item.id}>{item.nombre}</option>
              ))}
            </Select>
          )}
        </div>
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Nueva solicitud
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva solicitud de cambio</DialogTitle>
                <DialogDescription>
                  {esSolicitante
                    ? "Registra el cambio para que un analista evalue su impacto."
                    : "Registra el cambio y selecciona el activo objetivo para iniciar el analisis."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-5">
                <Field label="Titulo">
                  <Input value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} />
                </Field>
                <Field label="Descripcion">
                  <Textarea value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
                </Field>
                <Field label="Activo objetivo">
                  <Select value={form.activo_objetivo_id} onChange={(event) => setForm({ ...form, activo_objetivo_id: event.target.value })}>
                    <option value="">Selecciona un activo...</option>
                    {activos?.map((activo) => (
                      <option key={activo.id} value={activo.id}>{activo.nombre} ({activo.id})</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button disabled={!form.titulo || !form.activo_objetivo_id} loading={crear.isPending} onClick={() => crear.mutate(form)}>
                  Registrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-cell">Titulo</th>
                <th className="table-cell">Activo objetivo</th>
                {!esSolicitante && <th className="table-cell">Solicitante</th>}
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Estado</th>
                <th className="table-cell text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-400">Cargando solicitudes...</td>
                </tr>
              )}
              {paginados.map((cambio) => (
                <tr key={cambio.id} className="animate-fade">
                  <td className="table-cell">
                    <p className="font-semibold text-slate-800">{cambio.titulo}</p>
                    <p className="mt-1 line-clamp-1 max-w-lg text-xs text-slate-500">{cambio.descripcion}</p>
                  </td>
                  <td className="table-cell"><Badge variant="sky">{cambio.activo_nombre || cambio.activo_objetivo_id}</Badge></td>
                  {!esSolicitante && (
                    <td className="table-cell">
                      <p className="font-medium text-slate-700">{cambio.creado_por_nombre || cambio.creado_por}</p>
                      {cambio.creado_por_email && <p className="mt-1 text-xs text-slate-500">{cambio.creado_por_email}</p>}
                    </td>
                  )}
                  <td className="table-cell text-slate-500">{formatDate(cambio.fecha_creacion)}</td>
                  <td className="table-cell"><RiesgoBadge nivel={cambio.estado} /></td>
                  <td className="table-cell text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/cambios/${cambio.id}`}>
                        <Eye className="h-4 w-4" />
                        Detalle
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtrados.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
                    No se encontraron solicitudes con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filtrados.length > 0 && (
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={filtrados.length}
            itemLabel="solicitudes"
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
