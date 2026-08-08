import client from "./client";

export const getResumen = () =>
  client.get("/dashboard/resumen").then((r) => r.data);

export const getHistorial = () =>
  client.get("/dashboard/historial").then((r) => r.data);
