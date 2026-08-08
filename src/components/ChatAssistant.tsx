import { useState } from "react";
import { consultarAsistente } from "../api/asistente";

interface Mensaje {
  rol: "user" | "assistant";
  texto: string;
}

interface ChatAssistantProps {
  activoContextoId?: string | null;
  height?: string;
}

export default function ChatAssistant({ activoContextoId = null, height = "h-96" }: ChatAssistantProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;
    setMensajes((m) => [...m, { rol: "user", texto: pregunta }]);
    setInput("");
    setCargando(true);
    try {
      const res = await consultarAsistente(pregunta, activoContextoId);
      setMensajes((m) => [...m, { rol: "assistant", texto: res.respuesta_texto }]);
    } catch {
      setMensajes((m) => [
        ...m,
        { rol: "assistant", texto: "Error al consultar el asistente. Verifica que la OPENAI_API_KEY esté configurada." },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white overflow-hidden">
      <div className={`${height} overflow-y-auto p-4 space-y-3 bg-gray-50`}>
        {mensajes.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-4">
            Pregunta sobre el impacto de un cambio, p. ej. "¿qué pasa si actualizo srv-db-01?"
          </p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                m.rol === "user" ? "bg-blue-600 text-white" : "bg-white border text-gray-800"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {cargando && <p className="text-xs text-gray-400">Analizando…</p>}
      </div>
      <div className="flex border-t">
        <input
          className="flex-1 px-3 py-2 text-sm outline-none"
          placeholder="Escribe tu pregunta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <button
          className="px-4 bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
          onClick={enviar}
          disabled={cargando}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
