import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, BriefcaseBusiness, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createActivo,
  createProceso,
  deleteActivo,
  getActivos,
  getProcesos,
  type Activo,
} from "../api/activos";
import { useAuth } from "../context/AuthContext";
import { cn, userMessage } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
import { Skeleton } from "../components/ui/skeleton";

const tipos = ["Servidor", "Aplicacion", "BaseDeDatos", "API", "Microservicio", "ServicioCloud"];
const PAGE_SIZE = 8;

export default function InventarioPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const queryClient = useQueryClient();

  const { data: activos, isLoading } = useQuery({ queryKey: ["activos"], queryFn: getActivos });
  const { data: procesos, isLoading: cargandoProcesos } = useQuery({ queryKey: ["procesos"], queryFn: getProcesos });

  const [tab, setTab] = useState<"activos" | "procesos">("activos");
  const [activoDialog, setActivoDialog] = useState(false);
  const [procesoDialog, setProcesoDialog] = useState(false);
  const [activoAEliminar, setActivoAEliminar] = useState<Activo | null>(null);
  const [activosPage, setActivosPage] = useState(1);
  const [procesosPage, setProcesosPage] = useState(1);
  const [form, setForm] = useState({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
  const [procForm, setProcForm] = useState({ nombre: "", area: "", criticidad_negocio: 3 });

  useEffect(() => {
    setActivosPage(1);
  }, [activos?.length]);

  useEffect(() => {
    setProcesosPage(1);
  }, [procesos?.length]);

  const totalActivosPages = Math.max(1, Math.ceil((activos?.length ?? 0) / PAGE_SIZE));
  const currentActivosPage = Math.min(activosPage, totalActivosPages);
  const activosPaginados = (activos ?? []).slice((currentActivosPage - 1) * PAGE_SIZE, currentActivosPage * PAGE_SIZE);
  const totalProcesosPages = Math.max(1, Math.ceil((procesos?.length ?? 0) / PAGE_SIZE));
  const currentProcesosPage = Math.min(procesosPage, totalProcesosPages);
  const procesosPaginados = (procesos ?? []).slice((currentProcesosPage - 1) * PAGE_SIZE, currentProcesosPage * PAGE_SIZE);

  const metricas = useMemo(
    () => [
      { label: "Activos", value: activos?.length ?? 0, icon: Boxes, color: "bg-sky-100 text-sky-700" },
      { label: "Procesos", value: procesos?.length ?? 0, icon: BriefcaseBusiness, color: "bg-violet-100 text-violet-700" },
      {
        label: "Criticidad promedio",
        value: activos?.length ? (activos.reduce((sum, activo) => sum + activo.criticidad_base, 0) / activos.length).toFixed(1) : "0",
        icon: Boxes,
        color: "bg-amber-100 text-amber-800",
      },
    ],
    [activos, procesos],
  );

  const crearActivoMutation = useMutation({
    mutationFn: createActivo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activos"] });
      setForm({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
      setActivoDialog(false);
      toast.success("Activo creado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo crear el activo.")),
  });

  const borrarActivoMutation = useMutation({
    mutationFn: deleteActivo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activos"] });
      setActivoAEliminar(null);
      toast.success("Activo eliminado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo eliminar el activo.")),
  });

  const crearProcesoMutation = useMutation({
    mutationFn: createProceso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      setProcForm({ nombre: "", area: "", criticidad_negocio: 3 });
      setProcesoDialog(false);
      toast.success("Proceso de negocio creado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo crear el proceso.")),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {metricas.map((metrica, index) => (
          <Card key={metrica.label} className="animate-pop" style={{ animationDelay: `${index * 45}ms` }}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{metrica.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{metrica.value}</p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", metrica.color)}>
                <metrica.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <button
              className={cn("rounded-md px-4 py-2 text-sm font-semibold transition", tab === "activos" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
              onClick={() => setTab("activos")}
            >
              Activos
            </button>
            <button
              className={cn("rounded-md px-4 py-2 text-sm font-semibold transition", tab === "procesos" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}
              onClick={() => setTab("procesos")}
            >
              Procesos
            </button>
          </div>

          {esAdmin && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Dialog open={activoDialog} onOpenChange={setActivoDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Nuevo activo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo activo</DialogTitle>
                    <DialogDescription>Registra un componente tecnologico y su criticidad base.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 p-5">
                    <Field label="Nombre">
                      <Input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
                    </Field>
                    <Field label="Tipo">
                      <Select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                        {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                      </Select>
                    </Field>
                    <Field label="Criticidad">
                      <Input type="number" min={1} max={5} value={form.criticidad_base} onChange={(event) => setForm({ ...form, criticidad_base: Number(event.target.value) })} />
                    </Field>
                    <Field label="Descripcion">
                      <Textarea value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActivoDialog(false)}>Cancelar</Button>
                    <Button disabled={!form.nombre} loading={crearActivoMutation.isPending} onClick={() => crearActivoMutation.mutate(form)}>Guardar activo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={procesoDialog} onOpenChange={setProcesoDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4" />
                    Nuevo proceso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo proceso</DialogTitle>
                    <DialogDescription>Define el proceso de negocio y su criticidad operacional.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 p-5">
                    <Field label="Nombre">
                      <Input value={procForm.nombre} onChange={(event) => setProcForm({ ...procForm, nombre: event.target.value })} />
                    </Field>
                    <Field label="Area">
                      <Input value={procForm.area} onChange={(event) => setProcForm({ ...procForm, area: event.target.value })} />
                    </Field>
                    <Field label="Criticidad">
                      <Input type="number" min={1} max={5} value={procForm.criticidad_negocio} onChange={(event) => setProcForm({ ...procForm, criticidad_negocio: Number(event.target.value) })} />
                    </Field>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setProcesoDialog(false)}>Cancelar</Button>
                    <Button disabled={!procForm.nombre || !procForm.area} loading={crearProcesoMutation.isPending} onClick={() => crearProcesoMutation.mutate(procForm)}>Guardar proceso</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {tab === "activos" ? (
          <>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-cell">Nombre</th>
                  <th className="table-cell">Tipo</th>
                  <th className="table-cell">Criticidad</th>
                  <th className="table-cell">Descripcion</th>
                  {esAdmin && <th className="table-cell text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && <LoadingRows colSpan={esAdmin ? 5 : 4} />}
                {activosPaginados.map((activo) => (
                  <tr key={activo.id} className="animate-fade">
                    <td className="table-cell font-semibold text-slate-800">{activo.nombre}</td>
                    <td className="table-cell"><Badge variant="sky">{activo.tipo}</Badge></td>
                    <td className="table-cell"><Badge variant="amber">{activo.criticidad_base}/5</Badge></td>
                    <td className="table-cell max-w-md truncate text-slate-500">{activo.descripcion || "Sin descripcion"}</td>
                    {esAdmin && (
                      <td className="table-cell text-right">
                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setActivoAEliminar(activo)} aria-label={`Eliminar ${activo.nombre}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {activos?.length === 0 && <EmptyRow colSpan={esAdmin ? 5 : 4} text="No hay activos registrados." />}
              </tbody>
            </table>
          </div>
          {!isLoading && (activos?.length ?? 0) > 0 && (
            <TablePagination
              page={currentActivosPage}
              pageSize={PAGE_SIZE}
              totalItems={activos?.length ?? 0}
              itemLabel="activos"
              onPageChange={setActivosPage}
            />
          )}
          </>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-cell">Nombre</th>
                  <th className="table-cell">Area</th>
                  <th className="table-cell">Criticidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargandoProcesos && <LoadingRows colSpan={3} />}
                {procesosPaginados.map((proceso) => (
                  <tr key={proceso.id} className="animate-fade">
                    <td className="table-cell font-semibold text-slate-800">{proceso.nombre}</td>
                    <td className="table-cell text-slate-600">{proceso.area}</td>
                    <td className="table-cell"><Badge variant="violet">{proceso.criticidad_negocio}/5</Badge></td>
                  </tr>
                ))}
                {procesos?.length === 0 && <EmptyRow colSpan={3} text="No hay procesos registrados." />}
              </tbody>
            </table>
          </div>
          {!cargandoProcesos && (procesos?.length ?? 0) > 0 && (
            <TablePagination
              page={currentProcesosPage}
              pageSize={PAGE_SIZE}
              totalItems={procesos?.length ?? 0}
              itemLabel="procesos"
              onPageChange={setProcesosPage}
            />
          )}
          </>
        )}
      </Card>

      <Dialog open={!!activoAEliminar} onOpenChange={(open) => !open && setActivoAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar activo</DialogTitle>
            <DialogDescription>
              Esta accion eliminara "{activoAEliminar?.nombre}" del inventario. Confirma solo si estas seguro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivoAEliminar(null)}>Cancelar</Button>
            <Button variant="destructive" loading={borrarActivoMutation.isPending} onClick={() => activoAEliminar && borrarActivoMutation.mutate(activoAEliminar.id)}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function LoadingRows({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8">
        <Skeleton className="h-10 w-full" />
      </td>
    </tr>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">{text}</td>
    </tr>
  );
}
