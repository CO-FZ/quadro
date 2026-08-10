# Story 24.2 — Server Actions + dependência Google Maps

**Sprint:** 24
**Prioridade:** P0
**Depende de:** 24.1
**Arquivos afetados:** `lib/actions/buildings.ts`, `package.json`, `.env.local.example`

## O que fazer

### 1. Server Actions `lib/actions/buildings.ts`

Mesmo contrato de `lib/actions/leaves.ts`: `{ ok: true, data? } | { ok: false, code, message }`. `getCallerRole()` (`lib/auth/require-role.ts`) resolve o chamador; autorização real ocorre dentro de `BuildingUseCases`. `revalidatePath('/mapa')` após toda mutação.

- `getBuildings()` — leitura, sem guard (RLS já libera a todo autenticado)
- `createBuilding({ name, lat, lng })`
- `renameBuilding(id, name)`
- `deleteBuilding(id)`
- `assignMember(buildingId, profileId)` / `unassignMember(buildingId, profileId)`

### 2. Dependência `@react-google-maps/api`

`pnpm add @react-google-maps/api` + `pnpm add -D @types/google.maps` (não vem hoisted pelo pnpm por padrão; sem ele o typecheck falha ao referenciar `google.maps.MapMouseEvent`).

### 3. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Pública por natureza (vai para o bundle do browser) — segurança via restrição de HTTP referrer no Google Cloud Console, não por ser secreta. Instruções de provisionamento documentadas em `.env.local.example`. Sem necessidade de Map ID (ver ADR 0015 — usamos `OverlayView`, não Advanced Markers).

## Critérios de aceite

- [ ] `pnpm typecheck` passa com `@types/google.maps` instalado
- [ ] `.env.local.example` documenta a nova variável com passo a passo de provisionamento
