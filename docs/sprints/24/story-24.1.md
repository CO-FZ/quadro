# Story 24.1 — Schema + módulo `allocation`

**Sprint:** 24
**Prioridade:** P0
**Depende de:** —
**Arquivos afetados:** `supabase/migrations/20260810000000_buildings_allocation.sql`, `src/modules/allocation/**`, `lib/supabase/types.ts`

## O que fazer

### 1. Migration

Tabelas `public.buildings` (`id`, `name`, `lat`, `lng`, `created_by`, timestamps) e `public.building_assignments` (`id`, `building_id`, `profile_id`, `assigned_by`, `assigned_at`, `UNIQUE (building_id, profile_id)`). RLS: SELECT `authenticated`; ALL admin/coordenador via `EXISTS`. Trigger `handle_updated_at` em `buildings`. Índices em `building_assignments(building_id)` e `building_assignments(profile_id)`.

### 2. Módulo `src/modules/allocation`

Clean Architecture (domain/application/infrastructure), mesmo formato de `src/modules/personnel` (ADR 0014):

- `domain/entities.ts`: `Building`, `BuildingAssignee`, `BuildingWithAssignees`, `RawBuildingInput`, `NormalizedBuildingInput`. `AppRoleLike`/`PatenteTypeLike` locais ao módulo (não importa de `task-board`, ADR 0006).
- `domain/building.ts`: `normalizeBuildingInput()`, `validateBuildingName()`.
- `domain/repository.ts`: interface `BuildingRepository`.
- `application/use-cases.ts`: `BuildingUseCases` — `listBuildings` (aberto), `createBuilding`/`renameBuilding`/`deleteBuilding`/`assignMember`/`unassignMember` (guard `assertManager`, admin/coordenador).
- `infrastructure/supabase-building-repository.ts`: `SupabaseBuildingRepository`, join `building_assignments → profiles` mapeado para `BuildingAssignee[]`.

### 3. Tipos re-exportados em `lib/supabase/types.ts`

## Critérios de aceite

- [ ] `pnpm typecheck` passa
- [ ] `pnpm test:unit` cobre `normalizeBuildingInput`/`validateBuildingName`
- [ ] RLS testado manualmente: efetivo lê mas não escreve; admin/coordenador escrevem
