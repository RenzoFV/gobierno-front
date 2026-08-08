import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import GraphView from "../components/GraphView";

const getGrafo = () => client.get("/activos/grafo").then((r) => r.data);

export default function GrafoPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["grafo"], queryFn: getGrafo });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Grafo de dependencias</h1>
      <p className="text-sm text-gray-500 mb-4">
        Nodos de colores por tipo de activo (rosado = proceso de negocio). Tamaño proporcional a la criticidad.
      </p>
      {isLoading && <p className="text-gray-400">Cargando grafo…</p>}
      {error && <p className="text-red-600">Error al cargar el grafo.</p>}
      {data && (
        <div className="bg-white border rounded-lg" style={{ height: "calc(100vh - 180px)" }}>
          <GraphView
            activos={data.activos}
            procesos={data.procesos}
            dependencias={data.dependencias}
            soporta={data.soporta}
          />
        </div>
      )}
    </div>
  );
}
