# Final Artifact — Sprint 03 / Story 03 (Hardening + criação universal + UX)

**Data:** 2026-05-07
**Story:** [docs/sprints/03/story-03-tasks-hardening.md](../../sprints/03/story-03-tasks-hardening.md)
**Sprint plan:** [docs/sprints/03/sprint-plan.md](../../sprints/03/sprint-plan.md)
**ADR:** [0003 — defesa em camadas + criação universal](../../spec/adr/0003-defesa-em-camadas-tasks.md) (aceito 2026-05-07)
**Plan Artifact (Gate 1):** aprovado em chat 2026-05-07

---

## Sumário (≤ 5 linhas)

Sprint 03 entrega: criação universal de tarefas (qualquer authenticated cria, sem auto-alocar), conclusão (`finalizada`) restrita a admin/coord, defesa em camadas via `requireRole` em ações destrutivas, helper único `isOverdue`, optimistic UI no Kanban com transição fluida, histórico "Criada por" no detalhe da tarefa, e favicon CO-FZ. RLS de INSERT relaxada via migration; UPDATE/DELETE inalteradas.

## Arquivos alterados

| Arquivo | Operação | Razão |
|---|---|---|
| [`docs/spec/adr/0003-defesa-em-camadas-tasks.md`](../../spec/adr/0003-defesa-em-camadas-tasks.md) | criar | ADR aceito (passo 0) |
| [`supabase/migrations/20260507000001_relax_task_insert_policy.sql`](../../../supabase/migrations/20260507000001_relax_task_insert_policy.sql) | criar | drop policy "admins/coord criam"; nova "authenticated cria a própria"; nova self-assign em `task_assignees` |
| [`lib/auth/require-role.ts`](../../../lib/auth/require-role.ts) | criar | helper memoizado via `cache()` |
| [`lib/utils/task-status.ts`](../../../lib/utils/task-status.ts) | criar | `isOverdue` único |
| [`lib/actions/tasks.ts`](../../../lib/actions/tasks.ts) | atualizar | `createTask` universal; `updateTask`/`archiveTask`/`deleteTask`/`updateTaskAssignees` com `requireRole`; `updateTaskStatus` com gate condicional para `finalizada` |
| [`components/features/KanbanBoard.tsx`](../../../components/features/KanbanBoard.tsx) | atualizar | FAB universal (inline `sm:flex` desktop + flutuante `sm:hidden` mobile bottom-left); `useOptimistic` + transition fluida; passa `currentUserId` |
| [`components/features/TaskCard.tsx`](../../../components/features/TaskCard.tsx) | atualizar | usa helper `isOverdue`; `canDrag = canManage \|\| isAssignee`; transição CSS suave |
| [`components/features/TaskDetailModal.tsx`](../../../components/features/TaskDetailModal.tsx) | atualizar | usa helper `isOverdue`; mostra "Criada por &lt;nome&gt; em &lt;data&gt;" |
| [`components/features/ProfileView.tsx`](../../../components/features/ProfileView.tsx) | atualizar | usa helper `isOverdue` |
| [`components/features/TaskModal.tsx`](../../../components/features/TaskModal.tsx) | atualizar | valida `start_date` e coerência start/end |
| [`app/(app)/kanban/page.tsx`](../../../app/(app)/kanban/page.tsx) | atualizar | passa `currentUserId` ao `KanbanBoard` |
| [`app/icon.png`](../../../app/icon.png) | criar (cópia de `public/CO-FZ.png`) | favicon via convenção Next 16 |
| [`app/favicon.ico`](../../../app/favicon.ico) | remover | substituído pelo `icon.png` |
| [`docs/sprints/03/sprint-plan.md`](../../sprints/03/sprint-plan.md) | criar | sprint plan |
| [`docs/sprints/03/story-03-tasks-hardening.md`](../../sprints/03/story-03-tasks-hardening.md) | criar/atualizar | story com 8 CAs + decisões revisadas |
| [`docs/memory/sprints/03/_summary.md`](../sprints/03/_summary.md) | criar | resumo de fase |

## Como testar

