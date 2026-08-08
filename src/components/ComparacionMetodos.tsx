import RiesgoBadge from "./RiesgoBadge";

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Motor de reglas</h3>
            {regla ? <RiesgoBadge nivel={regla.nivel_riesgo} /> : <span className="text-xs text-gray-400">Sin análisis</span>}
          </div>
          {regla ? (
            <div className="text-sm space-y-2">
              <p>Score: <strong>{regla.score_riesgo}</strong></p>
              <p>Tiempo: {regla.tiempo_analisis_ms} ms</p>
              <p>Activos afectados: {regla.activos_afectados.length}</p>
              <p>Procesos afectados: {regla.procesos_afectados.length}</p>
              <div>
                <p className="font-medium mb-1">Recomendaciones:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {regla.recomendaciones.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Usa "Analizar con regla" para generar.</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Asistente IA</h3>
            {ia ? <RiesgoBadge nivel={ia.nivel_riesgo || "bajo"} /> : <span className="text-xs text-gray-400">Sin análisis</span>}
          </div>
          {ia ? (
            <div className="text-sm space-y-2">
              <p>Tiempo: {ia.tiempo_analisis_ms} ms</p>
              <p>Activos tocados: {ia.activos_afectados.length}</p>
              {ia.respuesta_texto && (
                <div className="bg-gray-50 border rounded p-2 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {ia.respuesta_texto}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Usa "Analizar con IA" para generar.</p>
          )}
        </div>
      </div>

      {regla && ia && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">
            Coincidencia de activos: <span className="text-blue-600">{((coincidencia ?? 0) * 100).toFixed(1)}%</span>
          </h3>
          <div className="text-sm space-y-1">
            <p>En común ({comunes.length}): {comunes.length ? comunes.join(", ") : "ninguno"}</p>
            <p className="text-gray-500">
              Solo regla ({activosRegla.length - comunes.length}):{" "}
              {activosRegla.filter((id) => !activosIa.includes(id)).join(", ") || "—"}
            </p>
            <p className="text-gray-500">
              Solo IA ({activosIa.length - comunes.length}):{" "}
              {activosIa.filter((id) => !activosRegla.includes(id)).join(", ") || "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
