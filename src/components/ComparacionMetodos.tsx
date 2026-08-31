import type { ReactNode } from "react";
import { Bot, CheckCircle2, ChevronDown, Cpu, Timer } from "lucide-react";
import type { Activo, ProcesoNegocio } from "../api/activos";
import RiesgoBadge from "./RiesgoBadge";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface EvaluacionData {
  metodo: string;
  nivel_riesgo: string;
  score_riesgo: number;
  activos_afectados: string[];
  procesos_afectados: string[];
  recomendaciones: string[];
  tiempo_analisis_ms: number;
  respuesta_texto?: string;
}

interface ComparacionMetodosProps {
  regla: EvaluacionData | null;
  ia: EvaluacionData | null;
  coincidencia?: number;
  activos?: Activo[];
  procesos?: ProcesoNegocio[];
}

export default function ComparacionMetodos({ regla, ia, coincidencia, activos = [], procesos = [] }: ComparacionMetodosProps) {
  const activosRegla = regla?.activos_afectados ?? [];
  const activosIa = ia?.activos_afectados ?? [];
  const comunes = activosRegla.filter((id) => activosIa.includes(id));
  const activosById = new Map(activos.map((activo) => [activo.id, activo]));
  const procesosById = new Map(procesos.map((proceso) => [proceso.id, proceso]));
  const nombreActivo = (id: string) => activosById.get(id)?.nombre ?? id;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisCard
          title="Motor de reglas"
          icon={<Cpu className="h-5 w-5" />}
          data={regla}
          empty="Ejecuta el analisis por reglas para calcular riesgo deterministico."
          activosById={activosById}
          procesosById={procesosById}
        />
        <AnalysisCard
          title="Asistente IA"
          icon={<Bot className="h-5 w-5" />}
          data={ia}
          empty="Ejecuta el analisis con IA para obtener una lectura explicativa."
          activosById={activosById}
          procesosById={procesosById}
        />
      </div>

      {regla && ia ? (
        <Card className="animate-slide-up p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold">Coincidencia de activos recuperados</h3>
              </div>
              <p className="text-sm text-slate-500">Comparacion entre los activos afectados por reglas y los activos recuperados por IA mediante herramientas del grafo.</p>
            </div>
            <p className="text-3xl font-bold text-sky-700">{((coincidencia ?? 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ListBlock title={`En comun (${comunes.length})`} values={comunes} labelFor={nombreActivo} />
            <ListBlock title={`Solo motor de reglas (${activosRegla.length - comunes.length})`} values={activosRegla.filter((id) => !activosIa.includes(id))} labelFor={nombreActivo} />
            <ListBlock title={`Solo recuperados por IA (${activosIa.length - comunes.length})`} values={activosIa.filter((id) => !activosRegla.includes(id))} labelFor={nombreActivo} />
          </div>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Genera ambos analisis para ver la coincidencia de activos.
        </div>
      )}
    </div>
  );
}

function AnalysisCard({
  title,
  icon,
  data,
  empty,
  activosById,
  procesosById,
}: {
  title: string;
  icon: ReactNode;
  data: EvaluacionData | null;
  empty: string;
  activosById: Map<string, Activo>;
  procesosById: Map<string, ProcesoNegocio>;
}) {
  const esIa = data?.metodo === "ia";
  const calculaRiesgo = !esIa;

  return (
    <Card className="animate-pop p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">{icon}</div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
        </div>
        {data ? (calculaRiesgo ? <RiesgoBadge nivel={data.nivel_riesgo || null} /> : <Badge>No calculado</Badge>) : <Badge>Sin analisis</Badge>}
      </div>

      {data ? (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Score" value={calculaRiesgo ? String(data.score_riesgo ?? "N/A") : "No calculado por IA"} />
            <Metric label="Activos" value={String(data.activos_afectados?.length ?? 0)} />
            <Metric label="Procesos" value={String(data.procesos_afectados?.length ?? 0)} />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Timer className="h-4 w-4" />
            {data.tiempo_analisis_ms} ms
          </div>
          <div className="space-y-2">
            <DisclosureList
              title={calculaRiesgo ? "Activos afectados" : "Activos recuperados"}
              values={data.activos_afectados ?? []}
              labelFor={(id) => activosById.get(id)?.nombre ?? id}
              detailFor={(id) => {
                const activo = activosById.get(id);
                return activo ? `${activo.tipo} - Criticidad ${activo.criticidad_base}` : id;
              }}
            />
            <DisclosureList
              title={calculaRiesgo ? "Procesos afectados" : "Procesos recuperados"}
              values={data.procesos_afectados ?? []}
              labelFor={(id) => procesosById.get(id)?.nombre ?? id}
              detailFor={(id) => {
                const proceso = procesosById.get(id);
                return proceso ? `${proceso.area} - Criticidad ${proceso.criticidad_negocio}` : id;
              }}
            />
          </div>
          {data.recomendaciones?.length > 0 && (
            <div>
              <p className="mb-2 font-semibold text-slate-800">Recomendaciones</p>
              <ul className="space-y-2">
                {data.recomendaciones.map((item, index) => (
                  <li key={index} className="rounded-md bg-slate-50 px-3 py-2 text-slate-600">{item}</li>
                ))}
              </ul>
            </div>
          )}
          {data.respuesta_texto && (
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 leading-6 text-slate-600">
              <p className="whitespace-pre-wrap">{data.respuesta_texto}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{empty}</p>
      )}
    </Card>
  );
}

function DisclosureList({
  title,
  values,
  emptyLabel = "Ninguno registrado.",
  labelFor,
  detailFor,
}: {
  title: string;
  values: string[];
  emptyLabel?: string;
  labelFor: (id: string) => string;
  detailFor: (id: string) => string;
}) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  return (
    <details className="group rounded-lg bg-slate-50 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-xs font-semibold uppercase text-slate-500">{title}</span>
        <span className="flex items-center gap-2">
          <Badge variant="slate">{uniqueValues.length}</Badge>
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      {uniqueValues.length ? (
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
          {uniqueValues.map((id) => (
            <li key={id} className="rounded-md bg-white px-3 py-2 shadow-sm shadow-slate-100">
              <p className="font-medium text-slate-700">{labelFor(id)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{detailFor(id)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-slate-400">{emptyLabel}</p>
      )}
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const compact = value.length > 10;

  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 font-bold text-slate-950 ${compact ? "text-xs leading-4" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function ListBlock({ title, values, labelFor }: { title: string; values: string[]; labelFor?: (id: string) => string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Badge key={value} variant="sky">{labelFor?.(value) ?? value}</Badge>) : <span className="text-sm text-slate-400">Ninguno</span>}
      </div>
    </div>
  );
}
