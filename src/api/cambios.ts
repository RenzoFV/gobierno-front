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
  timestamp: string;
}

export const crearCambio = (data: { titulo: string; descripcion: string; activo_objetivo_id: string }) =>
  client.post<Cambio>("/cambios", data).then((r) => r.data);

export const getCambios = () =>
  client.get<Cambio[]>("/cambios").then((r) => r.data);

export const getCambio = (id: string) =>
  client.get(`/cambios/${id}`).then((r) => r.data);

export const analizarRegla = (id: string) =>
  client.post(`/cambios/${id}/analizar/regla`).then((r) => r.data);

export const analizarIA = (id: string, pregunta?: string) =>
  client.post(`/cambios/${id}/analizar/ia`, { pregunta }).then((r) => r.data);

export const getComparacion = (id: string) =>
  client.get(`/cambios/${id}/comparacion`).then((r) => r.data);
