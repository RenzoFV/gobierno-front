import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActivos,
  getProcesos,
  createActivo,
  deleteActivo,
  createProceso,
} from "../api/activos";
import { useAuth } from "../context/AuthContext";

const tipos = ["Servidor", "Aplicacion", "BaseDeDatos", "API", "Microservicio", "ServicioCloud"];

export default function InventarioPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const queryClient = useQueryClient();

  const { data: activos, isLoading } = useQuery({ queryKey: ["activos"], queryFn: getActivos });
  const { data: procesos } = useQuery({ queryKey: ["procesos"], queryFn: getProcesos });

  const [form, setForm] = useState({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
  const [procForm, setProcForm] = useState({ nombre: "", area: "", criticidad_negocio: 3 });

  const crearActivo = useMutation({
    mutationFn: createActivo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activos"] });
      setForm({ nombre: "", tipo: tipos[0], criticidad_base: 3, descripcion: "" });
    },
  });

  const borrarActivo = useMutation({
    mutationFn: deleteActivo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activos"] }),
  });

  const crearProceso = useMutation({
    mutationFn: createProceso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      setProcForm({ nombre: "", area: "", criticidad_negocio: 3 });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario de activos TI</h1>
        <p className="text-sm text-gray-500">Activos, procesos de negocio y criticidad</p>
      </div>

      {esAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Nuevo activo</h2>
            <div className="space-y-2">
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Nombre"
                value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <select className="w-full border rounded px-3 py-2 text-sm"
                value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input className="w-full border rounded px-3 py-2 text-sm" type="number" min={1} max={5}
                placeholder="Criticidad (1-5)" value={form.criticidad_base}
                onChange={(e) => setForm({ ...form, criticidad_base: Number(e.target.value) })} />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Descripción"
                value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              <button
                className="w-full bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50"
                onClick={() => crearActivo.mutate(form)}
                disabled={!form.nombre || crearActivo.isPending}
              >
                Crear activo
              </button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-semibold mb-3">Nuevo proceso de negocio</h2>
            <div className="space-y-2">
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Nombre"
                value={procForm.nombre} onChange={(e) => setProcForm({ ...procForm, nombre: e.target.value })} />
              <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Área"
                value={procForm.area} onChange={(e) => setProcForm({ ...procForm, area: e.target.value })} />
              <input className="w-full border rounded px-3 py-2 text-sm" type="number" min={1} max={5}
                placeholder="Criticidad (1-5)" value={procForm.criticidad_negocio}
                onChange={(e) => setProcForm({ ...procForm, criticidad_negocio: Number(e.target.value) })} />
              <button
                className="w-full bg-purple-600 text-white py-2 rounded text-sm disabled:opacity-50"
                onClick={() => crearProceso.mutate(procForm)}
                disabled={!procForm.nombre || !procForm.area || crearProceso.isPending}
              >
                Crear proceso
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Criticidad</th>
              <th className="px-4 py-2">Descripción</th>
              {esAdmin && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-4 text-gray-400">Cargando…</td></tr>
            )}
            {activos?.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-2 font-medium">{a.nombre}</td>
                <td className="px-4 py-2">{a.tipo}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{a.criticidad_base}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{a.descripcion}</td>
                {esAdmin && (
                  <td className="px-4 py-2">
                    <button
                      className="text-red-600 text-xs hover:underline"
                      onClick={() => borrarActivo.mutate(a.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <h2 className="px-4 py-3 font-semibold border-b">Procesos de negocio</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Área</th>
              <th className="px-4 py-2">Criticidad</th>
            </tr>
          </thead>
          <tbody>
            {procesos?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2 font-medium">{p.nombre}</td>
                <td className="px-4 py-2">{p.area}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{p.criticidad_negocio}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
