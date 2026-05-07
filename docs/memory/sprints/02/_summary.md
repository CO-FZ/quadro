# Resumo Sprint 02 — 2026-05-07

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- [docs/memory/execution/2026-05-07-sprint-02-final.md](../../execution/2026-05-07-sprint-02-final.md) — Final Artifact (entrega + auditoria)
- Commits: `95f91fd` (entrega original), `f0d806e` (avatares/Toast/archived — pagaram dívida da 02)

**Status de saída:** 🟡 aprovado com ressalvas — débitos rastreados carregados para Sprint 03.

---

## 1. O que foi decidido

- Schema de tasks usa enum `task_status` ('backlog','alocada','em_desenvolvimento','finalizada','arquivada') e enum `task_sector` ('DT','DA') → [migration 20260506000001](../../../../supabase/migrations/20260506000001_task_management.sql).
- RLS por papel + alocação aplicada em `tasks` e `task_assignees` → [ADR 0001](../../../spec/adr/0001-rbac-via-supabase-rls.md).
- Avatares vêm de `profiles.avatar_url` mantido por trigger `sync_google_metadata` na tabela `auth.users`. Fallback é iniciais do `full_name` ou `email`.
- Mensagens de erro padronizadas via `ActionResult = { ok:true } | { ok:false, code, message }` + Toast no client → [ToastProvider.tsx](../../../../components/ui/ToastProvider.tsx).
- Status `arquivada` adicionado ao enum (commit `f0d806e`, migration `20260506000002`) para suportar UI de tarefas arquivadas no Kanban.
- Dashboard usa view `user_task_stats` com `SECURITY INVOKER` (segurança via RLS do invocador, não do dono da view).

## 2. O que ficou em aberto (carregar para próxima fase)

- **Role guards em Server Actions de tasks** (`createTask`, `updateTask`, `updateTaskStatus`, `archiveTask`, `deleteTask`) — hoje só checam `getUser()`, dependem só de RLS. **Crítico**, vira passo 0 da Sprint 03 com ADR 0003.
- **Helper único de "Atrasada"** — atualmente duplicado em `TaskCard`, `TaskDetailModal`, `ProfileView`. Vira `lib/utils/task-status.ts` na Sprint 03.
- **Optimistic UI no drag-and-drop** — hoje `router.refresh()`. Vira useOptimistic + rollback na Sprint 03.
- **Validação visual mobile com browser subagent** — não executada. Vira passo final da story de hardening na Sprint 03.

## 3. ADRs criados nesta fase

| ADR | Título | Status |
|---|---|---|
| — | nenhum novo | — |

> Sprint 02 não introduziu padrões inéditos: schema/RLS de tasks aplica [ADR 0001](../../../spec/adr/0001-rbac-via-supabase-rls.md) já existente. **ADR 0003** sobre defesa-em-camadas (RLS + Server Action role guard) será redigido como passo 0 da Sprint 03 — o débito de role guards revela que a decisão precisa ser explícita.

## 4. Padrões salvos na Knowledge Base

- **`ActionResult` discriminado** + Toast no client é o padrão oficial de Server Action neste produto. Reutilizado em `lib/actions/admin.ts` no commit `f0d806e`.
- **Sync de metadata Google via trigger** (`sync_google_metadata` em `auth.users`) é o padrão para manter `full_name`/`avatar_url` frescos sem código de aplicação.
- **`SECURITY INVOKER` em views** que dependem de RLS — visível em [migration archived_status](../../../../supabase/migrations/20260506000002_archived_status.sql) ao recriar `user_task_stats`.

## 5. Métricas / artefatos verificáveis

- **Schema:** migrations `20260506000001`, `20260506000002`, `20260507000000` aplicadas.
- **UI funcional:** Kanban + Dashboard ponta-a-ponta em dev (testado manualmente em desktop; mobile pendente).
- **Cobertura de testes:** 0% — projeto ainda sem suite de testes. Débito carregado para sprint dedicada.
- **DoD:** parcial. `pnpm typecheck` e `pnpm lint` ainda não foram executados como gate antes de declarar pronto — outro débito.

## 6. Avisos para o próximo agente

- **Não confie só em RLS** para Server Actions sensíveis. ADR 0003 vai exigir defesa em camadas explícita.
- **`router.refresh()` em todo Server Action** é caro — Sprint 03 deve trocar por `useOptimistic` no drag-and-drop e revalidação granular.
- **Commit `f0d806e` misturou escopo** de Sprint 02 (Toast, avatares, archived) com Sprint 03 (UI Admin) e dívida transversal (security_invoker). Próximas execuções devem respeitar o gate Plan Artifact para evitar misturas.
- **`pnpm typecheck && pnpm lint`** ainda não roda automaticamente. Sprint 03 deve pelo menos executá-los manualmente antes do Final Artifact.

## 7. Harness debt observada

- **Plan Artifact (Gate 1) violado em duas execuções consecutivas** (Sprint 01 bootstrap + commit `f0d806e`). O harness só funciona se o gate for respeitado — proposta: adicionar checklist explícito no início de cada sessão de execução.
- **Exit criteria de sprint ficaram genéricos demais** ("Auditoria de role guards") — proposta: cada exit criterion vira um item verificável com comando/arquivo, não prosa.
- **`_summary.md` por sprint não tinha pasta dedicada** — agora padronizado em `docs/memory/sprints/<n>/_summary.md`. Atualizar template do harness.
