# Sessão Sprint 11 — Qualidade e Robustez — 2026-05-17

**Status final:** done
**Sprint plan:** docs/sprints/11/sprint-plan.md

## Stories executadas

### 11.1 — Fix `isOverdue` cobertura `em_revisao`
- `tests/unit/lib/utils/task-status.test.ts`: `em_revisao` adicionado a `activeStatuses`
- Implementação em `rules.ts` já estava correta (exclusão explícita só de `finalizada` e `arquivada`)

### 11.2 — Política de transição de status explícita
- `src/modules/task-board/application/use-cases.ts`: guard `updateTaskStatus` expandido para incluir `arquivada` junto de `finalizada` (ambos requerem admin/coordenador). Política `em_revisao` (qualquer autenticado) documentada em comentário.
- `lib/actions/tasks.ts`: `catch (e: any)` × 6 corrigido para `catch (e: unknown)` + `e instanceof Error ? e.message : String(e)`

### 11.3 — `next/image` + `remotePatterns`
- `next.config.ts`: adicionado `images.remotePatterns` para `**.googleusercontent.com`
- 9 componentes com `<img>` de avatar Google substituídos por `<Image width height className>`
- 2 componentes com `/CO-FZ.png` local substituídos por `<Image src="/CO-FZ.png" width={200} height={50}>`
- Todos os `eslint-disable @next/next/no-img-element` removidos
- Arquivos: `AppShell.tsx`, `AdminView.tsx`, `TaskCard.tsx`, `TaskModal.tsx`, `TaskDetailModal.tsx` (3 instâncias), `ProfileView.tsx`, `DashboardView.tsx`, `login/page.tsx`

### 11.4 — Testes unitários de `TaskUseCases`
- `tests/unit/src/modules/task-board/application/use-cases.test.ts` criado
- 28 testes cobrindo: createTask (status derivado de assignees, UNAUTHENTICATED), updateTaskStatus (todos os status × papel × null caller), updateTask (FORBIDDEN para efetivo), updateTaskAssignees (promoção backlog→alocada, não-promoção se já alocada), archiveTask, deleteTask

## Verificação

- `pnpm typecheck` → 0 erros
- `pnpm test:unit` → 87 testes passando (8 arquivos, +28 vs Sprint 10)

## Decisões pequenas tomadas

- `arquivada` adicionado ao guard admin/coordenador em `updateTaskStatus`: embora KanbanBoard filtre `arquivada` das colunas ativas, a camada de domínio não deve depender de invariantes de UI.
- `<Image width={200} height={50}>` para `/CO-FZ.png`: dimensão intrínseca estimada para logo horizontal. CSS controla tamanho exibido via `h-8 w-auto`.
- Mock de `TaskRepository` no teste usa `vi.fn()` em cada método — evita importar Supabase client no ambiente de testes unitários.

## Harness debt observada

- `pnpm lint` ainda quebrado com rtk. Não resolvido nesta sprint.
- Validação visual (browser subagent) não realizada.

## Pendências

- Nenhuma. Sprint 11 encerrada.
