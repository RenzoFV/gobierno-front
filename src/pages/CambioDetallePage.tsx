import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getActivos, getProcesos } from "../api/activos";
import { analizarIA, analizarRegla, getCambio, getComparacion, type ParametrosRegla } from "../api/cambios";
import ComparacionMetodos from "../components/ComparacionMetodos";
import FloatingAssistant from "../components/FloatingAssistant";
import LoadingState from "../components/LoadingState";
import RiesgoBadge from "../components/RiesgoBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label } from "../components/ui/form";
import { Skeleton } from "../components/ui/skeleton";
import { useAuth } from "../context/AuthContext";
import { formatDate, userMessage } from "../lib/utils";

const DEFAULT_REGLA_PARAMS: ParametrosRegla = {
  profundidad_max: 3,
  atenuacion: 0.7,
  coef_proceso: 0.5,
  umbral_medio: 2.0,
  umbral_alto: 3.5,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeReglaParams(params: ParametrosRegla): ParametrosRegla {
  const profundidad_max = Math.round(clamp(safeNumber(params.profundidad_max, DEFAULT_REGLA_PARAMS.profundidad_max), 1, 3));
  const atenuacion = clamp(safeNumber(params.atenuacion, DEFAULT_REGLA_PARAMS.atenuacion), 0, 1);
  const coef_proceso = clamp(safeNumber(params.coef_proceso, DEFAULT_REGLA_PARAMS.coef_proceso), 0, 2);
  let umbral_medio = clamp(safeNumber(params.umbral_medio, DEFAULT_REGLA_PARAMS.umbral_medio), 0, 10);
  let umbral_alto = clamp(safeNumber(params.umbral_alto, DEFAULT_REGLA_PARAMS.umbral_alto), 0.1, 10);

  if (umbral_alto <= umbral_medio) {
    umbral_alto = Number(Math.min(10, umbral_medio + 0.1).toFixed(2));
  }
  if (umbral_alto <= umbral_medio) {
    umbral_medio = Number(Math.max(0, umbral_alto - 0.1).toFixed(2));
  }

  return { profundidad_max, atenuacion, coef_proceso, umbral_medio, umbral_alto };
}

export default function CambioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { usuario } = useAuth();
  const puedeAnalizar = usuario?.rol === "admin" || usuario?.rol === "analista";
  const [reglaParams, setReglaParams] = useState<ParametrosRegla>(DEFAULT_REGLA_PARAMS);

  const { data: cambio, isLoading } = useQuery({
    queryKey: ["cambio", id],
    queryFn: () => getCambio(id!),
    enabled: !!id,
  });
  const { data: comparacion } = useQuery({
    queryKey: ["comparacion", id],
    queryFn: () => getComparacion(id!),
    enabled: !!id && puedeAnalizar,
  });
  const { data: activos = [] } = useQuery({ queryKey: ["activos"], queryFn: getActivos, enabled: puedeAnalizar });
  const { data: procesos = [] } = useQuery({ queryKey: ["procesos"], queryFn: getProcesos, enabled: puedeAnalizar });
  const chatContexto = comparacion?.ia
    ? [
        "Contexto de una solicitud de cambio TI ya analizada. Responde las preguntas usando este contexto y, si necesitas datos adicionales, consulta las herramientas del grafo.",
        `Solicitud: ${cambio?.titulo ?? "Sin titulo"}`,
        `Descripcion: ${cambio?.descripcion || "Sin descripcion"}`,
        `Activo objetivo: ${cambio?.activo_nombre || cambio?.activo_objetivo_id}`,
        `ID activo objetivo: ${cambio?.activo_objetivo_id}`,
        comparacion.regla
          ? `Resultado motor de reglas: riesgo ${comparacion.regla.nivel_riesgo}, score ${comparacion.regla.score_riesgo}, activos afectados ${comparacion.regla.activos_afectados?.join(", ") || "ninguno"}, procesos afectados ${comparacion.regla.procesos_afectados?.join(", ") || "ninguno"}, recomendaciones ${comparacion.regla.recomendaciones?.join("; ") || "ninguna"}.`
          : "Resultado motor de reglas: no disponible.",
        `Respuesta IA ya generada: ${comparacion.ia.respuesta_texto || "Sin respuesta textual."}`,
      ].join("\n")
    : undefined;

  const invalida = () => {
    queryClient.invalidateQueries({ queryKey: ["cambio", id] });
    queryClient.invalidateQueries({ queryKey: ["comparacion", id] });
    queryClient.invalidateQueries({ queryKey: ["historial"] });
    queryClient.invalidateQueries({ queryKey: ["resumen"] });
  };

  const regla = useMutation({
    mutationFn: () => analizarRegla(id!, sanitizeReglaParams(reglaParams)),
    onSuccess: () => {
      invalida();
      toast.success("Analisis por reglas completado.");
    },
    onError: (error) => toast.error(userMessage(error, "Error al analizar con reglas.")),
  });

  const ia = useMutation({
    mutationFn: () => analizarIA(id!),
    onMutate: () => {
      toast.loading("Ejecutando analisis con IA...", { id: "ia-analysis" });
    },
    onSuccess: () => {
      invalida();
      toast.success("Analisis con IA completado.", { id: "ia-analysis" });
    },
    onError: (error) => {
      toast.error(userMessage(error, "Error al analizar con IA. Verifica que la OPENAI_API_KEY este configurada."), { id: "ia-analysis" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState label="Cargando detalle del cambio..." className="min-h-[220px]" />
        <Skeleton className="h-48" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link to="/cambios">
          <ArrowLeft className="h-4 w-4" />
          Volver a cambios
        </Link>
      </Button>

      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <RiesgoBadge nivel={cambio?.estado} />
              <Badge variant="sky">{cambio?.activo_nombre || cambio?.activo_objetivo_id}</Badge>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{cambio?.titulo}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{cambio?.descripcion || "Sin descripcion registrada."}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <p>Creado: {formatDate(cambio?.fecha_creacion)}</p>
              <p>Solicitante: {cambio?.creado_por_nombre || cambio?.creado_por_email || cambio?.creado_por || "No registrado"}</p>
            </div>
          </div>

          {puedeAnalizar && (
            <div className="grid gap-3 sm:grid-cols-2 lg:w-80 lg:grid-cols-1">
              <Button loading={regla.isPending} onClick={() => regla.mutate()}>
                <Cpu className="h-4 w-4" />
                Analizar con regla
              </Button>
              <Button variant="secondary" loading={ia.isPending} onClick={() => ia.mutate()}>
                <Bot className="h-4 w-4" />
                Analizar con IA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {puedeAnalizar && (
        <Card>
          <CardHeader>
            <CardTitle>Parametros del motor de reglas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-5">
            <ParamField label="Profundidad" value={reglaParams.profundidad_max} min={1} max={3} step={1} onChange={(value) => setReglaParams((params) => sanitizeReglaParams({ ...params, profundidad_max: Math.round(value) }))} />
            <ParamField label="Atenuacion" value={reglaParams.atenuacion} min={0} max={1} step={0.1} onChange={(value) => setReglaParams((params) => sanitizeReglaParams({ ...params, atenuacion: value }))} />
            <ParamField label="Coef. proceso" value={reglaParams.coef_proceso} min={0} max={2} step={0.1} onChange={(value) => setReglaParams((params) => sanitizeReglaParams({ ...params, coef_proceso: value }))} />
            <ParamField label="Umbral medio" value={reglaParams.umbral_medio} min={0} max={10} step={0.1} onChange={(value) => setReglaParams((params) => sanitizeReglaParams({ ...params, umbral_medio: value }))} />
            <ParamField label="Umbral alto" value={reglaParams.umbral_alto} min={0.1} max={10} step={0.1} onChange={(value) => setReglaParams((params) => sanitizeReglaParams({ ...params, umbral_alto: value }))} />
          </CardContent>
        </Card>
      )}

      {puedeAnalizar ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Comparacion de resultados</CardTitle>
            <div className="flex items-center gap-2">
              {comparacion?.ia && (
                <FloatingAssistant
                  placement="inline"
                  activoContextoId={cambio?.activo_objetivo_id}
                  contextPrompt={chatContexto}
                  initialMessage="Puedo responder preguntas sobre esta solicitud y el analisis IA ya generado."
                  panelTitle="Chat del analisis"
                  panelSubtitle={cambio?.titulo ?? "Solicitud seleccionada"}
                />
              )}
              <Button variant="outline" size="sm" onClick={invalida}>
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ComparacionMetodos
              regla={comparacion?.regla ?? null}
              ia={comparacion?.ia ?? null}
              coincidencia={comparacion?.coincidencia_activos}
              activos={activos}
              procesos={procesos}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Solicitud registrada</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Tu rol permite registrar y consultar tus solicitudes. El analisis de impacto y la comparacion tecnica son realizados por un analista o administrador.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ParamField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          if (event.target.value === "") return;
          const nextValue = Number(event.target.value);
          if (Number.isFinite(nextValue)) onChange(nextValue);
        }}
      />
    </div>
  );
}
