import type { ReactNode } from "react";

export function Tooltip({ label, children, side = "top" }: { label: string; children: ReactNode; side?: "top" | "bottom" }) {
  const position = side === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span className={`pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md ring-1 ring-border group-hover:block ${position}`}>
        {label}
      </span>
    </span>
  );
}
