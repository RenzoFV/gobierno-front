import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "rounded-lg border bg-background text-foreground shadow-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
