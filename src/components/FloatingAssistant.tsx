import { useState } from "react";
import { Bot, Eraser, MessageCircle, Minus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { consultarAsistente } from "../api/asistente";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/form";

interface Mensaje {
  rol: "user" | "assistant";
  texto: string;
}

interface FloatingAssistantProps {
  placement?: "floating" | "nav";
}

export default function FloatingAssistant({ placement = "floating" }: FloatingAssistantProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);

  const enviar = async () => {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;
    setMensajes((current) => [...current, { rol: "user", texto: pregunta }]);
    setInput("");
    setCargando(true);
    try {
      const res = await consultarAsistente(pregunta);
      setMensajes((current) => [...current, { rol: "assistant", texto: res.respuesta_texto }]);
    } catch {
      const mensaje = "Error al consultar el asistente. Verifica que la OPENAI_API_KEY este configurada.";
      setMensajes((current) => [...current, { rol: "assistant", texto: mensaje }]);
      toast.error("No se pudo consultar el asistente.");
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setMensajes([]);
    toast.success("Conversacion del asistente limpiada.");
  };

  const isNav = placement === "nav";

  return (
    <div className={cn(isNav ? "inline-flex" : "fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3")}>
      {open && !minimized && (
        <section
          className={cn(
            "flex h-[min(620px,calc(100vh-7rem))] w-[calc(100vw-2.5rem)] max-w-md animate-slide-up flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl",
            isNav && "fixed right-4 top-20 z-50",
          )}
        >
          <header className="flex items-center justify-between border-b border-slate-100 bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-400 text-slate-950">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">Asistente de analisis</h2>
                <p className="truncate text-xs text-slate-300">Impacto, riesgos y recomendaciones</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:bg-white/10 hover:text-white" onClick={limpiar} aria-label="Limpiar conversacion">
                <Eraser className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:bg-white/10 hover:text-white" onClick={() => setMinimized(true)} aria-label="Minimizar">
                <Minus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {mensajes.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                Pregunta por impactos, activos afectados o recomendaciones para un cambio.
              </div>
            )}
            {mensajes.map((mensaje, index) => (
              <div key={index} className={cn("flex animate-pop", mensaje.rol === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 shadow-sm",
                    mensaje.rol === "user" ? "bg-sky-600 text-white" : "border border-slate-200 bg-white text-slate-700",
                  )}
                >
                  <p className="whitespace-pre-wrap">{mensaje.texto}</p>
                </div>
              </div>
            ))}
            {cargando && <p className="text-xs font-medium text-slate-400">Analizando...</p>}
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                className="min-h-11 resize-none"
                rows={1}
                placeholder="Escribe tu pregunta..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    enviar();
                  }
                }}
              />
              <Button size="icon" disabled={!input.trim() || cargando} onClick={enviar} aria-label="Enviar">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      <Button
        size="icon"
        variant={isNav ? "outline" : "primary"}
        className={cn(
          "rounded-full transition duration-200",
          isNav
            ? "h-10 w-10 border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-sky-50 hover:text-sky-700"
            : "h-14 w-14 shadow-xl shadow-sky-200 hover:-translate-y-0.5 max-sm:h-12 max-sm:w-12",
        )}
        onClick={() => {
          setOpen(true);
          setMinimized(false);
        }}
        aria-label="Asistente"
        title="Asistente"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
