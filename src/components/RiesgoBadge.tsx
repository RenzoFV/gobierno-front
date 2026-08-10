const styles: Record<string, string> = {
  bajo: "bg-emerald-100 text-emerald-700",
  medio: "bg-amber-100 text-amber-800",
  alto: "bg-red-100 text-red-700",
  pendiente: "bg-slate-100 text-slate-700",
  analizado: "bg-sky-100 text-sky-700",
};

export default function RiesgoBadge({ nivel }: { nivel: string | null }) {
  const cls = (nivel && styles[nivel]) || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${cls}`}>
      {nivel || "N/A"}
    </span>
  );
}
