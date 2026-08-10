import type { ReactNode } from "react";
import { Bot, CheckCircle2, Cpu, Timer } from "lucide-react";
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
}

export default function ComparacionMetodos({ regla, ia, coincidencia }: ComparacionMetodosProps) {
  const activosRegla = regla?.activos_afectados ?? [];
  const activosIa = ia?.activos_afectados ?? [];
  const comunes = activosRegla.filter((id) => activosIa.includes(id));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalysisCard title="Motor de reglas" icon={<Cpu className="h-5 w-5" />} data={regla} empty="Ejecuta el analisis por reglas para calcular riesgo deterministico." />
        <AnalysisCard title="Asistente IA" icon={<Bot className="h-5 w-5" />} data={ia} empty="Ejecuta el analisis con IA para obtener una lectura explicativa." />
      </div>

      {regla && ia ? (
        <Card className="animate-slide-up p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-slate-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold">Coincidencia de activos</h3>
              </div>
              <p className="text-sm text-slate-500">Comparacion entre los activos detectados por reglas y por IA.</p>
            </div>
            <p className="text-3xl font-bold text-sky-700">{((coincidencia ?? 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ListBlock title={`En comun (${comunes.length})`} values={comunes} />
            <ListBlock title={`Solo regla (${activosRegla.length - comunes.length})`} values={activosRegla.filter((id) => !activosIa.includes(id))} />
            <ListBlock title={`Solo IA (${activosIa.length - comunes.length})`} values={activosIa.filter((id) => !activosRegla.includes(id))} />
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
}: {
  title: string;
  icon: ReactNode;
  data: EvaluacionData | null;
  empty: string;
}) {
  return (
    <Card className="animate-pop p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">{icon}</div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
        </div>
        {data ? <RiesgoBadge nivel={data.nivel_riesgo || "bajo"} /> : <Badge>Sin analisis</Badge>}
      </div>

      {data ? (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Score" value={String(data.score_riesgo ?? "N/A")} />
            <Metric label="Activos" value={String(data.activos_afectados?.length ?? 0)} />
            <Metric label="Procesos" value={String(data.procesos_afectados?.length ?? 0)} />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Timer className="h-4 w-4" />
            {data.tiempo_analisis_ms} ms
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ListBlock({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Badge key={value} variant="sky">{value}</Badge>) : <span className="text-sm text-slate-400">Ninguno</span>}
      </div>
    </div>
  );
}
