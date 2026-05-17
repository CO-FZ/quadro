# Sprint 11: Qualidade e Robustez

## Meta
Corrigir dívidas técnicas acumuladas nas Sprints 09–10: cobertura de testes para `em_revisao`, política de transição de status explícita, migração de `<img>` para `next/image`, e testes unitários de use cases.

## Stories

1. **[Story 11.1] Fix `isOverdue` — cobertura `em_revisao`**
   - Adicionar `em_revisao` ao array `activeStatuses` no teste `task-status.test.ts`.
   - Implementação em `rules.ts` já está correta (não é terminal); só o teste estava incompleto.

2. **[Story 11.2] Política de transição de status explícita**
   - `updateTaskStatus` use case: proteger `arquivada` com admin/coordenador (igual a `finalizada`).
   - Política `em_revisao`: qualquer usuário autenticado — explicitado em comentário.
   - `catch (e: any)` × 6 em `lib/actions/tasks.ts` → `catch (e: unknown)` + narrowing.

3. **[Story 11.3] `next/image` + `remotePatterns`**
   - Adicionar `images.remotePatterns` para `**.googleusercontent.com` em `next.config.ts`.
   - Substituir `<img>` por `<Image>` em 11 componentes, removendo `eslint-disable`.

4. **[Story 11.4] Testes unitários de `TaskUseCases`**
   - Criar `tests/unit/src/modules/task-board/application/use-cases.test.ts`.
   - Cobrir: createTask, updateTaskStatus (permissões + em_revisao + arquivada), updateTask, updateTaskAssignees.

## Status da Sprint
- **Início:** 17/05/2026
- **Status Atual:** **CONCLUÍDA**
- **Riscos Mitigados:** 11.3 afeta muitos componentes; TypeScript strict mode + typecheck pós-alteração garante integridade.
