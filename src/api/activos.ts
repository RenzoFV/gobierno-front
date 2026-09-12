import client from "./client";

export interface Activo {
  id: string;
  nombre: string;
  tipo: string;
  criticidad_base: number;
  descripcion: string;
}

export interface ActivoDetalle extends Activo {
  dependencias: { id: string; nombre: string; peso: number }[];
  procesos_soportados: { id: string; nombre: string; criticidad_negocio: number }[];
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
