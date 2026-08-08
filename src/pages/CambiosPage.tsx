import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCambios, crearCambio } from "../api/cambios";
import { getActivos } from "../api/activos";
import RiesgoBadge from "../components/RiesgoBadge";

export default function CambiosPage() {
  const queryClient = useQueryClient();
  const { data: cambios, isLoading } = useQuery({ queryKey: ["cambios"], queryFn: getCambios });
  const { data: activos } = useQuery({ queryKey: ["activos"], queryFn: getActivos });

  const [form, setForm] = useState({ titulo: "", descripcion: "", activo_objetivo_id: "" });

  const crear = useMutation({
    mutationFn: crearCambio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cambios"] });
      setForm({ titulo: "", descripcion: "", activo_objetivo_id: "" });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Solicitudes de cambio</h1>

      <div className="bg-white border rounded-lg p-4 max-w-xl">
        <h2 className="font-semibold mb-3">Nueva solicitud</h2>
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Título"
            value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <textarea className="w-full border rounded px-3 py-2 text-sm" placeholder="Descripción"
            rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <select className="w-full border rounded px-3 py-2 text-sm"
            value={form.activo_objetivo_id}
            onChange={(e) => setForm({ ...form, activo_objetivo_id: e.target.value })}>
            <option value="">Selecciona el activo objetivo…</option>
            {activos?.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} ({a.id})</option>
            ))}
          </select>
          <button
            className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50"
            disabled={!form.titulo || !form.activo_objetivo_id || crear.isPending}
            onClick={() => crear.mutate(form)}
          >
            Crear solicitud
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Activo objetivo</th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-4 text-gray-400">Cargando…</td></tr>}
            {cambios?.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.titulo}</td>
                <td className="px-4 py-2">{c.activo_nombre || c.activo_objetivo_id}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(c.fecha_creacion).toLocaleString()}</td>
                <td className="px-4 py-2"><RiesgoBadge nivel={c.estado} /></td>
                <td className="px-4 py-2">
                  <Link to={`/cambios/${c.id}`} className="text-blue-600 text-xs hover:underline">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
