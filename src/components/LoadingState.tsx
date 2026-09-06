import { Bot } from "lucide-react";
import { cn } from "../lib/utils";

export default function LoadingState({
  label = "Cargando informacion...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[360px] animate-page items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card px-8 py-7 text-center text-card-foreground shadow-sm">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <span className="absolute inset-0 rounded-lg bg-primary/20 animate-ping" />
          <Bot className="relative h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">Preparando la vista.</p>
        </div>
      </div>
    </div>
  );
}
