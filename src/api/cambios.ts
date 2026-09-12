import client from "./client";

export interface Cambio {
  id: string;
  titulo: string;
  descripcion: string;
  activo_objetivo_id: string;
  activo_nombre?: string;
  fecha_creacion: string;
  estado: string;
  creado_por: string;
  creado_por_nombre?: string;
  creado_por_email?: string;
}

export interface Evaluacion {
  id: string;
  metodo: string;
  nivel_riesgo: string;
  score_riesgo: number;
  activos_afectados: string[];
  procesos_afectados: string[];
  recomendaciones: string[];
  tiempo_analisis_ms: number;
  respuesta_texto: string;
  detalle_activos?: DetalleActivoEvaluacion[];
  parametros_usados?: ParametrosRegla;
  version_motor?: string;
  mejor_activo?: string | null;
  camino_critico?: string[];
  timestamp: string;
}

export interface ParametrosRegla {
  profundidad_max: number;
  atenuacion: number;
  coef_proceso: number;
  umbral_medio: number;
  umbral_alto: number;
}

export interface DetalleActivoEvaluacion {
  activo_id: string;
  nombre: string;
  camino_ids: string[];
  camino_nombres: string[];
  distancia: number;
  peso_camino: number;
  factor_atenuacion: number;
  score_base: number;
  aporte_procesos: number;
  procesos_soportados: { id: string; nombre: string; criticidad: number }[];
  score: number;
  score_total_activo: number;
}

export const crearCambio = (data: { titulo: string; descripcion: string; activo_objetivo_id: string }) =>
  client.post<Cambio>("/cambios", data).then((r) => r.data);

export const getCambios = (params?: { solicitanteId?: string }) =>
  client
    .get<Cambio[]>("/cambios", {
      params: params?.solicitanteId ? { solicitante_id: params.solicitanteId } : undefined,
    })
    .then((r) => r.data);

export const getCambio = (id: string) =>
  client.get(`/cambios/${id}`).then((r) => r.data);

export const analizarRegla = (id: string, params?: ParametrosRegla) =>
  client.post(`/cambios/${id}/analizar/regla`, params ?? {}).then((r) => r.data);

export const analizarIA = (id: string, pregunta?: string) =>
  client.post(`/cambios/${id}/analizar/ia`, { pregunta }).then((r) => r.data);

export const getComparacion = (id: string) =>
  client.get(`/cambios/${id}/comparacion`).then((r) => r.data);
