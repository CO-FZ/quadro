# Sprint 24 — Mapa de Alocação do Efetivo em Edificações

**Data:** 2026-08-10
**Gatilho:** Solicitação de produto — a chefia precisa visualizar num mapa em quais obras o efetivo da CO-FZ está fiscalizando, e quem está alocado em cada uma.

---

## Objetivo

Introduzir um novo domínio **Allocation** (`allocation`) que registra edificações/obras marcadas no mapa e os fiscais alocados em cada uma (many-to-many: uma obra tem 1+ fiscais, um fiscal pode atender mais de uma obra), e expô-lo numa nova rota `/mapa` com Google Maps interativo.

## Decisões de produto (confirmadas com o humano em 2026-08-10)

| Tema | Decisão |
|------|---------|
| **Gestão (criar obra / atribuir membros)** | Admin e Coordenador, mesmo padrão do ADR 0014. Leitura liberada a todo autenticado. |
| **Criação de obra** | Clique livre no mapa; só se informa o Nome da Obra (sem endereço/geocoding). |
| **Visibilidade da aba "Mapa" na navegação** | Todos os autenticados, entre Dashboard e Kanban, sem gating por role. |
| **Tecnologia de mapa** | Google Maps JavaScript API + `@react-google-maps/api`, marcadores customizados via `OverlayView` (evita exigir Map ID/Advanced Markers). |

## Impacto arquitetural

Ver **ADR 0015** para a decisão completa e alternativas rejeitadas (Street View estático, Maps Static API, Advanced Markers, geocoding).

### Novo bounded context `src/modules/allocation` (ADR 0006)

```
src/modules/allocation/
  domain/
    entities.ts        ← Building, BuildingAssignee, BuildingWithAssignees, RawBuildingInput, NormalizedBuildingInput
    building.ts         ← normalizeBuildingInput(), validateBuildingName()
    repository.ts        ← BuildingRepository (interface)
  application/
    use-cases.ts         ← BuildingUseCases (create/rename/delete/list/assign/unassign, guard via Caller)
  infrastructure/
    supabase-building-repository.ts
```

### Banco (ADR 0001 — RLS)

Novas tabelas `public.buildings` e `public.building_assignments` (junção many-to-many, `UNIQUE (building_id, profile_id)`). SELECT liberado a `authenticated` em ambas; INSERT/UPDATE/DELETE restrito a admin/coordenador via `EXISTS profiles role IN ('admin','coordenador')`. Trigger `handle_updated_at` em `buildings`. Índices em `building_assignments(building_id)` e `building_assignments(profile_id)`.

### Nova rota `/mapa`

`app/(app)/mapa/page.tsx` busca `buildings` (via Server Action `getBuildings`) e `profiles`, calcula `canManage` a partir da role do chamador, e passa tudo para `MapaView` (client component). Nova entrada de navegação em `AppShell.tsx`, sem gating por role.

### Nova dependência externa

`@react-google-maps/api` + `@types/google.maps` (dev). Nova env var pública `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — instruções de provisionamento documentadas em `.env.local.example`.

## Stories

- **24.1** — Schema (`buildings`/`building_assignments`) + módulo `allocation` (domain/application/infrastructure)
- **24.2** — Server Actions `lib/actions/buildings.ts` + dependência Google Maps + env var
- **24.3** — Rota `/mapa` + `MapaView` (mapa interativo, criação de obra por clique, avatares dos fiscais, modal de alocação) + item de nav "Mapa"
- **24.4** — ADR 0015 + docs de sprint/memória
