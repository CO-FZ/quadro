# Sessão Sprint 13 — Aba Arquivados — 2026-05-17

**Status final:** done
**Sprint plan:** docs/sprints/13/sprint-plan.md
**Branch:** claude/fix-technical-debt-k3Xeu

## Stories executadas

### 13.1 — Rota `/arquivados`
- `app/(app)/arquivados/page.tsx` (novo): Server Component que busca tasks com `status IN ('finalizada','arquivada')`, inclui `task_assignees(profiles)` completo (com `nome_guerra`, `patente`) e ordena por `updated_at DESC`.

### 13.2 — `ArquivadosView` + helper de busca
- `lib/utils/task-search.ts` (novo): `normalizeForSearch` (NFD + strip diacritics + lowercase), `buildTaskHaystack(task)` (concatena título, descrição, datas raw + dd/MM/yyyy, setor + label, status + label, marcador "serviço", e todos os campos de cada assignee — `full_name`, `nome_guerra`, `email`, `patente`, `formatNomeCompleto`), e `matchesSearch(haystack, term)`.
- `components/features/ArquivadosView.tsx` (novo): client component com input único de busca, `useDeferredValue` para suavizar typing, `useMemo` em haystacks (build uma vez) e em filtered (recomputa só com mudança de termo). Estado vazio diferenciado para busca vs lista vazia. Abre `TaskDetailModal` ao clicar.
- `components/features/ArchivedTaskCard.tsx` (novo): card compacto somente-leitura com badges (setor, status `Finalizada`/`Arquivada`, `Serviço` se aplicável), `updated_at` no canto e linha-resumo com setor, período e assignees agregados.

### 13.3 — Navegação
- `components/features/AppShell.tsx`: aba **Arquivados** inserida entre Kanban e Matriz no `NAV_ITEMS`. Ícone de caixa de arquivo (mesmo path do botão "Arquivar" em `TaskDetailModal`) para consistência visual.

### 13.4 — Dívida técnica: remoção da seção inline "Arquivadas"
- `components/features/KanbanBoard.tsx`: removido o estado `archivedOpen`, o computado `archivedTasks` e o bloco JSX completo (~46 linhas) da seção colapsável. Header agora exibe contador de ativas + link `Ver arquivados →` apontando para `/arquivados`.
- `app/(app)/kanban/page.tsx`: query principal agora aplica `.neq('status', 'arquivada')` — reduz payload e alinha com a separação operacional do board.

### 13.5 — Testes
- `tests/unit/lib/utils/task-search.test.ts` (novo, 18 testes): cobre `normalizeForSearch`, `matchesSearch` (case/accent insensitive, termo vazio), e `buildTaskHaystack` (título, descrição, setor DT/DA com label, status finalizada/arquivada, datas BR + ISO, full_name/nome_guerra/email/patente do assignee, `formatNomeCompleto`, `is_servico`, edge cases: description null, sem assignees, múltiplos assignees, termo inexistente).

## Verificação

- `pnpm typecheck` → 0 erros
- `pnpm test:unit` → **110 testes** passando (92 → 110, +18)
- `pnpm lint` → 0 erros, 3 warnings pré-existentes (`tests/e2e/auth.spec.ts:6`, `tests/integration/rls/tasks.rls.test.ts:64`, `tests/unit/src/modules/task-board/application/use-cases.test.ts:1` — todos `no-unused-vars` em testes, não introduzidos por esta sprint)
- `pnpm build` → OK; nova rota `/arquivados` listada em 11 rotas do app

## Decisões pequenas

- **`useDeferredValue` em vez de `setTimeout` debounce manual:** React 19 lida nativamente; mantém o input controlado responsivo e atrasa apenas o filtro pesado. Plano previa "debounce 150ms" — `useDeferredValue` é a API canônica equivalente.
- **`buildTaskHaystack` indexado em `useMemo` no mount:** evita reconstruir a haystack a cada keystroke. Trade-off: usa O(n) memória para n tarefas (~200 bytes/task em média); aceitável para o volume previsto.
- **`useMemo` de `filtered` depende de `deferredSearch`:** rerender só quando o termo "estabiliza", não a cada caractere.
- **Search hits incluem `formatNomeCompleto` pré-formatado:** garante que termo `"Cap Silva"` (patente + nome) case mesmo se patente e nome estão em campos separados.
- **Link `Ver arquivados →` no header do Kanban em vez de manter contador inline:** o usuário sempre pode chegar à aba via NAV_ITEMS, mas o link mantém affordance contextual após o uso do botão "Arquivar".
- **`.neq('status', 'arquivada')` no `kanban/page.tsx` em vez de filtro só cliente:** defesa em camadas (ADR 0003) — diminui tráfego e elimina possibilidade de tarefa arquivada vazar via timing de filtro otimista.

## Pendências

- Validação visual via browser subagent não realizada (sem Supabase de runtime nesta sandbox); recomenda-se smoke manual:
  1. Arquivar uma tarefa finalizada no Kanban → ela some do board e aparece em `/arquivados`.
  2. Buscar por nome de guerra, data BR e setor — confirmar resultados.
  3. Clicar em card arquivado → `TaskDetailModal` abre com ações apropriadas.
- Migração `revalidatePath` → `useQuery`/`invalidateQueries` para os outros consumidores (admin, dashboard) — fora do escopo, segue como dívida técnica futura.
- 3 warnings de `no-unused-vars` em testes pré-existentes — não relacionados a esta sprint; candidatos para cleanup de manutenção.
