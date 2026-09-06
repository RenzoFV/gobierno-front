import type { ReactNode } from "react";

export function Tooltip({ label, children, side = "top" }: { label: string; children: ReactNode; side?: "top" | "bottom" }) {
  const position = side === "bottom" ? "top-full mt-2" : "bottom-full mb-2";

  return (
    <span className="group relative inline-flex">
      {children}
      <span className={`pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-xs text-white shadow-lg group-hover:block ${position}`}>
        {label}
      </span>
    </span>
  );
}