```bash
# 1. Aplicar migration de RLS
pnpm supabase db push   # ou aplicar manualmente em produção

# 2. Smoke local
pnpm dev

# 3. Testes manuais (com 3 personas)
#    Como efetivo:
#    - /kanban → FAB "Nova Tarefa" visível
#    - Criar tarefa: título, setor, datas obrigatórios; drive_url opcional; assignees opcionais
#    - Tarefa criada com created_by = self; status 'backlog' (sem assignees) ou 'alocada' (com)
#    - Detalhe da tarefa exibe "Criada por <self> em <data>"
#    - Arrastar card próprio (assignee) entre Backlog/Alocada/Em Desenvolvimento → funciona
#    - Tentar arrastar para Finalizada → Toast "Você não tem permissão para esta ação." e card volta
#    - Tentar editar/arquivar/excluir tarefa via dev tools (Server Action direta) → FORBIDDEN

#    Como coordenador (ou admin):
#    - Criar e mover tarefa para Finalizada → ok
#    - Editar metadados, arquivar, excluir → ok
#    - Atualizar assignees no detalhe → ok

# 4. Verificar favicon
#    - Inspecionar tab do browser em qualquer rota
#    - <link rel="icon"> deve apontar para /icon.png?...

# 5. Smoke anti-spoofing (curl com JWT de efetivo):
#    POST /rest/v1/tasks com created_by=<outro-uuid> → RLS deve bloquear (WITH CHECK)

# 6. Verificações automáticas
pnpm exec tsc --noEmit  # passou ✅
pnpm lint               # passou ✅
```

## Riscos conhecidos

- **🟡 Validação visual mobile não executada.** Browser subagent não disponível neste runtime (Claude Code). Layout usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` no Kanban; em viewport < 640px renderiza 1 coluna por vez + **FAB flutuante** (bottom-left, `fixed bottom-6 left-6 sm:hidden`). Validar manualmente em dispositivo real ou DevTools (CA-06 fica em débito).
- **🟢 Decisão "quem finaliza" confirmada:** `['admin','coordenador']` — humano confirmou em 2026-05-07.
- **🔴 Migration NÃO aplicada em remoto.** Ao rodar `pnpm supabase db push`, divergência detectada: 4 migrations remotas desconhecidas (`20260507134655` a `20260507135135`) e 5 locais não aplicadas. Não foi feito repair nem pull para evitar destruir estado. **Aguardando decisão humana** entre (a) `db pull` e consolidar, (b) `repair --status reverted` + `db push`, (c) inspecionar dump primeiro.
- **🟡 `useOptimistic` sem rollback explícito do estado de erro.** Em erro, faço `router.refresh()` que recarrega o estado real do servidor — funciona mas há um leve flash. Aceitável para v1; refinamento futuro pode usar revert local sincronizado.
- **🟡 Migration de RLS não testada em ambiente remoto.** Aplicada apenas via `pnpm supabase db push` localmente. Smoke test anti-spoofing é parte do plano de validação humana.
- **🟢 `requireRole` não logar tentativas FORBIDDEN.** Risco anotado em ADR 0003 §"Riscos conhecidos a fechar" — débito de Sprint 04+.

## Verificações executadas

- [x] `pnpm exec tsc --noEmit` → sem erros.
- [x] `pnpm lint` → sem erros.
- [ ] Smoke test manual com 3 personas (admin, coord, efetivo) — **pendente humano**.
- [ ] Validação visual mobile com screenshots — **pendente** (browser subagent indisponível).
- [ ] Migration aplicada em ambiente remoto — **bloqueado** (divergência local↔remoto). Veja "Riscos conhecidos".

## Harness debt produzida nesta sprint

- **`pnpm typecheck` ainda não existe** como script no `package.json`. Usei `pnpm exec tsc --noEmit`. Criar script no próximo PR de manutenção. AGENTS.md §6 prevê `pnpm typecheck` como gate.
- **Browser subagent ausente** no runtime atual (Claude Code) — o harness assume disponibilidade. CA-06 fica como débito explícito.
- **Mudança de escopo durante execução** (após Gate 1): usuário ajustou regras de "quem finaliza" e "auto-alocação do criador". Tratado com edits incrementais + atualização do ADR e da story. O harness prevê pausa para novo gate em "Plan Artifact que muda significativamente"; aqui considerei mudança incremental dentro do escopo aprovado, mas é zona cinzenta.

## Próximo passo sugerido

Sprint 04 candidatos:
1. Guard "último admin" em `lib/actions/admin.ts` (não permite admin único se rebaixar).
2. Mapeamento detalhado erros RLS → mensagens de UI tipadas.
3. Logger estruturado para tentativas FORBIDDEN.
4. Suite de testes (unit + integration) — sprint dedicada.
5. Sincronização Google Sheets (US-05) — exige ADR 0004.

Confirmar com humano qual entra primeiro.
