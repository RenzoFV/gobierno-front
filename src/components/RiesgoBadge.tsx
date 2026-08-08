const styles: Record<string, string> = {
  bajo: "bg-green-100 text-green-700",
  medio: "bg-yellow-100 text-yellow-700",
  alto: "bg-red-100 text-red-700",
};

export default function RiesgoBadge({ nivel }: { nivel: string | null }) {
  const cls = (nivel && styles[nivel]) || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${cls}`}>
      {nivel || "N/A"}
    </span>
  );
}
