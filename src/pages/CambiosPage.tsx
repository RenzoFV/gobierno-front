import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, GitBranch, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { crearCambio, getCambios } from "../api/cambios";
import { getActivos } from "../api/activos";
import RiesgoBadge from "../components/RiesgoBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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

export default function CambiosPage() {
  const queryClient = useQueryClient();
  const { data: cambios, isLoading } = useQuery({ queryKey: ["cambios"], queryFn: getCambios });
  const { data: activos } = useQuery({ queryKey: ["activos"], queryFn: getActivos });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("todos");
  const [form, setForm] = useState({ titulo: "", descripcion: "", activo_objetivo_id: "" });

  const estados = useMemo(() => {
    const values = new Set((cambios ?? []).map((c) => c.estado).filter(Boolean));
    return ["todos", ...Array.from(values)];
  }, [cambios]);

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cambios ?? []).filter((cambio) => {
      const matchesSearch = !term || `${cambio.titulo} ${cambio.descripcion} ${cambio.activo_nombre ?? ""}`.toLowerCase().includes(term);
      const matchesEstado = estado === "todos" || cambio.estado === estado;
      return matchesSearch && matchesEstado;
    });
  }, [cambios, estado, search]);

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Solicitudes</p>
              <p className="mt-2 text-3xl font-bold">{cambios?.length ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <GitBranch className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" placeholder="Buscar por titulo, descripcion o activo..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select className="lg:w-48" value={estado} onChange={(event) => setEstado(event.target.value)}>
              {estados.map((item) => <option key={item} value={item}>{item === "todos" ? "Todos los estados" : item}</option>)}
            </Select>
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
                  <DialogDescription>Registra el cambio y selecciona el activo objetivo para iniciar el analisis.</DialogDescription>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-cell">Titulo</th>
                <th className="table-cell">Activo objetivo</th>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Estado</th>
                <th className="table-cell text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Cargando solicitudes...</td>
                </tr>
              )}
              {filtrados.map((cambio) => (
                <tr key={cambio.id} className="animate-fade">
                  <td className="table-cell">
                    <p className="font-semibold text-slate-800">{cambio.titulo}</p>
                    <p className="mt-1 line-clamp-1 max-w-lg text-xs text-slate-500">{cambio.descripcion}</p>
                  </td>
                  <td className="table-cell"><Badge variant="sky">{cambio.activo_nombre || cambio.activo_objetivo_id}</Badge></td>
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
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    No se encontraron solicitudes con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
