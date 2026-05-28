# ADR 0014 — Modelo de Férias e Afastamentos do Efetivo

**Status:** Proposto (Sprint 23)
**Data:** 2026-05-28
**Relacionados:** 0001 (RBAC/RLS), 0006 (Modular Monolith), 0007 (State Architecture), 0009 (Centralização de Guards)

---

## Contexto

A chefia precisa registrar e visualizar períodos de indisponibilidade do efetivo — **Férias**, **Instalação** e **Dispensa** — num Gantt anual (linha = colaborador, colunas = meses, barras = períodos). Essa indisponibilidade também precisa aparecer na **Matriz de Atividades**, para que a alocação de tarefas considere quem está afastado.

Hoje não há entidade de domínio para isso. As tarefas (`task-board`) modelam trabalho, não ausência. O painel `/admin` é exclusivamente de admin.

## Decisão

1. **Novo bounded context `src/modules/personnel`.** Afastamentos pertencem ao pessoal, não ao quadro de tarefas. Segue a mesma Clean Architecture (domain/application/infrastructure) de `task-board`, conforme ADR 0006. É a fonte de verdade de `Leave` e `LeaveType`.

2. **Tabela `public.leaves` + enum `public.leave_type`** com três valores fixos (`ferias`, `instalacao`, `dispensa`). Campos: `profile_id`, `type`, `start_date`, `end_date`, `description`, `created_by`, timestamps. `CHECK (end_date >= start_date)`.

3. **RLS (ADR 0001):** SELECT liberado a todo `authenticated` (a Matriz é vista por todos); INSERT/UPDATE/DELETE restritos a `admin` e `coordenador`.

4. **Gestão por admin + coordenador.** O guard de `/admin` é relaxado para aceitar coordenador, mas as abas são gateadas por role: Usuários/Whitelist/Auditoria permanecem admin-only; a nova aba **Férias** é visível a admin e coordenador. Server Actions de `leaves` usam `requirePrivileged()` (ADR 0009).

5. **Duas superfícies de UI:**
   - Aba **Férias** no `/admin`: Gantt anual com navegação de ano.
   - **Matriz**: badge colorido por tipo na célula do membro nos dias do período.

6. **Sobreposição de períodos permitida** (ex.: instalação dentro de férias). A validação garante apenas `end_date >= start_date`.

## Alternativas rejeitadas

- **Modelar afastamento como `task` com `is_servico` especial** — polui o domínio de tarefas e confunde semântica de status/assignees.
- **Tabela genérica `events`** — over-engineering para três tipos bem definidos; perde a tipagem do enum.
- **Manter `/admin` admin-only e criar rota separada para coordenador** — duplicaria layout/navegação; gating de abas por role é mais simples.

## Consequências

- Novas políticas RLS na tabela `leaves`; superfície de segurança a testar (Story 23.5).
- `/admin` deixa de ser exclusivamente admin — exige teste de gating de abas.
- Novo módulo a manter; tipos re-exportados em `lib/supabase/types.ts`.
- Mutações de `leaves` revalidam `/admin` e `/matriz` (ADR 0007).
