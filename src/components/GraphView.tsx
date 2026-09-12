import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import type { Activo, ProcesoNegocio } from "../api/activos";

cytoscape.use(cola);

const COLORES_TIPO: Record<string, string> = {
  Servidor: "#3b82f6",
  Aplicacion: "#8b5cf6",
  BaseDeDatos: "#ef4444",
  API: "#10b981",
  Microservicio: "#f59e0b",
  ServicioCloud: "#06b6d4",
};

interface GraphViewProps {
  activos: Activo[];
  procesos: ProcesoNegocio[];
  dependencias: { origen: string; destino: string; peso: number }[];
  soporta: { activoId: string; procesoId: string }[];
  activosResaltados?: string[];
  caminoCritico?: string[];
  onNodeClick?: (activoId: string) => void;
}

export default function GraphView({
  activos,
  procesos,
  dependencias,
  soporta,
  activosResaltados = [],
  caminoCritico = [],
  onNodeClick,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = activos.map((a) => ({
      data: {
        id: a.id,
        label: a.nombre,
        tipo: a.tipo,
        criticidad: a.criticidad_base,
      },
    }));
    const procesoNodes = procesos.map((p) => ({
      data: {
        id: p.id,
        label: p.nombre,
        tipo: "Proceso",
        area: p.area,
      },
      classes: "proceso",
    }));
    const depEdges = dependencias.map((d) => ({
      data: { id: `dep-${d.origen}-${d.destino}`, source: d.origen, target: d.destino, peso: d.peso },
    }));
    const sopEdges = soporta.map((s) => ({
      data: { id: `sop-${s.activoId}-${s.procesoId}`, source: s.activoId, target: s.procesoId },
      classes: "soporta",
    }));

    const cy = cytoscape({
      container: containerRef.current,
      elements: { nodes: [...nodes, ...procesoNodes], edges: [...depEdges, ...sopEdges] },
      layout: { name: "cola", animate: false } as cytoscape.LayoutOptions,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 9,
            "text-wrap": "wrap",
            "text-max-width": 90 as unknown as string,
            color: "#111827",
            "background-color": (ele: cytoscape.NodeSingular) =>
              COLORES_TIPO[ele.data("tipo")] || "#9ca3af",
            width: (ele: cytoscape.NodeSingular) => 30 + ele.data("criticidad") * 8,
            height: (ele: cytoscape.NodeSingular) => 30 + ele.data("criticidad") * 8,
            "border-width": 2,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "node.proceso",
          style: {
            "background-color": "#f472b6",
            shape: "round-rectangle",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "curve-style": "bezier",
            "line-color": "#c7cbd1",
            "target-arrow-color": "#c7cbd1",
            "target-arrow-shape": "triangle",
          },
        },
        {
          selector: "edge.soporta",
          style: {
            "line-style": "dashed",
            "line-color": "#f472b6",
            "target-arrow-color": "#f472b6",
          },
        },
        {
          selector: "node.resaltado",
          style: {
            "border-color": "#dc2626",
            "border-width": 4,
          },
        },
        {
          selector: "edge.camino-critico",
          style: {
            width: 4,
            "line-color": "#dc2626",
            "target-arrow-color": "#dc2626",
          },
        },
        {
          selector: ".atenuado",
          style: {
            opacity: 0.25,
          },
        },
      ],
    });

    cyRef.current = cy;
    if (onNodeClick) {
      cy.on("tap", "node", (evt) => {
        const id = evt.target.id();
        if (activos.some((a) => a.id === id)) {
          onNodeClick(id);
        }
      });
    }

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [activos, procesos, dependencias, soporta, onNodeClick]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.elements().removeClass("resaltado camino-critico atenuado");
      const resaltados = new Set([...activosResaltados, ...caminoCritico]);
      if (resaltados.size > 0) {
        cy.elements().addClass("atenuado");
      }
      resaltados.forEach((id) => {
        const node = cy.getElementById(id);
        if (node && node.length > 0) {
          node.removeClass("atenuado").addClass("resaltado");
        }
      });
      for (let index = 0; index < caminoCritico.length - 1; index += 1) {
        const a = caminoCritico[index];
        const b = caminoCritico[index + 1];
        const edge = cy.getElementById(`dep-${a}-${b}`);
        const reverseEdge = cy.getElementById(`dep-${b}-${a}`);
        const selected = edge.length > 0 ? edge : reverseEdge;
        if (selected.length > 0) {
          selected.removeClass("atenuado").addClass("camino-critico");
        }
      }
    });
  }, [activosResaltados, caminoCritico]);

  return <div ref={containerRef} className="w-full h-full" />;
}
