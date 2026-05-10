# Resumo Sprint 05 — 2026-05-09 (reconstruído retroativamente)

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- Commit `7d7a7b3` (2026-05-07) — entrega da Sprint 05.
- Commit `b1e3ce2` (2026-05-08) — dark mode (escopo lateral, fora da Sprint 05; gerou débito de lint).

**Status de saída:** 🟡 entregue parcialmente — 4/4 CAs verdes em UI mas regra de negócio §2 ("usuários arquivados não aparecem como assignees") não implementada.

> **Nota sobre reconstrução.** Este `_summary.md` foi escrito em 2026-05-09 como parte da Story 07B.4. O conteúdo foi reconstruído a partir do diff do commit `7d7a7b3`, da [story-05](../../sprints/05/story-05-admin-enhancements.md) e do estado atual do código. Status de cada item validado por inspeção do repositório, não por execução real à época.

---

## 1. O que foi decidido / entregue

- **Soft-delete de usuários** via coluna `archived_at timestamptz DEFAULT NULL` em `profiles` ([migration 20260507000003](../../../../supabase/migrations/20260507000003_profiles_archived_at.sql)). Server actions `archiveUser` e `restoreUser` em [`lib/actions/admin.ts:141-195`](../../../../lib/actions/admin.ts#L141).
- **Last-admin guard estendido para `archiveUser`** ([`lib/actions/admin.ts:148-167`](../../../../lib/actions/admin.ts#L148)). Não estava nos CAs da story, mas foi feito como precaução — boa decisão preventiva.
- **Busca client-side de usuários** via `useMemo` filtrando por `email` e `full_name` ([`AdminView.tsx:49-53`](../../../../components/features/AdminView.tsx#L49)).
- **Bulk add da whitelist** com parsing por `[\n,;,]+` ([`lib/actions/admin.ts:102-105`](../../../../lib/actions/admin.ts#L102)). Input virou `<textarea>` rows=3 ([`AdminView.tsx:241`](../../../../components/features/AdminView.tsx#L241)). Mensagem do toast distingue "X adicionado(s)" vs "Y ignorado(s) (já existiam)".
- **`is_admin()` SECURITY DEFINER** introduzido em [migration 20260507000004](../../../../supabase/migrations/20260507000004_fix_admin_rls.sql) — resolve recursividade de policies admin que [ADR 0001 §"Consequências negativas"](../../../spec/adr/0001-rbac-via-supabase-rls.md) marcava como armadilha. **Não estava na story 05** mas foi entregue na mesma janela; foi tratado como bugfix transversal.

## 2. CAs vs estado real do código

| CA | Status | Evidência |
|---|---|---|
| CA-01 — Soft-delete | ✅ implementado | `archiveUser`, badge "Arquivado", opacity, grayscale no avatar ([AdminView.tsx:164-180](../../../../components/features/AdminView.tsx#L164)) |
| CA-02 — Restaurar | ✅ implementado | `restoreUser`, botão alterna ([AdminView.tsx:202-218](../../../../components/features/AdminView.tsx#L202)) |
| CA-03 — Busca | ✅ implementado | filtro por email + full_name ([AdminView.tsx:49-53](../../../../components/features/AdminView.tsx#L49)) |
| CA-04 — Bulk add | ✅ implementado | parsing + textarea + mensagem agregada |

## 3. O que ficou em aberto (lacunas detectadas em auditoria 2026-05-09)

- 🔴 **Regra de §2 não implementada: "Usuários arquivados não devem aparecer como opções para serem alocados em novas tarefas".** [`app/(app)/kanban/page.tsx`](../../../../app/(app)/kanban/page.tsx) faz `select` em `profiles` sem filtro `archived_at IS NULL`. `KanbanBoard` repassa para `TaskModal`, que renderiza arquivados como opções. **Vira ticket da Sprint 07-B (story nova ou anexar à 07B.4).**
- 🟡 **Sem login hook que bloqueie acesso de arquivado** — explicitamente fora de escopo (story §6, "Escopo negativo"). Mantido como decisão deliberada.
- 🟡 **Sem teste manual com 2+ admins arquivando-se mutuamente** (race condition do guard). Aceito como débito: race documentada, comportamento determinístico em single-admin.

## 4. ADRs criados nesta fase

Nenhum ADR novo foi criado pela Sprint 05. **Mas:** a migration `20260507000004_fix_admin_rls.sql` introduziu `is_admin()` SECURITY DEFINER, que é a alternativa rejeitada do [ADR 0001 §"Riscos a fechar" item 3](../../../spec/adr/0001-rbac-via-supabase-rls.md). A decisão foi tomada e implementada sem ADR — recomenda-se documentar via revisão do ADR 0001 em sprint futura ou criar ADR 0006 ("`is_admin()` cacheada via SECURITY DEFINER").

## 5. Padrões salvos na Knowledge Base

- **Bulk parsing por separadores múltiplos** (`/[\n,;]+/`) — padrão para qualquer input "muitos identificadores" futuro.
- **`isEntryPending` client-side** com `Set` de emails ([AdminView.tsx:24-33](../../../../components/features/AdminView.tsx#L24)) — evita round-trip extra.
- **`is_admin()` SECURITY DEFINER** com `SET search_path = public` — quebra recursão e simplifica policies. Replicar para outros checks de role frequentes se houver custo perceptível.
- **Last-admin guard replicado em `archiveUser`** — boa heurística preventiva: toda action que pode tornar um admin "inativo" deve checar single-admin invariant.

## 6. Métricas / artefatos verificáveis

- **Migrations aplicadas:** `20260507000003_profiles_archived_at.sql` e `20260507000004_fix_admin_rls.sql`. Total acumulado: 8 migrations.
- **`pnpm exec tsc --noEmit` à época:** assumido verde (não há registro). **Hoje (2026-05-09): vermelho** — ver §8.
- **`pnpm lint` à época:** assumido verde. **Hoje: vermelho** — ver §8.
- **Smoke manual:** não documentado. Sem evidência de validação multi-persona.
- **Cobertura de testes:** 0% (mantida).

## 7. Avisos para o próximo agente

- **Confirmar com humano** se `tasks/page.tsx` deve filtrar arquivados antes da Story 07B.4 fechar — pode implicar em mudança de UX (e.g., admin querer ver todos para entender histórico). Tratar como decisão de produto, não bugfix automático.
- **Migration `20260507000004` mexeu em policies de `profiles` e `whitelist`** — qualquer teste de RLS futuro precisa cobrir o novo comportamento via `is_admin()`.
- **`addToWhitelist` faz N inserts em loop** ([linhas 114-121](../../../../lib/actions/admin.ts#L114)) — para listas grandes não é ideal. Aceito; refactor para `INSERT ... ON CONFLICT DO NOTHING` em batch é débito P3.

## 8. Harness debt observada

- **`_summary.md` da Sprint 05 não foi escrito à época.** Sprint 06 começou (commit `7c6aa45`) sem fechamento da Sprint 05 — viola gate `_summary.md` por fase do harness. Pago retroativamente nesta sessão.
- **Decisão arquitetural sem ADR:** `is_admin()` SECURITY DEFINER (migration `20260507000004`) merecia ADR. Documentar.
- **Baseline `pnpm typecheck && pnpm lint` quebra (2026-05-09):**
  - `tsc --noEmit` reporta 8 erros em `supabase/functions/sync-sheets/index.ts` — arquivo Deno coberto pelo tsconfig do Next. Causa raiz: commit `7c6aa45` adicionou Edge Function sem excluir `supabase/functions/` do `tsconfig.exclude`. **Ticket: P0 da Sprint 07-A** (gate de DoD).
  - `pnpm lint` reporta `react-hooks/set-state-in-effect` em [`components/ui/ThemeToggle.tsx:11`](../../../../components/ui/ThemeToggle.tsx#L11) — vindo do commit `b1e3ce2` (dark mode). **Ticket: P0 da Sprint 07-A** (gate de DoD).
- **`b1e3ce2` (dark mode) entregue fora de qualquer sprint formal** — não há sprint plan, story, ou `_summary.md` cobrindo essa adição. Recomendar política: nada vai pra `main` sem sprint que o cubra.
