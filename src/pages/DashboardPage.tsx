import { useQuery } from "@tanstack/react-query";
import { getResumen, getHistorial } from "../api/dashboard";
import RiesgoBadge from "../components/RiesgoBadge";
import ChatAssistant from "../components/ChatAssistant";

interface Resumen {
  total_cambios: number;
  cambios_alto_riesgo: number;
  activos_mas_criticos: { id: string; nombre: string; veces: number }[];
  areas_mas_impactadas: { area: string; cantidad: number }[];
}

interface HistorialItem {
  cambio_id: string;
  titulo: string;
  fecha: string;
  estado: string;
  nivel_riesgo_regla: string | null;
  nivel_riesgo_ia: string | null;
}

export default function DashboardPage() {
  const { data: resumen, isLoading } = useQuery<Resumen>({ queryKey: ["resumen"], queryFn: getResumen });
  const { data: historial } = useQuery<HistorialItem[]>({ queryKey: ["historial"], queryFn: getHistorial });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {isLoading ? (
        <p className="text-gray-400">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-3xl font-bold text-blue-700">{resumen?.total_cambios}</p>
            <p className="text-sm text-gray-500">Total de solicitudes de cambio</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-3xl font-bold text-red-700">{resumen?.cambios_alto_riesgo}</p>
            <p className="text-sm text-gray-500">Cambios de alto riesgo (regla)</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Activos más críticos</h3>
            <ul className="text-sm space-y-1">
              {(resumen?.activos_mas_criticos ?? []).map((a) => (
                <li key={a.id}>{a.nombre} — <strong>{a.veces}</strong> vez/veces</li>
              ))}
              {resumen?.activos_mas_criticos?.length === 0 && <li className="text-gray-400">Sin datos</li>}
            </ul>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Áreas más impactadas</h3>
            <ul className="text-sm space-y-1">
              {(resumen?.areas_mas_impactadas ?? []).map((a) => (
                <li key={a.area}>{a.area} — <strong>{a.cantidad}</strong> cambio(s)</li>
              ))}
              {resumen?.areas_mas_impactadas?.length === 0 && <li className="text-gray-400">Sin datos</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded-lg overflow-hidden">
          <h2 className="px-4 py-3 font-semibold border-b">Historial de análisis</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Título</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Riesgo regla</th>
                <th className="px-4 py-2">Riesgo IA</th>
              </tr>
            </thead>
            <tbody>
              {historial?.map((h) => (
                <tr key={h.cambio_id} className="border-t">
                  <td className="px-4 py-2 font-medium">{h.titulo}</td>
                  <td className="px-4 py-2 text-gray-500">{new Date(h.fecha).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{h.estado}</td>
                  <td className="px-4 py-2"><RiesgoBadge nivel={h.nivel_riesgo_regla} /></td>
                  <td className="px-4 py-2"><RiesgoBadge nivel={h.nivel_riesgo_ia} /></td>
                </tr>
              ))}
              {historial?.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-gray-400">Sin cambios aún</td></tr>}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Asistente de análisis</h2>
          <ChatAssistant height="h-[420px]" />
        </div>
      </div>
    </div>
  );
}
