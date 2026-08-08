import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getCambio, analizarRegla, analizarIA, getComparacion } from "../api/cambios";
import ComparacionMetodos from "../components/ComparacionMetodos";
import RiesgoBadge from "../components/RiesgoBadge";

export default function CambioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: cambio, isLoading } = useQuery({
    queryKey: ["cambio", id],
    queryFn: () => getCambio(id!),
  });
  const { data: comparacion } = useQuery({
    queryKey: ["comparacion", id],
    queryFn: () => getComparacion(id!),
    enabled: !!id,
  });

  const invalida = () => {
    queryClient.invalidateQueries({ queryKey: ["cambio", id] });
    queryClient.invalidateQueries({ queryKey: ["comparacion", id] });
  };

  const regla = useMutation({
    mutationFn: () => analizarRegla(id!),
    onSuccess: invalida,
  });
  const ia = useMutation({
    mutationFn: () => analizarIA(id!),
    onSuccess: invalida,
  });

  if (isLoading) return <div className="p-6 text-gray-400">Cargando…</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{cambio?.titulo}</h1>
        <p className="text-sm text-gray-500">
          Activo objetivo: <strong>{cambio?.activo_nombre || cambio?.activo_objetivo_id}</strong>
        </p>
        <p className="text-sm text-gray-500">
          Estado: <RiesgoBadge nivel={cambio?.estado} /> · Creado: {cambio?.fecha_creacion}
        </p>
        {cambio?.descripcion && <p className="text-sm mt-2">{cambio.descripcion}</p>}
      </div>

      <div className="flex gap-3">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
          onClick={() => regla.mutate()}
          disabled={regla.isPending}
        >
          {regla.isPending ? "Analizando…" : "Analizar con regla"}
        </button>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
          onClick={() => ia.mutate()}
          disabled={ia.isPending}
        >
          {ia.isPending ? "Analizando…" : "Analizar con IA"}
        </button>
      </div>

      {regla.isError && <p className="text-red-600 text-sm">Error al analizar con regla.</p>}
      {ia.isError && (
        <p className="text-red-600 text-sm">
          Error al analizar con IA. Verifica que la OPENAI_API_KEY esté configurada.
        </p>
      )}

      <ComparacionMetodos
        regla={comparacion?.regla ?? null}
        ia={comparacion?.ia ?? null}
        coincidencia={comparacion?.coincidencia_activos}
      />
    </div>
  );
}
