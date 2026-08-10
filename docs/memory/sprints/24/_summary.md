# Sprint 24 — Resumo de fase (Mapa de Alocação do Efetivo)

**Última atualização:** 2026-08-10 (implementação 24.1–24.4)
**Plano:** [docs/sprints/24/sprint-plan.md](../../../sprints/24/sprint-plan.md)
**ADR:** [0015 — Mapa de Alocação do Efetivo em Edificações](../../../spec/adr/0015-mapa-alocacao-efetivo.md)
**Status de saída:** 🟢 implementado — typecheck + lint + testes unit verdes (139 testes, incl. `building.test.ts`). Integração (actions/RLS) e e2e não escritos nesta sprint; exigem Supabase local (`supabase db reset`) + `pnpm test`/`pnpm test:e2e`. **Bloqueio de teste manual end-to-end:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ainda não provisionada — usuário optou por provisionar depois.

---

## Status por story

| Story | Status | Cobertura adicionada |
|---|---|---|
| 24.1 — Migration `buildings`/`building_assignments` + módulo `allocation` | ✅ | `tests/unit/src/modules/allocation/domain/building.test.ts` (6) |
| 24.2 — Server Actions `buildings` + dependência Google Maps | ✅ | — |
| 24.3 — Rota `/mapa` + `MapaView` + nav | ✅ | — (sem e2e ainda; ver riscos) |
| 24.4 — ADR 0015 + docs | ✅ | — |

---

## Arquivos novos

- `supabase/migrations/20260810000000_buildings_allocation.sql` — tabelas `buildings` e `building_assignments` (`UNIQUE (building_id, profile_id)`), RLS (SELECT a todos; CUD admin/coordenador), trigger `handle_updated_at`, índices em `building_id`/`profile_id`.
- `src/modules/allocation/` — bounded context novo (ADR 0006): `domain/entities.ts` (`Building`, `BuildingAssignee`, `BuildingWithAssignees`, `AppRoleLike`/`PatenteTypeLike` locais), `domain/building.ts` (`normalizeBuildingInput`, `validateBuildingName`), `domain/repository.ts`, `application/use-cases.ts` (`BuildingUseCases`, guard admin/coordenador), `infrastructure/supabase-building-repository.ts` (join `building_assignments → profiles`).
- `lib/actions/buildings.ts` — `getBuildings`/`createBuilding`/`renameBuilding`/`deleteBuilding`/`assignMember`/`unassignMember`; contrato `{ok}` discriminado; revalida `/mapa`.
- `app/(app)/mapa/page.tsx` + `loading.tsx` — rota nova, sem gating de role (leitura aberta a todo autenticado).
- `components/features/MapaView.tsx` — `GoogleMap` + `OverlayView` por obra (pin + avatares empilhados, até 4 + contador), modo "+ Nova obra" (clique único arma criação), modal de detalhe (alocar/remover membro, renomear, excluir), estado vazio quando a API key não está configurada.
- `tests/unit/src/modules/allocation/domain/building.test.ts`.

## Arquivos modificados

- `lib/supabase/types.ts` — re-exporta tipos de `allocation`.
- `components/features/AppShell.tsx` — item "Mapa" em `NAV_ITEMS`, entre Dashboard e Kanban, sem gating por role.
- `.env.local.example` — nova variável `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` com passo a passo de provisionamento (habilitar Maps JavaScript API, gerar chave, restringir por HTTP referrer).
- `package.json` — `@react-google-maps/api` (dependency) + `@types/google.maps` (devDependency; não vem hoisted pelo pnpm por padrão — sem ele o typecheck falha ao referenciar `google.maps.MapMouseEvent`).

---

## Decisões de produto (humano, 2026-08-10)

- Gestão por **admin + coordenador** (mesmo padrão do ADR 0014); leitura liberada a todos.
- Criação de obra por **clique livre no mapa**, informando apenas o **nome** (sem endereço/geocoding).
- Aba "Mapa" visível a **todos os autenticados**.
- Google Maps JS API escolhida sobre Street View/Static Maps por exigir interatividade (clique para criar obra, clique no fiscal); `OverlayView` escolhido sobre Advanced Markers para evitar provisionar Map ID além da API key.

## Riscos / débitos rastreados

- **API key não provisionada** neste ambiente — o usuário optou por provisionar depois (Google Cloud Console → habilitar Maps JavaScript API → gerar chave → restringir por referrer). `MapaView` já trata o caso de key ausente com estado vazio amigável, mas a feature não foi smoke-testada num browser real nesta sessão.
- Sem testes de integração (`*.actions.test.ts`) nem RLS (`*.rls.test.ts`) nem e2e para `buildings`/`building_assignments` — seguir o padrão de `tests/integration/rls/leaves.rls.test.ts` e `tests/integration/actions/leaves.actions.test.ts` numa story de hardening, análoga à 23.5.
- v1 não suporta: arrastar/mover pin de obra, clustering de obras muito próximas, geocoding de endereço — candidatos a story futura (ver ADR 0015, seção Consequências).
- Múltiplos avatares sobre o mesmo pin usam offset CSS simples (empilhamento horizontal, máx. 4 + contador); obras muito próximas no mapa podem sobrepor seus grupos de avatares — sem clustering nesta v1.
