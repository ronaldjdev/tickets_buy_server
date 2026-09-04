# Architecture State

**Project Name:** tickets_buy_server  
**Framework:** Express  
**Runtime:** Node v26.5.0  
**Database:** MongoDB  
**ORM:** Mongoose  
**DI Strategy:** manual  
**Profile:** express-mongodb  
**Architecture:** hexagonal-feature (Platform + Features + Shared + Infra)  
**Last Audit:** 2026-09-04 (score: 87/100)  

## Platform

- `platform/config/`
- `platform/database/`
- `platform/di/`
- `platform/http/`
- `platform/logger/`
- `platform/server/`
- `platform/config/Env.config/`
- `platform/config/index/`
- `platform/database/Db.config/`
- `platform/database/index/`
- `platform/di/index/`
- `platform/http/App/`
- `platform/http/index/`
- `platform/index/`
- `platform/logger/index/`
- `platform/server/index/`

## Features

- `features/raffle/`
- `features/ticket/`

## Shared

- `shared/contracts/`
- `shared/errors/`
- `shared/types/`
- `shared/utils/`
- `shared/contracts/index/`
- `shared/errors/AppError/`
- `shared/errors/DomainError/`
- `shared/errors/RepositoryError/`
- `shared/errors/UnauthorizedError/`
- `shared/errors/UseCaseError/`
- `shared/errors/ValidationError/`
- `shared/errors/index/`
- `shared/index/`
- `shared/types/index/`
- `shared/utils/index/`

## Infrastructure

- `infra/mongodb/`
- `infra/index/`
- `infra/mongodb/index/`

## Ownership

**Health:** healthy  
**Score:** 100/100  
**Orphans:** 0  
**Duplicates:** 0  
**Misplaced:** 0  

## Architecture Graph

**Nodes:** 30  
**Edges:** 14  
**Risk Score:** 0/100  
**Health:** healthy  
**Dependency Health:** 100%  

### Platform Layer
- `platform:config` — config
- `platform:database` — database
- `platform:di` — di
- `platform:http` — http
- `platform:index` — index
- `platform:logger` — logger
- `platform:server` — server

### Feature Layer
- `feature:raffle` — raffle
- `feature:ticket` — ticket

### Shared Layer
- `shared:contracts` — contracts
- `shared:errors` — errors
- `shared:index` — index
- `shared:types` — types
- `shared:utils` — utils

### Infrastructure Layer
- `infra:index` — index
- `infra:mongodb` — mongodb
- `infra:express` — express
- `infra:mongoose` — mongoose

### Domain Layer
- `domain:raffle` — raffle/domain
- `domain:ticket` — ticket/domain

### Adapter Layer
- `adapter:raffle` — raffle/adapters
- `adapter:raffle:controllers` — raffle/adapters/in/http/controllers
- `adapter:raffle:routes` — raffle/adapters/in/http/routes
- `adapter:raffle:repositories` — raffle/adapters/out/persistence/repositories
- `adapter:raffle:schemas` — raffle/adapters/out/persistence/schemas
- `adapter:ticket` — ticket/adapters
- `adapter:ticket:controllers` — ticket/adapters/in/http/controllers
- `adapter:ticket:routes` — ticket/adapters/in/http/routes
- `adapter:ticket:repositories` — ticket/adapters/out/persistence/repositories
- `adapter:ticket:schemas` — ticket/adapters/out/persistence/schemas

### Dependency Graph
- `feature:raffle` → [domain:raffle, shared:contracts]
- `adapter:raffle` → [infra:express, feature:raffle, infra:mongoose]
- `feature:ticket` → [domain:ticket, shared:contracts]
- `adapter:ticket` → [infra:express, feature:ticket, infra:mongoose]
- `platform:database` → [infra:mongoose]
- `platform:http` → [infra:express]


## Dependency Health

**Valid Edges:** 14/14  
**Dependency Health:** 100%  
**Risk Score:** 0/100  
**Health:** healthy  

## Context

- **Has Src:** true  
- **Has Features Dir:** true  
- **Has Platform Dir:** true  
- **Has Shared Dir:** true  
- **Has Infra Dir:** true  
- **Is Migrating:** false  
- **Is Fully Migrated:** true  
- **Is Legacy:** false  
- **Is Greenfield:** false  
- **Total Features:** 2  

## Tech Stack

| Component | Technology |

|-----------|------------|

| Framework | Express |

| Runtime | Node v26.5.0 |

| Database | MongoDB |

| ORM | Mongoose |

| DI Strategy | manual |

| Profile | express-mongodb |

