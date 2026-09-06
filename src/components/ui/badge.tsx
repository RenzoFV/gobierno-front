import * as React from "react";
import { cn } from "../../lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background text-foreground",
  slate: "bg-muted text-muted-foreground",
  sky: "bg-accent text-accent-foreground",
  emerald: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-destructive/10 text-destructive",
};

export function Badge({
  className,
  variant = "slate",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", variants[variant], className)}
      {...props}
    />
  );
}
