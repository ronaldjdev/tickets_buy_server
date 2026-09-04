# tickets_buy_server

Servidor backend para la venta de tickets de sorteos (raffles). Construido con arquitectura **hexagonal + features (vertical slices)** y DDD pragmático.

## Stack

- **Node.js** + **TypeScript** 5.7 (ESM, strict)
- **Express** 4.21
- **Mongoose** 8.9
- **Biome** 2.5 (lint + formato)
- **tsx** (dev) y **node:test** (testing)

## Estructura

```
src/
├── main.ts                 # Composition root (wiring manual, monta rutas)
├── features/
│   ├── raffle/             # Feature raffle (sorteo)
│   │   ├── domain/         # Entities, repositories, errors
│   │   ├── application/    # Use cases + mappers
│   │   ├── adapters/       # HTTP (controller/routes) + persistence + shared
│   │   ├── di.ts           # Wiring manual (factory functions)
│   │   └── __tests__
│   ├── ticket/             # Feature ticket (compra/disponibilidad)
│   │   ├── domain/
│   │   ├── application/
│   │   ├── adapters/
│   │   ├── di.ts
│   │   └── __tests__
│   └── gateway/            # Feature legacy (construcción externa previa)
├── platform/               # Capa de plataforma (HTTP app, DB, config, logger)
└── shared/
    ├── contracts/          # Contratos entre features (sin imports directos)
    │   ├── raffle/
    │   └── ticket/
    └── errors/             # Errores de aplicación
```

Cada feature es un **vertical slice** independiente. La comunicación entre features se hace exclusivamente a través de `shared/contracts` — nunca mediante imports directos entre features.

## Requisitos

- Node.js 20+
- MongoDB local o remoto (URI configurable)

## Configuración

Crea un archivo `.env` en la raíz:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/tickets_buy
```

## Instalación y uso

```bash
npm install
npm run dev       # Desarrollo con recarga (tsx watch src/main.ts)
npm run build     # Compilar (tsc → dist/)
npm start         # Ejecutar build (node dist/main.js)
```

## Scripts

| Comando           | Descripción                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Servidor en desarrollo con hot reload    |
| `npm run build`   | Compilar TypeScript                      |
| `npm start`       | Ejecutar el build compilado              |
| `npm test`        | Ejecutar tests de features (`node:test`) |
| `npm run typecheck` | Chequeo de tipos sin emitir            |
| `npm run lint`    | Lint con Biome                           |
| `npm run lint:fix` | Aplicar fixes automáticos de Biome      |
| `npm run format`  | Formatear con Biome                      |

## API

### Raffles — `/api/raffles`

| Método | Ruta             | Descripción                          |
| ------ | ---------------- | ------------------------------------ |
| POST   | `/`              | Crear una raffle (genera tickets)    |
| GET    | `/`              | Listar raffles (`?status=&limit=&offset=`) |
| POST   | `/:id/draw`      | Sortear ganador de una raffle        |

### Tickets — `/api/tickets`

| Método | Ruta                    | Descripción                              |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/buy`                  | Comprar tickets de una raffle            |
| GET    | `/raffle/:raffleId`     | Consultar tickets de una raffle          |
| PATCH  | `/:id/availability`     | Gestionar disponibilidad (`release`/`purchase`) |

## Test

```bash
npm test
```

## Arquitectura

El proyecto sigue una arquitectura hexagonal orientada a features, gobernada por las reglas de Forge. Resumen:

- **Layers**: `features` (dominio/aplicación/adaptadores), `platform` (infraestructura transversal), `shared` (contratos y utilidades), `infra`.
- **Comunicación entre features**: solo vía `shared/contracts` (unidireccional y controlada).
- **DI manual**: factory functions en `<feature>/di.ts` — sin contenedor mágico.
- **Composition root**: `src/main.ts` resuelve el grafo de dependencias y monta las rutas.