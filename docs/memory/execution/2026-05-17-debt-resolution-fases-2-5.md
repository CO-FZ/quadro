# Sessão Resolução de Dívidas Técnicas — Fases 2/3/4/5 — 2026-05-17

**Status final:** done
**Plano:** docs/sprints/sprint_10_11_debt_resolution_plan.md
**Branch:** claude/fix-technical-debt-k3Xeu

## Fases executadas

### Fase 2 — ADR 0012 (DT-A3)
- `docs/spec/adr/0012-introducao-tarefas-de-servico.md` criado, status `Aceito` retroativo às migrations `20260517000004` e `20260517000005`.
- `docs/adr/README.md` atualizado: entrada 0012 + próximo número agora `0013`.
- Decisão formalizada: `is_servico` é invariante de domínio (rules.normalizeTaskInput aplica `title='Serviço'`, `description=null`, `drive_url=null`); exclusão de métricas vive na view `user_task_stats` via `FILTER (WHERE NOT t.is_servico)`.

### Fase 3 — Cobertura de testes `is_servico` (DT-T4)
- `tests/unit/src/modules/task-board/domain/task.test.ts`: +4 testes para `normalizeTaskInput`:
  - `is_servico=false` preserva título/descrição/drive_url normalmente.
  - `is_servico=true` ignora whitespace no title de entrada.
  - `is_servico=true` ignora drive_url só com whitespace.
  - `is_servico=true` normaliza para conjunto canônico mesmo com strings vazias.
- Total: 88 → 92 testes (8 arquivos).

### Fase 4 — TanStack Query (DT-S1)
- `pnpm add @tanstack/react-query @tanstack/react-query-devtools` (5.100.10).
- `app/providers.tsx` (novo): `QueryProvider` Client Component com `QueryClient` instanciado via `useState` (preserva instância entre renders, conforme padrão SSR-safe da TanStack).
- `app/layout.tsx`: `QueryProvider` envolvendo `{children}` dentro do `ThemeProvider`.
- `components/features/KanbanBoard.tsx`: drag-and-drop migrado de `useTransition` ad-hoc para `useMutation` + `queryClient.invalidateQueries({ queryKey: ['tasks'] })`.
  - `mutationFn`: chama `updateTaskStatus`; converte `{ ok:false }` em erro lançado para o pipeline TanStack.
  - `onSettled`: invalida query `tasks` e dispara `router.refresh()` (mantém SSR como fonte autoritativa enquanto não há `useQuery` no kanban).
  - `onError`: toast com mensagem; rollback otimista ocorre naturalmente ao fim do `startTransition`.
  - `useOptimistic` mantido — o dispatch acontece dentro de `startTransition(async () => { … await mutateAsync … })` para garantir que o estado otimista só reverta após a mutation finalizar.

### Fase 5 — Validação de tipos (DT-A4)
- Decisão: **não regenerar** `lib/supabase/types.ts` via `supabase gen types typescript`. ADR 0006 (Modular Monolith) define `src/modules/task-board/domain/entities.ts` como fonte canônica.
- `lib/supabase/types.ts`: comentário de cabeçalho ampliado explicitando a fonte canônica e advertindo contra regeneração automática.
- Verificação manual: `is_servico`, `patente`, `nome_guerra`, `divisao` já cobertos em `entities.ts` e re-exportados.

## Verificação

- `pnpm typecheck` → 0 erros
- `pnpm test:unit` → **92 testes** passando (88 → 92, +4)
- `pnpm build` → OK; 10 rotas geradas (`/`, `/admin`, `/auth/callback`, `/dashboard`, `/kanban`, `/login`, `/matriz`, `/profile`, `_not-found`, `icon.png`)

## Decisões pequenas

- **`useOptimistic` + `useMutation`:** decidi usar `mutateAsync` dentro de `startTransition(async)` em vez de `mutate()` fora, porque o estado otimista do `useOptimistic` reverte ao fim da transição. Sem aguardar a promise da mutation dentro da transição, o card pisca de volta antes do `onSettled` invalidar.
- **`onSettled` em vez de `onSuccess` separado:** garante invalidação tanto em sucesso quanto em falha (cobre o caso de status já mudado por outro usuário em realtime futuro).
- **`staleTime: 30_000`:** padrão de 30s para queries que ainda virão (dashboard, matriz). Cliente curto para um app militar com várias edições simultâneas; ajustar quando os primeiros `useQuery` aparecerem.
- **Não regenerar tipos:** o pipeline `supabase gen types` produz um único objeto `Database` enorme. ADR 0006 prefere tipos por bounded context — manter mão na regeneração apenas se a divergência domínio/banco crescer.

## Pendências

- Validação visual via browser subagent não realizada (sem ambiente de Supabase configurado para auth real nesta sessão).
- `useQuery` para listagens de tasks/profiles ainda não introduzido — Server Components seguem sendo fonte autoritativa; TanStack só atua em mutations no kanban.
- `eslint` continua quebrado por dependência `rtk` (harness debt observada na Sprint 11, não resolvida nesta sessão).
