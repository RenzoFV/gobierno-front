import client from "./client";

export const consultarAsistente = (pregunta: string, activo_contexto_id?: string | null) =>
  client
    .post("/asistente", { pregunta, activo_contexto_id })
    .then((r) => r.data);
