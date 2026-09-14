import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bot, Eraser, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { consultarAsistente } from "../api/asistente";
import { cn, userMessage } from "../lib/utils";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Textarea } from "./ui/form";

interface Mensaje {
  rol: "user" | "assistant";
  texto: string;
}

interface FloatingAssistantProps {
  placement?: "floating" | "nav" | "inline";
  activoContextoId?: string | null;
  contextPrompt?: string;
  initialMessage?: string;
  panelTitle?: string;
  panelSubtitle?: string;
}

export default function FloatingAssistant({
  placement = "floating",
  activoContextoId = null,
  contextPrompt,
  initialMessage,
  panelTitle = "Asistente de analisis",
  panelSubtitle = "Impacto, riesgos y recomendaciones",
}: FloatingAssistantProps) {
  const initialMessages = useMemo<Mensaje[]>(
    () => (initialMessage ? [{ rol: "assistant", texto: initialMessage }] : []),
    [initialMessage],
  );
  const [open, setOpen] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>(initialMessages);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setMensajes(initialMessages);
  }, [initialMessages]);

  const enviar = async () => {
    const pregunta = input.trim();
    if (!pregunta || cargando) return;
    setMensajes((current) => [...current, { rol: "user", texto: pregunta }]);
    setInput("");
    setCargando(true);
    try {
      const preguntaConContexto = contextPrompt
        ? `${contextPrompt}\n\nPregunta del usuario: ${pregunta}`
        : pregunta;
      const res = await consultarAsistente(preguntaConContexto, activoContextoId);
      setMensajes((current) => [...current, { rol: "assistant", texto: res.respuesta_texto }]);
    } catch (error) {
      const mensaje = userMessage(
        error,
        "Error al consultar el asistente. Verifica que la API Key (GEMINI_API_KEY o OPENAI_API_KEY) esté configurada correctamente en el backend.",
      );
      setMensajes((current) => [...current, { rol: "assistant", texto: mensaje }]);
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  };

  const limpiar = () => {
    setMensajes(initialMessages);
    toast.success("Conversacion del asistente limpiada.");
  };

  const isNav = placement === "nav";
  const isInline = placement === "inline";

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant={isNav ? "outline" : "primary"}
          className={cn(
            "rounded-full transition duration-200",
            isNav
              ? "h-10 w-10 bg-card text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
              : isInline
                ? "h-9 w-9"
                : "fixed bottom-5 right-5 z-40 h-14 w-14 shadow-xl shadow-primary/20 hover:-translate-y-0.5 max-sm:h-12 max-sm:w-12",
          )}
          aria-label="Asistente"
          title="Asistente"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DrawerTitle className="truncate">{panelTitle}</DrawerTitle>
              <DrawerDescription className="truncate">{panelSubtitle}</DrawerDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="mr-8 h-8 w-8" onClick={limpiar} aria-label="Limpiar conversacion">
            <Eraser className="h-4 w-4" />
          </Button>
        </DrawerHeader>

        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/50 p-4">
          {mensajes.length === 0 && (
            <div className="rounded-lg border border-dashed bg-white p-4 text-center text-sm text-muted-foreground">
              Pregunta por impactos, activos afectados o recomendaciones para un cambio.
            </div>
          )}
          {mensajes.map((mensaje, index) => (
            <div key={index} className={cn("flex animate-pop", mensaje.rol === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[88%] rounded-lg px-3 py-2 text-sm leading-6",
                  mensaje.rol === "user" ? "bg-primary text-primary-foreground" : "border bg-white text-foreground",
                )}
              >
                {mensaje.rol === "assistant" ? <FormattedChatText text={mensaje.texto} /> : <p className="whitespace-pre-wrap">{mensaje.texto}</p>}
              </div>
            </div>
          ))}
          {cargando && <p className="text-xs font-medium text-muted-foreground">Analizando...</p>}
        </div>

        <div className="border-t bg-background p-3">
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
      </DrawerContent>
    </Drawer>
  );
}

function FormattedChatText({ text }: { text: string }) {
  const elements: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    const items = listItems;
    listItems = [];
    elements.push(
      <ul key={`list-${elements.length}`} className="my-2 list-disc space-y-1 pl-4">
        {items.map((item, index) => (
          <li key={index}>{renderInlineText(item)}</li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (bullet || numbered) {
      listItems.push((bullet?.[1] ?? numbered?.[1] ?? "").trim());
      continue;
    }

    flushList();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      elements.push(
        <p key={`heading-${elements.length}`} className="mb-1 mt-2 font-semibold text-foreground">
          {renderInlineText(heading[2])}
        </p>,
      );
      continue;
    }

    elements.push(
      <p key={`paragraph-${elements.length}`} className="my-1">
        {renderInlineText(line)}
      </p>,
    );
  }

  flushList();
  return <div>{elements}</div>;
}

function renderInlineText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
