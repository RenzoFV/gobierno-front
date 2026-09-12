import type { ReactNode } from "react";
import { Bot, CheckCircle2, ChevronDown, Cpu, Timer } from "lucide-react";
import type { Activo, ProcesoNegocio } from "../api/activos";
import type { DetalleActivoEvaluacion, Evaluacion } from "../api/cambios";
import RiesgoBadge from "./RiesgoBadge";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface ComparacionMetodosProps {
  regla: Evaluacion | null;
  ia: Evaluacion | null;
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
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Coincidencia de activos recuperados</h3>
              </div>
              <p className="text-sm text-muted-foreground">Comparacion entre los activos afectados por reglas y los activos recuperados por IA mediante herramientas del grafo.</p>
            </div>
            <p className="text-3xl font-bold text-primary">{((coincidencia ?? 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ListBlock title={`En comun (${comunes.length})`} values={comunes} labelFor={nombreActivo} />
            <ListBlock title={`Solo motor de reglas (${activosRegla.length - comunes.length})`} values={activosRegla.filter((id) => !activosIa.includes(id))} labelFor={nombreActivo} />
            <ListBlock title={`Solo recuperados por IA (${activosIa.length - comunes.length})`} values={activosIa.filter((id) => !activosRegla.includes(id))} labelFor={nombreActivo} />
          </div>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
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
  data: Evaluacion | null;
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
          <h3 className="font-semibold text-foreground">{title}</h3>
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
          <div className="flex items-center gap-2 text-muted-foreground">
            <Timer className="h-4 w-4" />
            {data.tiempo_analisis_ms} ms
          </div>
          {calculaRiesgo && (
            <MotorMetadata
              version={data.version_motor}
              parametros={data.parametros_usados}
              caminoCritico={data.camino_critico}
              activosById={activosById}
            />
          )}
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
              <p className="mb-2 font-semibold text-foreground">Recomendaciones</p>
              <ul className="space-y-2">
                {data.recomendaciones.map((item, index) => (
                  <li key={index} className="rounded-md border bg-white px-3 py-2 text-foreground">{item}</li>
                ))}
              </ul>
            </div>
          )}
          {calculaRiesgo && (data.detalle_activos?.length ?? 0) > 0 && (
            <TraceabilityTable detalles={data.detalle_activos ?? []} mejorActivo={data.mejor_activo} />
          )}
          {data.respuesta_texto && (
            <div className="max-h-80 overflow-y-auto rounded-lg border bg-white p-4 text-sm leading-6 text-foreground">
              <FormattedAiResponse text={data.respuesta_texto} />
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </Card>
  );
}

function MotorMetadata({
  version,
  parametros,
  caminoCritico,
  activosById,
}: {
  version?: string;
  parametros?: Evaluacion["parametros_usados"];
  caminoCritico?: string[];
  activosById: Map<string, Activo>;
}) {
  const camino = (caminoCritico ?? [])
    .map((id) => activosById.get(id)?.nombre ?? id)
    .join(" -> ");

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="flex flex-wrap gap-2">
        {version && <Badge variant="slate">{version}</Badge>}
        {parametros && (
          <>
            <Badge variant="sky">prof {parametros.profundidad_max}</Badge>
            <Badge variant="sky">att {parametros.atenuacion}</Badge>
            <Badge variant="sky">coef {parametros.coef_proceso}</Badge>
            <Badge variant="amber">umbrales {parametros.umbral_medio}/{parametros.umbral_alto}</Badge>
          </>
        )}
      </div>
      {camino && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Camino critico: <span className="font-medium text-foreground">{camino}</span>
        </p>
      )}
    </div>
  );
}

function TraceabilityTable({ detalles, mejorActivo }: { detalles: DetalleActivoEvaluacion[]; mejorActivo?: string | null }) {
  const ordenados = [...detalles].sort((a, b) => b.score_total_activo - a.score_total_activo);

  return (
    <div>
      <p className="mb-2 font-semibold text-foreground">Trazabilidad por activo</p>
      <div className="max-h-80 overflow-auto rounded-lg border bg-white">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="sticky top-0 bg-muted text-secondary">
            <tr>
              <th className="px-3 py-2 font-semibold">Activo</th>
              <th className="px-3 py-2 font-semibold">Dist.</th>
              <th className="px-3 py-2 font-semibold">Peso</th>
              <th className="px-3 py-2 font-semibold">Factor</th>
              <th className="px-3 py-2 font-semibold">Base</th>
              <th className="px-3 py-2 font-semibold">+Proceso</th>
              <th className="px-3 py-2 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((detalle) => {
              const esCritico = detalle.activo_id === mejorActivo;
              return (
                <tr key={detalle.activo_id} className={esCritico ? "bg-destructive/5" : undefined}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{detalle.nombre}</p>
                    <p className="mt-0.5 text-muted-foreground">{detalle.camino_nombres?.join(" -> ")}</p>
                  </td>
                  <td className="px-3 py-2">{detalle.distancia}</td>
                  <td className="px-3 py-2">{detalle.peso_camino}</td>
                  <td className="px-3 py-2">{detalle.factor_atenuacion}</td>
                  <td className="px-3 py-2">{detalle.score_base}</td>
                  <td className="px-3 py-2">{detalle.aporte_procesos}</td>
                  <td className="px-3 py-2 font-semibold text-foreground">{detalle.score_total_activo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
    <details className="group rounded-lg border bg-white p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="text-xs font-semibold uppercase text-secondary">{title}</span>
        <span className="flex items-center gap-2">
          <Badge variant="slate">{uniqueValues.length}</Badge>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </span>
      </summary>
      {uniqueValues.length ? (
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
          {uniqueValues.map((id) => (
            <li key={id} className="rounded-md bg-muted/70 px-3 py-2">
              <p className="font-medium text-foreground">{labelFor(id)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detailFor(id)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-md bg-muted/70 px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </details>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const compact = value.length > 10;

  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs font-semibold text-secondary">{label}</p>
      <p className={`mt-1 font-bold text-foreground ${compact ? "text-sm leading-5" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function ListBlock({ title, values, labelFor }: { title: string; values: string[]; labelFor?: (id: string) => string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-secondary">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Badge key={value} variant="sky">{labelFor?.(value) ?? value}</Badge>) : <span className="text-sm text-muted-foreground">Ninguno</span>}
      </div>
    </div>
  );
}

function FormattedAiResponse({ text }: { text: string }) {
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    const items = listItems;
    listItems = [];
    elements.push(
      <ul key={`list-${elements.length}`} className="my-3 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{renderInlineText(item)}</li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      listItems.push((bullet?.[1] ?? numbered?.[1] ?? "").trim());
      continue;
    }

    flushList();

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      elements.push(
        <h4 key={`heading-${elements.length}`} className="mb-2 mt-4 text-sm font-semibold text-foreground">
          {renderInlineText(heading[2])}
        </h4>,
      );
      continue;
    }

    elements.push(
      <p key={`paragraph-${elements.length}`} className="my-2">
        {renderInlineText(line)}
      </p>,
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function renderInlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
