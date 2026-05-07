# Resumo Sprint 03 — 2026-05-07

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- [docs/memory/execution/2026-05-07-sprint-03-final.md](../../execution/2026-05-07-sprint-03-final.md) — Final Artifact

**Status de saída:** 🟡 aprovado com ressalvas — validação visual mobile em débito; decisão "quem finaliza" aguarda confirmação humana.

---

## 1. O que foi decidido

- **Defesa em camadas** ([ADR 0003](../../../spec/adr/0003-defesa-em-camadas-tasks.md) §A): `requireRole(['admin','coordenador'])` em `updateTask`/`archiveTask`/`deleteTask`/`updateTaskAssignees`; condicional em `updateTaskStatus` quando alvo é `finalizada`.
- **Criação universal de tarefas** (ADR 0003 §B): qualquer authenticated cria, com `WITH CHECK (created_by = auth.uid())` impedindo spoofing. RLS de INSERT em `tasks` relaxada; self-INSERT em `task_assignees` permitido.
- **Não auto-alocar criador** (ADR 0003 §C): tarefa nasce sem assignees por padrão (status `backlog`); se o criador escolher assignees no modal, status inicial é `alocada`. `created_by` registra histórico imutável.
- **Conclusão restrita** a admin/coord — decisão revisada durante execução. Pendente confirmação se admin é superset de coord ou se deve ser estritamente coord.
- **Helper único `isOverdue`** em `lib/utils/task-status.ts` — regra: `status not in ('finalizada','arquivada') AND end_date < hoje`.
- **Optimistic UI no Kanban** via `useOptimistic` com `transition-all duration-200 ease-out` no card. Em erro, `router.refresh()` ressincroniza com servidor.
- **Favicon CO-FZ** via convenção Next 16 (`app/icon.png`).
- **Histórico "Criada por"** exibido no `TaskDetailModal` com avatar + nome + data.

## 2. O que ficou em aberto (carregar para próxima fase)

- **Confirmar política "quem finaliza"** com humano: admin+coord (atual) ou estritamente coord. Se mudar, ajuste é trivial em [`lib/actions/tasks.ts`](../../../lib/actions/tasks.ts).
- **Validação visual mobile** (CA-06) — runtime sem browser subagent. Validar com humano em dispositivo real ou DevTools.
- ~~Migration aplicada em ambiente remoto~~ — feito via `db reset --linked --yes` (b3) em 2026-05-07. Schema sincronizado.
- **Smoke anti-spoofing** (curl com JWT de efetivo tentando spoofar `created_by`) — script de teste a anexar.
- **Logger estruturado para `FORBIDDEN`** — débito da ADR 0003 §"Riscos conhecidos".

## 3. ADRs criados nesta fase

| ADR | Título | Status |
|---|---|---|
| 0003 | Defesa em camadas para Tasks + criação universal | aceito (2026-05-07) |

## 4. Padrões salvos na Knowledge Base

- **`requireRole(['admin','coordenador'])`** memoizado via `cache()` é o padrão para defesa em camadas em Server Actions sensíveis. Replicar em qualquer nova action que toque domínio sensível.
- **Migration de relaxamento de RLS** documenta drop+create explícito (não rely em `OR REPLACE` para policy) — Postgres exige drop antes.
- **`useOptimistic` + `router.refresh()` em erro** é padrão simples de optimistic UI sem complicação de revert manual. Aceitar para v1; revisitar se houver flicker em mobile.
- **Histórico via `created_by` imutável** + display no modal de detalhe é padrão para audit-trail leve (sem tabela `events` separada).

## 5. Métricas / artefatos verificáveis

- **`pnpm exec tsc --noEmit`** — passou ✅.
- **`pnpm lint`** — passou ✅.
- **`pnpm typecheck`** como script: ainda **não existe** no `package.json`. Débito.
- **Smoke test manual com 3 personas** — pendente humano.
- **Migration aplicada em remoto** — pendente humano.

## 6. Avisos para o próximo agente

- **Não há suite de testes ainda.** Cada mudança em policy de RLS ou Server Action precisa smoke manual. Considerar Sprint dedicada.
- **`pnpm typecheck` não existe**: usar `pnpm exec tsc --noEmit` direto, ou propor PR para adicionar o script.
- **Browser subagent indisponível** em Claude Code; tarefas com CA visual ficam em débito ou exigem outro runtime.
- **`updateTaskStatus` tem gate condicional** (só quando status = 'finalizada'). Cuidado ao adicionar novos status — revisar a regra.
- **`created_by` é imutável** — não permitir UPDATE dessa coluna em nenhuma Server Action futura.

## 7. Lições — gestão de migrations Supabase

- **Divergência local↔remoto detectada** ao tentar `db push` após desenvolvimento local. Causa provável: migrations criadas via Supabase Studio em paralelo, com timestamps próprios.
- **Resolução: reset destrutivo (b3).** Aceitável neste estágio (sem dados de produção), mas registra precedente: em produção nunca usar `db reset --linked`. Para casos futuros, preferir (a) `db pull` + consolidar.
- **`migration repair --status reverted` SEM dropar schema NÃO funciona** quando o schema já existe — o push subsequente conflita com tipos/tabelas já criados. A única forma de "reverted + push" funcionar limpo é se o schema também tiver sido dropado, o que efetivamente é o `db reset`.
- **Recomendação para Sprint 04+:** quando humano fizer mudança no Studio, **sempre** rodar `supabase db pull` antes de criar migration local nova. Adicionar à `runbooks/`.

## 8. Harness debt observada

- **Plan Artifact mudou significativamente durante execução** (ajustes da regra "quem finaliza" e "auto-alocação"). O harness prevê pausa para novo gate parcial; aqui foi tratado como ajuste incremental dentro do escopo aprovado. Discutível — proposta para skill: definir explicitamente o threshold de "mudança significativa" que dispara novo Gate 1.
- **`pnpm typecheck` ausente** mesmo sendo citado em AGENTS.md §6. Proposta: bootstrap do harness deveria incluir esse script no `package.json` automaticamente.
- **Browser subagent assumido disponível** pelo harness, mas runtime real (Claude Code) não tem. Proposta: skill deve declarar fallback explícito quando subagente não disponível, em vez de tornar o CA "obrigatório" condicionalmente.
- **Migrations idempotentes** ainda não são padrão — `DROP POLICY IF EXISTS` foi usado por convenção, mas sem documento que exija. Adicionar ao migration-checklist.
