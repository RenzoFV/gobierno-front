import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, BriefcaseBusiness, Calculator, GitBranch, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addDependencia,
  asociarProceso,
  calcularCriticidad,
  createActivo,
  createProceso,
  deleteActivo,
  getActivo,
  getActivos,
  getProcesos,
  removeDependencia,
  type Activo,
} from "../api/activos";
import { useAuth } from "../context/AuthContext";
import { cn, userMessage } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
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
const rtoOptions = [
  { value: "<=1h", label: "<= 1 h", minimo: 4 },
  { value: "<=4h", label: "<= 4 h", minimo: 3 },
  { value: "<=24h", label: "<= 24 h", minimo: 2 },
  { value: ">24h", label: "> 24 h", minimo: 1 },
] as const;
type RtoOption = (typeof rtoOptions)[number]["value"];

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
  const [activoSeleccionado, setActivoSeleccionado] = useState<Activo | null>(null);
  const [activosPage, setActivosPage] = useState(1);
  const [procesosPage, setProcesosPage] = useState(1);
  const [form, setForm] = useState({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
  const [procForm, setProcForm] = useState({ nombre: "", area: "", criticidad_negocio: 3 });
  const [depForm, setDepForm] = useState({ depende_de_id: "", peso: 0.8 });
  const [procesoAsociarId, setProcesoAsociarId] = useState("");
  const [critForm, setCritForm] = useState({
    impacto_financiero: 3,
    impacto_operativo: 3,
    impacto_cumplimiento: 3,
    impacto_reputacion_clientes: 3,
    rto_objetivo: "<=24h" as RtoOption,
    ajuste_manual: "",
    justificacion_ajuste: "",
  });

  const { data: detalleActivo, isLoading: cargandoDetalle } = useQuery({
    queryKey: ["activo", activoSeleccionado?.id],
    queryFn: () => getActivo(activoSeleccionado!.id),
    enabled: !!activoSeleccionado,
  });

  useEffect(() => {
    setActivosPage(1);
  }, [activos?.length]);

  useEffect(() => {
    setProcesosPage(1);
  }, [procesos?.length]);

  useEffect(() => {
    if (detalleActivo) {
      setCritForm({
        impacto_financiero: detalleActivo.criticidad_financiera ?? detalleActivo.criticidad_base,
        impacto_operativo: detalleActivo.criticidad_operativa ?? detalleActivo.criticidad_base,
        impacto_cumplimiento: detalleActivo.criticidad_cumplimiento ?? detalleActivo.criticidad_base,
        impacto_reputacion_clientes: detalleActivo.criticidad_reputacion_clientes ?? detalleActivo.criticidad_base,
        rto_objetivo: isRtoOption(detalleActivo.criticidad_rto) ? detalleActivo.criticidad_rto : "<=24h",
        ajuste_manual: "",
        justificacion_ajuste: detalleActivo.criticidad_justificacion ?? "",
      });
    }
  }, [detalleActivo]);

  const totalActivosPages = Math.max(1, Math.ceil((activos?.length ?? 0) / PAGE_SIZE));
  const currentActivosPage = Math.min(activosPage, totalActivosPages);
  const activosPaginados = (activos ?? []).slice((currentActivosPage - 1) * PAGE_SIZE, currentActivosPage * PAGE_SIZE);
  const totalProcesosPages = Math.max(1, Math.ceil((procesos?.length ?? 0) / PAGE_SIZE));
  const currentProcesosPage = Math.min(procesosPage, totalProcesosPages);
  const procesosPaginados = (procesos ?? []).slice((currentProcesosPage - 1) * PAGE_SIZE, currentProcesosPage * PAGE_SIZE);

  const metricas = useMemo(
    () => [
      { label: "Componentes TI", value: activos?.length ?? 0, icon: Boxes, color: "bg-accent text-accent-foreground" },
      { label: "Procesos", value: procesos?.length ?? 0, icon: BriefcaseBusiness, color: "bg-secondary/10 text-secondary" },
      {
        label: "Criticidad promedio",
        value: activos?.length ? (activos.reduce((sum, activo) => sum + activo.criticidad_base, 0) / activos.length).toFixed(1) : "0",
        icon: Boxes,
        color: "bg-primary/10 text-primary",
      },
    ],
    [activos, procesos],
  );

  const crearActivoMutation = useMutation({
    mutationFn: createActivo,
    onSuccess: (activo) => {
      queryClient.invalidateQueries({ queryKey: ["activos"] });
      queryClient.invalidateQueries({ queryKey: ["grafo"] });
      setForm({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
      setActivoDialog(false);
      setActivoSeleccionado(activo);
      toast.success("Componente TI creado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo crear el componente TI.")),
  });

  const borrarActivoMutation = useMutation({
    mutationFn: deleteActivo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activos"] });
      queryClient.invalidateQueries({ queryKey: ["grafo"] });
      setActivoAEliminar(null);
      toast.success("Componente TI eliminado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo eliminar el componente TI.")),
  });

  const crearProcesoMutation = useMutation({
    mutationFn: createProceso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      queryClient.invalidateQueries({ queryKey: ["grafo"] });
      setProcForm({ nombre: "", area: "", criticidad_negocio: 3 });
      setProcesoDialog(false);
      toast.success("Proceso de negocio creado correctamente.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo crear el proceso.")),
  });

  const invalidaActivo = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["activos"] });
    queryClient.invalidateQueries({ queryKey: ["procesos"] });
    queryClient.invalidateQueries({ queryKey: ["grafo"] });
    if (id) queryClient.invalidateQueries({ queryKey: ["activo", id] });
  };

  const agregarDependenciaMutation = useMutation({
    mutationFn: ({ id, depende_de_id, peso }: { id: string; depende_de_id: string; peso: number }) => addDependencia(id, depende_de_id, peso),
    onSuccess: (_, vars) => {
      invalidaActivo(vars.id);
      setDepForm({ depende_de_id: "", peso: 0.8 });
      toast.success("Dependencia registrada.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo registrar la dependencia.")),
  });

  const quitarDependenciaMutation = useMutation({
    mutationFn: ({ id, dependenciaId }: { id: string; dependenciaId: string }) => removeDependencia(id, dependenciaId),
    onSuccess: (_, vars) => {
      invalidaActivo(vars.id);
      toast.success("Dependencia eliminada.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo eliminar la dependencia.")),
  });

  const asociarProcesoMutation = useMutation({
    mutationFn: ({ id, procesoId }: { id: string; procesoId: string }) => asociarProceso(id, procesoId),
    onSuccess: (_, vars) => {
      invalidaActivo(vars.id);
      setProcesoAsociarId("");
      toast.success("Proceso asociado.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo asociar el proceso.")),
  });

  const calcularCriticidadMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => calcularCriticidad(id, {
      impacto_financiero: critForm.impacto_financiero,
      impacto_operativo: critForm.impacto_operativo,
      impacto_cumplimiento: critForm.impacto_cumplimiento,
      impacto_reputacion_clientes: critForm.impacto_reputacion_clientes,
      rto_objetivo: critForm.rto_objetivo,
      ajuste_manual: critForm.ajuste_manual ? Number(critForm.ajuste_manual) : null,
      justificacion_ajuste: critForm.justificacion_ajuste,
    }),
    onSuccess: (_, vars) => {
      invalidaActivo(vars.id);
      toast.success("Criticidad calculada.");
    },
    onError: (error) => toast.error(userMessage(error, "No se pudo calcular la criticidad.")),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {metricas.map((metrica, index) => (
          <Card key={metrica.label} className="animate-pop" style={{ animationDelay: `${index * 45}ms` }}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metrica.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{metrica.value}</p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", metrica.color)}>
                <metrica.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={(value) => setTab(value as "activos" | "procesos")} className="w-auto">
            <TabsList>
              <TabsTrigger value="activos">Componentes TI</TabsTrigger>
              <TabsTrigger value="procesos">Procesos</TabsTrigger>
            </TabsList>
          </Tabs>

          {esAdmin && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Dialog open={activoDialog} onOpenChange={setActivoDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Nuevo componente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo componente TI</DialogTitle>
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
                    <Button disabled={!form.nombre} loading={crearActivoMutation.isPending} onClick={() => crearActivoMutation.mutate(form)}>Guardar componente</Button>
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
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criticidad</TableHead>
                  <TableHead>Descripcion</TableHead>
                  {esAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <LoadingRows colSpan={esAdmin ? 5 : 4} />}
                {activosPaginados.map((activo) => (
                  <TableRow key={activo.id} className="animate-fade">
                    <TableCell className="font-semibold text-foreground">{activo.nombre}</TableCell>
                    <TableCell><Badge variant="sky">{activo.tipo}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="amber">base {activo.criticidad_base}/5</Badge>
                        <Badge variant="slate">efec. {activo.criticidad_efectiva ?? activo.criticidad_base}/5</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{activo.descripcion || "Sin descripcion"}</TableCell>
                    {esAdmin && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setActivoSeleccionado(activo)} aria-label={`Gestionar componente ${activo.nombre}`}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setActivoAEliminar(activo)} aria-label={`Eliminar componente ${activo.nombre}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {activos?.length === 0 && <EmptyRow colSpan={esAdmin ? 5 : 4} text="No hay componentes TI registrados." />}
              </TableBody>
            </Table>
          </div>
          {!isLoading && (activos?.length ?? 0) > 0 && (
            <TablePagination
              page={currentActivosPage}
              pageSize={PAGE_SIZE}
              totalItems={activos?.length ?? 0}
              itemLabel="componentes TI"
              onPageChange={setActivosPage}
            />
          )}
          </>
        ) : (
          <>
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Criticidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargandoProcesos && <LoadingRows colSpan={3} />}
                {procesosPaginados.map((proceso) => (
                  <TableRow key={proceso.id} className="animate-fade">
                    <TableCell className="font-semibold text-foreground">{proceso.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{proceso.area}</TableCell>
                    <TableCell><Badge variant="violet">{proceso.criticidad_negocio}/5</Badge></TableCell>
                  </TableRow>
                ))}
                {procesos?.length === 0 && <EmptyRow colSpan={3} text="No hay procesos registrados." />}
              </TableBody>
            </Table>
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
            <DialogTitle>Eliminar componente TI</DialogTitle>
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

      <Dialog open={!!activoSeleccionado} onOpenChange={(open) => !open && setActivoSeleccionado(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestionar componente TI</DialogTitle>
            <DialogDescription>
              Configura criticidad, dependencias y procesos soportados para mantener el grafo trazable.
            </DialogDescription>
          </DialogHeader>

          {cargandoDetalle || !detalleActivo ? (
            <div className="p-5">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              <div className="grid gap-3 rounded-lg border bg-muted/40 p-4 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <p className="font-semibold text-foreground">{detalleActivo.nombre}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{detalleActivo.tipo} - {detalleActivo.descripcion || "Sin descripcion"}</p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <Badge variant="amber">base {detalleActivo.criticidad_base}/5</Badge>
                  <Badge variant="slate">efectiva {detalleActivo.criticidad_efectiva ?? detalleActivo.criticidad_base}/5</Badge>
                  <Badge variant="sky">{detalleActivo.criticidad_origen ?? "manual"}</Badge>
                </div>
              </div>

              <section className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-secondary" />
                  <h3 className="font-semibold text-foreground">Calculo de criticidad</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                  <CritField label="Financiera" value={critForm.impacto_financiero} onChange={(value) => setCritForm({ ...critForm, impacto_financiero: value })} />
                  <CritField label="Operativa" value={critForm.impacto_operativo} onChange={(value) => setCritForm({ ...critForm, impacto_operativo: value })} />
                  <CritField label="Cumplimiento" value={critForm.impacto_cumplimiento} onChange={(value) => setCritForm({ ...critForm, impacto_cumplimiento: value })} />
                  <CritField label="Clientes/reputacion" value={critForm.impacto_reputacion_clientes} onChange={(value) => setCritForm({ ...critForm, impacto_reputacion_clientes: value })} />
                  <Field label="RTO objetivo">
                    <Select value={critForm.rto_objetivo} onChange={(event) => setCritForm({ ...critForm, rto_objetivo: event.target.value as RtoOption })}>
                      {rtoOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </Select>
                  </Field>
                </div>
                <div className="grid gap-3 md:grid-cols-[160px_1fr_auto] md:items-end">
                  <Field label="Ajuste manual">
                    <Select value={critForm.ajuste_manual} onChange={(event) => setCritForm({ ...critForm, ajuste_manual: event.target.value })}>
                      <option value="">Sin ajuste</option>
                      {[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}
                    </Select>
                  </Field>
                  <Field label="Justificacion del ajuste">
                    <Input
                      value={critForm.justificacion_ajuste}
                      onChange={(event) => setCritForm({ ...critForm, justificacion_ajuste: event.target.value })}
                      placeholder="Obligatoria si hay ajuste manual"
                    />
                  </Field>
                  <Button
                    loading={calcularCriticidadMutation.isPending}
                    onClick={() => calcularCriticidadMutation.mutate({ id: detalleActivo.id })}
                  >
                    <Calculator className="h-4 w-4" />
                    Calcular
                  </Button>
                </div>
                <div className="grid gap-2 text-sm md:grid-cols-3">
                  <InfoPill label="Impacto base" value={`${impactoBase(critForm)}/5`} />
                  <InfoPill label="Minimo por RTO" value={`${minimoPorRto(critForm.rto_objetivo)}/5`} />
                  <InfoPill label="Base calculada" value={`${Math.max(impactoBase(critForm), minimoPorRto(critForm.rto_objetivo))}/5`} />
                  <InfoPill label="Heredada del grafo" value={`${detalleActivo.criticidad_heredada ?? 0}/5`} />
                  <InfoPill label="Efectiva actual" value={`${detalleActivo.criticidad_efectiva ?? detalleActivo.criticidad_base}/5`} />
                </div>
                {detalleActivo.criticidad_contribuciones?.length ? (
                  <details className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-medium text-foreground">Ver aportes del grafo</summary>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {detalleActivo.criticidad_contribuciones.slice(0, 6).map((item) => (
                        <li key={`${item.tipo}-${item.id}`}>
                          {item.tipo === "proceso" ? "Proceso" : "Dependiente"}: {item.nombre} aporta {item.aporte}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-secondary" />
                  <h3 className="font-semibold text-foreground">Dependencias</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
                  <Field label="Depende de">
                    <Select value={depForm.depende_de_id} onChange={(event) => setDepForm({ ...depForm, depende_de_id: event.target.value })}>
                      <option value="">Seleccionar componente TI</option>
                      {(activos ?? []).filter((activo) => activo.id !== detalleActivo.id).map((activo) => (
                        <option key={activo.id} value={activo.id}>{activo.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Peso">
                    <Input type="number" min={0} max={1} step={0.1} value={depForm.peso} onChange={(event) => setDepForm({ ...depForm, peso: Number(event.target.value) })} />
                  </Field>
                  <Button
                    disabled={!depForm.depende_de_id}
                    loading={agregarDependenciaMutation.isPending}
                    onClick={() => agregarDependenciaMutation.mutate({ id: detalleActivo.id, depende_de_id: depForm.depende_de_id, peso: depForm.peso })}
                  >
                    <Plus className="h-4 w-4" />
                    Añadir
                  </Button>
                </div>
                <div className="rounded-lg border">
                  {detalleActivo.dependencias.length ? (
                    <ul className="divide-y">
                      {detalleActivo.dependencias.map((dep) => (
                        <li key={dep.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div>
                            <p className="font-medium text-foreground">{dep.nombre}</p>
                            <p className="text-xs text-muted-foreground">Peso {dep.peso}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            loading={quitarDependenciaMutation.isPending}
                            onClick={() => quitarDependenciaMutation.mutate({ id: detalleActivo.id, dependenciaId: dep.id })}
                            aria-label={`Quitar dependencia ${dep.nombre}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin dependencias registradas.</p>
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-foreground">Procesos soportados</h3>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <Field label="Proceso">
                    <Select value={procesoAsociarId} onChange={(event) => setProcesoAsociarId(event.target.value)}>
                      <option value="">Seleccionar proceso</option>
                      {(procesos ?? []).map((proceso) => (
                        <option key={proceso.id} value={proceso.id}>{proceso.nombre}</option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    disabled={!procesoAsociarId}
                    loading={asociarProcesoMutation.isPending}
                    onClick={() => asociarProcesoMutation.mutate({ id: detalleActivo.id, procesoId: procesoAsociarId })}
                  >
                    <Plus className="h-4 w-4" />
                    Asociar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {detalleActivo.procesos_soportados.length ? (
                    detalleActivo.procesos_soportados.map((proceso) => (
                      <Badge key={proceso.id} variant="violet">{proceso.nombre} / {proceso.criticidad_negocio}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin procesos asociados.</span>
                  )}
                </div>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivoSeleccionado(null)}>Cerrar</Button>
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

function isRtoOption(value: unknown): value is RtoOption {
  return rtoOptions.some((option) => option.value === value);
}

function minimoPorRto(value: RtoOption) {
  return rtoOptions.find((option) => option.value === value)?.minimo ?? 1;
}

function impactoBase(params: {
  impacto_financiero: number;
  impacto_operativo: number;
  impacto_cumplimiento: number;
  impacto_reputacion_clientes: number;
}) {
  return Math.max(
    params.impacto_financiero,
    params.impacto_operativo,
    params.impacto_cumplimiento,
    params.impacto_reputacion_clientes,
  );
}

function CritField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={1}
        max={5}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) onChange(Math.min(5, Math.max(1, Math.round(nextValue))));
        }}
      />
    </Field>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white px-3 py-2">
      <p className="text-xs font-semibold text-secondary">{label}</p>
      <p className="mt-1 font-bold text-foreground">{value}</p>
    </div>
  );
}

function LoadingRows({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8">
        <Skeleton className="h-10 w-full" />
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">{text}</TableCell>
    </TableRow>
  );
}
