import client from "./client";

export interface Activo {
  id: string;
  nombre: string;
  tipo: string;
  criticidad_base: number;
  criticidad_efectiva?: number;
  criticidad_origen?: string;
  descripcion: string;
}

export interface ActivoDetalle extends Activo {
  dependencias: { id: string; nombre: string; peso: number }[];
  procesos_soportados: { id: string; nombre: string; criticidad_negocio: number }[];
  criticidad_financiera?: number | null;
  criticidad_operativa?: number | null;
  criticidad_cumplimiento?: number | null;
  criticidad_reputacion_clientes?: number | null;
  criticidad_rto?: string | null;
  criticidad_minima_rto?: number | null;
  criticidad_heredada?: number;
  criticidad_contribuciones?: CriticidadContribucion[];
  criticidad_justificacion?: string | null;
  criticidad_revisado_por?: string | null;
  criticidad_fecha_revision?: string | null;
}

export interface CriticidadContribucion {
  tipo: "proceso" | "dependiente";
  id: string;
  nombre: string;
  criticidad: number;
  aporte: number;
  peso_camino?: number;
  distancia?: number;
  camino?: string[];
}

export interface CriticidadCalculoRequest {
  impacto_financiero: number;
  impacto_operativo: number;
  impacto_cumplimiento: number;
  impacto_reputacion_clientes?: number | null;
  rto_objetivo: "<=1h" | "<=4h" | "<=24h" | ">24h";
  ajuste_manual?: number | null;
  justificacion_ajuste?: string;
}

export interface CriticidadCalculoResponse {
  activo_id: string;
  impacto_base: number;
  criticidad_minima_rto: number;
  criticidad_base: number;
  criticidad_heredada: number;
  criticidad_calculada: number;
  criticidad_efectiva: number;
  criticidad_origen: string;
  contribuciones: CriticidadContribucion[];
  fecha_revision: string;
  revisado_por: string;
}

export interface ProcesoNegocio {
  id: string;
  nombre: string;
  area: string;
  criticidad_negocio: number;
}

export const getActivos = () =>
  client.get<Activo[]>("/activos").then((r) => r.data);

export const getActivo = (id: string) =>
  client.get<ActivoDetalle>(`/activos/${id}`).then((r) => r.data);

export const createActivo = (data: Omit<Activo, "id">) =>
  client.post<Activo>("/activos", data).then((r) => r.data);

export const updateActivo = (id: string, data: Partial<Activo>) =>
  client.put<Activo>(`/activos/${id}`, data).then((r) => r.data);

export const calcularCriticidad = (id: string, data: CriticidadCalculoRequest) =>
  client.post<CriticidadCalculoResponse>(`/activos/${id}/criticidad/calcular`, data).then((r) => r.data);

export const deleteActivo = (id: string) =>
  client.delete(`/activos/${id}`).then((r) => r.data);

export const addDependencia = (id: string, depende_de_id: string, peso: number) =>
  client.post(`/activos/${id}/dependencias`, { depende_de_id, peso }).then((r) => r.data);

export const removeDependencia = (id: string, dependenciaId: string) =>
  client.delete(`/activos/${id}/dependencias/${dependenciaId}`);

export const getProcesos = () =>
  client.get<ProcesoNegocio[]>("/procesos").then((r) => r.data);

export const createProceso = (data: Omit<ProcesoNegocio, "id">) =>
  client.post<ProcesoNegocio>("/procesos", data).then((r) => r.data);

export const asociarProceso = (activoId: string, procesoId: string) =>
  client.post(`/procesos/activos/${activoId}/procesos`, { proceso_id: procesoId }).then((r) => r.data);
