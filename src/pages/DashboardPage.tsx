import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import { getHistorial, getResumen } from "../api/dashboard";
import RiesgoBadge from "../components/RiesgoBadge";
import LoadingState from "../components/LoadingState";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import TablePagination from "../components/TablePagination";
import { formatDate } from "../lib/utils";

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

const PAGE_SIZE = 8;

export default function DashboardPage() {
  const { data: resumen, isLoading } = useQuery<Resumen>({ queryKey: ["resumen"], queryFn: getResumen });
  const { data: historial, isLoading: cargandoHistorial } = useQuery<HistorialItem[]>({ queryKey: ["historial"], queryFn: getHistorial });
  const [historialPage, setHistorialPage] = useState(1);

  useEffect(() => {
    setHistorialPage(1);
  }, [historial?.length]);

  const totalHistorialPages = Math.max(1, Math.ceil((historial?.length ?? 0) / PAGE_SIZE));
  const currentHistorialPage = Math.min(historialPage, totalHistorialPages);
  const historialPaginado = useMemo(
    () => (historial ?? []).slice((currentHistorialPage - 1) * PAGE_SIZE, currentHistorialPage * PAGE_SIZE),
    [currentHistorialPage, historial],
  );

  const stats = [
    {
      label: "Solicitudes",
      value: resumen?.total_cambios ?? 0,
      icon: Activity,
      color: "bg-sky-100 text-sky-700",
      hint: "cambios registrados",
    },
    {
      label: "Alto riesgo",
      value: resumen?.cambios_alto_riesgo ?? 0,
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700",
      hint: "por motor de reglas",
    },
    {
      label: "Activos criticos",
      value: resumen?.activos_mas_criticos?.length ?? 0,
      icon: Layers,
      color: "bg-violet-100 text-violet-700",
      hint: "con impacto repetido",
    },
    {
      label: "Areas impactadas",
      value: resumen?.areas_mas_impactadas?.length ?? 0,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
      hint: "en historial",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState label="Cargando dashboard..." className="min-h-[220px]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="animate-pop" style={{ animationDelay: `${index * 45}ms` }}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Activos mas criticos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(resumen?.activos_mas_criticos ?? []).length > 0 ? (
              resumen?.activos_mas_criticos.map((activo, index) => (
                <div key={activo.id} className="flex animate-slide-up items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3" style={{ animationDelay: `${index * 45}ms` }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sm font-bold text-sky-700">{index + 1}</span>
                    <p className="truncate font-semibold text-slate-800">{activo.nombre}</p>
                  </div>
                  <Badge variant="sky">{activo.veces} impacto(s)</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="Sin activos criticos" description="Aun no hay evaluaciones que acumulen impacto en activos." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas mas impactadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(resumen?.areas_mas_impactadas ?? []).length > 0 ? (
              resumen?.areas_mas_impactadas.map((area, index) => (
                <div key={area.area} className="flex animate-slide-up items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3" style={{ animationDelay: `${index * 45}ms` }}>
                  <p className="truncate font-semibold text-slate-800">{area.area}</p>
                  <Badge variant="emerald">{area.cantidad} cambio(s)</Badge>
                </div>
              ))
            ) : (
              <EmptyState title="Sin areas impactadas" description="Cuando se analicen cambios, apareceran aqui las areas con mayor exposicion." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de analisis</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                <th className="table-cell">Titulo</th>
                <th className="table-cell">Fecha</th>
                <th className="table-cell">Estado</th>
                <th className="table-cell">Riesgo regla</th>
                <th className="table-cell">Riesgo IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargandoHistorial && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Cargando historial...</td>
                </tr>
              )}
              {historialPaginado.map((item) => (
                <tr key={item.cambio_id} className="animate-fade bg-white">
                  <td className="table-cell font-semibold text-slate-800">{item.titulo}</td>
                  <td className="table-cell text-slate-500">{formatDate(item.fecha)}</td>
                  <td className="table-cell"><Badge>{item.estado}</Badge></td>
                  <td className="table-cell"><RiesgoBadge nivel={item.nivel_riesgo_regla} /></td>
                  <td className="table-cell"><RiesgoBadge nivel={item.nivel_riesgo_ia} /></td>
                </tr>
              ))}
              {historial?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10">
                    <EmptyState title="Sin cambios aun" description="Registra una solicitud y ejecuta un analisis para ver actividad." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!cargandoHistorial && (historial?.length ?? 0) > 0 && (
          <TablePagination
            page={currentHistorialPage}
            pageSize={PAGE_SIZE}
            totalItems={historial?.length ?? 0}
            itemLabel="analisis"
            onPageChange={setHistorialPage}
          />
        )}
      </Card>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
