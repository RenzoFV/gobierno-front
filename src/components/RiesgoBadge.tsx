import { Badge } from "./ui/badge";

const styles: Record<string, string> = {
  bajo: "bg-emerald-100 text-emerald-700",
  medio: "bg-amber-100 text-amber-800",
  alto: "bg-destructive/10 text-destructive",
  pendiente: "bg-muted text-muted-foreground",
  analizado: "bg-accent text-accent-foreground",
};

export default function RiesgoBadge({ nivel }: { nivel: string | null }) {
  const cls = (nivel && styles[nivel]) || "bg-muted text-muted-foreground";
  return (
    <Badge className={`uppercase ${cls}`}>
      {nivel || "N/A"}
    </Badge>
  );
}
