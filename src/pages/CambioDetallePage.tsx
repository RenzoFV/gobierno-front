import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Cpu, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { analizarIA, analizarRegla, getCambio, getComparacion } from "../api/cambios";
import ComparacionMetodos from "../components/ComparacionMetodos";
import LoadingState from "../components/LoadingState";
import RiesgoBadge from "../components/RiesgoBadge";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { formatDate, userMessage } from "../lib/utils";

export default function CambioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: cambio, isLoading } = useQuery({
    queryKey: ["cambio", id],
    queryFn: () => getCambio(id!),
    enabled: !!id,
  });
  const { data: comparacion } = useQuery({
    queryKey: ["comparacion", id],
    queryFn: () => getComparacion(id!),
    enabled: !!id,
  });

  const invalida = () => {
    queryClient.invalidateQueries({ queryKey: ["cambio", id] });
    queryClient.invalidateQueries({ queryKey: ["comparacion", id] });
    queryClient.invalidateQueries({ queryKey: ["historial"] });
    queryClient.invalidateQueries({ queryKey: ["resumen"] });
  };

  const regla = useMutation({
    mutationFn: () => analizarRegla(id!),
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
            <h2 className="text-2xl font-bold text-slate-950">{cambio?.titulo}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{cambio?.descripcion || "Sin descripcion registrada."}</p>
            <p className="mt-4 text-sm text-slate-500">Creado: {formatDate(cambio?.fecha_creacion)}</p>
          </div>

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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Comparacion de resultados</CardTitle>
          <Button variant="outline" size="sm" onClick={invalida}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          <ComparacionMetodos
            regla={comparacion?.regla ?? null}
            ia={comparacion?.ia ?? null}
            coincidencia={comparacion?.coincidencia_activos}
          />
        </CardContent>
      </Card>
    </div>
  );
}
