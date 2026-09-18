import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import GraphView from "../components/GraphView";
import LoadingState from "../components/LoadingState";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

const getGrafo = () => client.get("/activos/grafo").then((r) => r.data);

const legend = [
  ["Servidor", "#38bdf8"],
  ["Aplicacion", "#8b5cf6"],
  ["Base de datos", "#ef4444"],
  ["API", "#10b981"],
  ["Microservicio", "#f59e0b"],
  ["Cloud", "#06b6d4"],
  ["Proceso", "#f472b6"],
];

export default function GrafoPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["grafo"], queryFn: getGrafo });
  const empty = data && (data.activos?.length ?? 0) === 0 && (data.procesos?.length ?? 0) === 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {legend.map(([label, color]) => (
              <div key={label} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">El tamano del nodo representa criticidad. Las lineas punteadas conectan componentes TI con procesos.</p>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-4">
          <LoadingState label="Construyendo grafo..." className="min-h-[220px]" />
          <Skeleton className="h-[calc(100vh-360px)] min-h-[360px]" />
        </div>
      )}
      {error && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">No se pudo cargar el grafo de dependencias.</CardContent>
        </Card>
      )}
      {empty && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">Aun no hay componentes TI o procesos para visualizar.</CardContent>
        </Card>
      )}
      {data && !empty && (
        <div className="h-[calc(100vh-220px)] min-h-[520px] overflow-hidden rounded-lg border bg-card shadow-sm">
          <GraphView activos={data.activos} procesos={data.procesos} dependencias={data.dependencias} soporta={data.soporta} />
        </div>
      )}
    </div>
  );
}
