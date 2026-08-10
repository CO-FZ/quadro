# ADR 0015 — Mapa de Alocação do Efetivo em Edificações

**Status:** Aceito (Sprint 24 — implementado)
**Data:** 2026-08-10
**Relacionados:** 0001 (RBAC/RLS), 0006 (Modular Monolith), 0007 (State Architecture), 0009 (Centralização de Guards), 0014 (Modelo de Férias — precedente de novo bounded context)

---

## Contexto

A chefia precisa visualizar, num mapa, em quais edificações (obras) o efetivo da CO-FZ está fiscalizando, e quem está alocado em cada uma. Uma edificação pode ter 1+ membros; um membro pode estar alocado em mais de uma edificação (many-to-many). Hoje não há entidade de domínio para "local físico de obra" nem para a relação de alocação — `task-board` modela tarefas, não presença física.

Decisões de produto confirmadas com o humano em 2026-08-10:

| Tema | Decisão |
|------|---------|
| **Gestão (criar obra / atribuir membros)** | Admin e Coordenador, mesmo padrão do ADR 0014. Leitura liberada a todo autenticado. |
| **Criação de obra** | Clique livre no mapa; só se informa o Nome da Obra (sem endereço/geocoding). |
| **Visibilidade da aba "Mapa" na navegação** | Todos os autenticados, sem gating por role. |
| **Renderização de avatares** | Cada fiscal alocado aparece com seu avatar sobre o pin da obra. |

## Decisão

1. **Novo bounded context `src/modules/allocation`.** Alocação física do efetivo é um domínio próprio, irmão de `task-board` e `personnel`, seguindo a mesma Clean Architecture (domain/application/infrastructure) do ADR 0006. É a fonte de verdade de `Building` e `BuildingAssignment`.

2. **Tabelas `public.buildings` e `public.building_assignments`.**
   - `buildings`: `id`, `name`, `lat`, `lng`, `created_by`, timestamps.
   - `building_assignments`: `id`, `building_id` (FK cascade), `profile_id` (FK cascade), `assigned_by`, `assigned_at`, com `UNIQUE (building_id, profile_id)` — a mesma dupla não é atribuída duas vezes, mas um `profile_id` pode aparecer em várias linhas (múltiplas obras) e uma `building_id` pode ter várias linhas (múltiplos fiscais).

3. **RLS (ADR 0001):** SELECT liberado a todo `authenticated` em ambas as tabelas (o mapa é visto por todos); INSERT/UPDATE/DELETE restritos a `admin` e `coordenador` via `EXISTS (... profiles.role IN (...))`, mesmo padrão de `leaves`.

4. **Gestão por admin + coordenador**, sem relaxar nenhum guard existente — `/mapa` é uma rota nova, aberta a todo autenticado para leitura; os controles de criar/atribuir/remover só renderizam quando `canManage` (role do chamador). Server Actions usam o mesmo guard interno do `LeaveUseCases` (`assertManager` em `BuildingUseCases`).

5. **Google Maps JavaScript API + `@react-google-maps/api`**, com marcadores customizados via `OverlayView` em vez de Advanced Markers. Avalia-se abaixo por quê.

6. **Nova rota `/mapa`**, nova entrada de navegação em `AppShell` entre Dashboard e Kanban, visível a todos.

## Alternativas rejeitadas

- **Street View estático ou Maps Static API** — não suportam marcador clicável nem overlay de avatar; exigiriam reconstruir toda a interatividade (clique para criar obra, clique no fiscal) em cima de uma imagem estática. Rejeitado: o requisito central é interatividade.
- **Advanced Markers (`AdvancedMarkerElement`) via `@vis.gl/react-google-maps`** — permitiria HTML customizado nativamente, mas exige provisionar um **Map ID** adicional no Google Cloud Console além da API key, e habilitar o Map Styling API. Rejeitado por aumentar o custo de provisionamento sem necessidade: `OverlayView` da `@react-google-maps/api` entrega o mesmo resultado visual (avatar circular posicionado sobre o pin) só com "Maps JavaScript API" habilitada.
- **Geocoding de endereço para posicionar a obra** — decisão de produto explícita foi clique livre + nome apenas; geocoding adiado para uma iteração futura se necessário.
- **Modelar `building_assignments` como campo array em `buildings` ou em `profiles`** — perde a integridade referencial e a capacidade de consultar "quais obras um fiscal atende" e "quais fiscais atendem uma obra" com índices simples; tabela de junção é o padrão já usado em `task_assignees` (ADR existente do domínio `task-board`).

## Consequências

- Novas políticas RLS nas tabelas `buildings` e `building_assignments`; superfície de segurança a cobrir em teste (padrão RLS de `leaves`).
- Nova dependência externa `@react-google-maps/api` e novo secret `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (público por natureza — restringir por HTTP referrer no Google Cloud Console, não por ser secreto).
- Novo módulo a manter; tipos re-exportados em `lib/supabase/types.ts`.
- Mutações de `buildings`/`building_assignments` revalidam `/mapa` (ADR 0007).
- Limitação conhecida da v1: sem arrastar/mover pin, sem clustering quando obras estão muito próximas no mapa, sem geocoding de endereço — candidatos a story futura se o uso real demandar.
