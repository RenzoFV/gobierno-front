# Change Impact Analyzer - Frontend

Interfaz web para gestionar activos TI, solicitudes de cambio, grafo de dependencias, dashboard y asistente de analisis.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- Cytoscape

## Instalacion

```bash
npm install
```

## Iniciar el proyecto

```bash
npm run dev
```

La app se ejecuta normalmente en:

```txt
http://localhost:5173
```

## Comandos utiles

```bash
npm run lint
npm run build
npm run preview
```

## Estructura

```txt
src/
  api/                 Peticiones al backend
  components/          Componentes reutilizables
  components/ui/       Componentes base de interfaz
  context/             Contextos globales
  lib/                 Utilidades
  pages/               Paginas principales
```

## Paginas principales

- Login
- Dashboard
- Inventario
- Grafo de dependencias
- Solicitudes de cambio
- Detalle de cambio
