# Sprint 13: Aba Arquivados (Histórico Consultável)

## Meta

Criar uma aba dedicada **"Arquivados"** que funcione como histórico consultável de tarefas concluídas e arquivadas, com busca unificada por todos os campos da tarefa, em ordem cronológica decrescente. Saneia a dívida técnica de duplicação criada pela seção inline de arquivadas dentro do Kanban.

---

## Stories

### [Story 13.1] Rota e dados — `/arquivados`

**Objetivo:** Criar a rota dedicada e a query servidor que alimenta a nova aba.

**Escopo técnico:**

- Criar `app/(app)/arquivados/page.tsx` (Server Component):
  - Buscar tarefas com `status IN ('finalizada', 'arquivada')`.
  - Incluir `task_assignees { profiles (id, email, full_name, nome_guerra, patente, avatar_url, role) }`.
  - Ordenar por `updated_at DESC` (mais atual → mais antiga).
  - Passar dados ao `ArquivadosView` como `initialTasks`.
- Buscar lista de `profiles` ativos (para tooltip/filtro).
- Carregar `currentUserRole` para gating do botão de "Restaurar" (futuro — fora desta sprint).

**Arquivos afetados:**

- `app/(app)/arquivados/page.tsx` *(novo)*

**Critério de aceite:**

- Acessar `/arquivados` autenticado retorna a lista server-rendered.
- Lista contém tarefas com `status = 'finalizada'` **e** `status = 'arquivada'`.
- Ordenação cronológica descendente pelo `updated_at`.
- `pnpm typecheck` passa.

---

### [Story 13.2] `ArquivadosView` — listagem + busca unificada

**Objetivo:** Componente cliente com lista cronológica e campo único de busca que casa em todos os atributos relevantes da tarefa.

**Escopo técnico:**

- Criar `components/features/ArquivadosView.tsx` (`'use client'`):
  - Props: `initialTasks: TaskWithAssignees[]`, `profiles`, `currentUserRole`.
  - Estado local: `searchTerm: string`.
  - Função `matchesSearch(task, term)` (extraída para `lib/utils/task-search.ts` para teste isolado):
    - Normalizar `term` (lowercase + remover diacríticos).
    - Concatenar em uma "haystack" os seguintes campos da tarefa:
      - `task.title`
      - `task.description ?? ''`
      - `task.start_date`, `task.end_date` em formato bruto **e** formatado (`dd/MM/yyyy`)
      - `task.sector` + label expandida (`'DT'` + `'Divisão Técnica'`, idem `DA`)
      - `task.status` + label da coluna (`'finalizada'`, `'Finalizada'`, `'arquivada'`, `'Arquivada'`)
      - `task.is_servico ? 'serviço' : ''`
      - Para cada assignee: `profiles.full_name`, `profiles.nome_guerra`, `profiles.email`, `profiles.patente`, `formatNomeCompleto(...)`
      - `task.updated_at` formatado
    - Normalizar a haystack (lowercase + remover diacríticos) e retornar `haystack.includes(termNormalizado)`.
  - Renderização:
    - Header com `<input>` de busca (debounced 150ms) e contador "X tarefa(s)".
    - Lista (não Kanban) com cards verticais — usar `TaskCard` em modo somente-leitura ou componente novo `ArchivedTaskCard` mais compacto exibindo: título, badge de status (Finalizada/Arquivada), setor, datas, assignees (avatares), `updated_at`.
    - Clique no card abre `TaskDetailModal` (mantém comportamento atual).
    - Estado vazio: ilustração + texto "Nenhuma tarefa arquivada ou finalizada ainda." / "Nenhuma tarefa corresponde à busca."

- Criar `lib/utils/task-search.ts` exportando `buildTaskHaystack(task)` e `matchesSearch(haystack, term)`.

**Arquivos afetados:**

- `components/features/ArquivadosView.tsx` *(novo)*
- `components/features/ArchivedTaskCard.tsx` *(novo — variante read-only)*
- `lib/utils/task-search.ts` *(novo)*

**Critério de aceite:**

- Busca por título encontra a tarefa.
- Busca por nome de guerra do assignee encontra todas as tarefas dele.
- Busca por "DT", "Técnica" ou "Divisão Técnica" filtra setor DT.
- Busca por "17/05" filtra tarefas com data nesse dia (formato pt-BR).
- Busca insensível a maiúsculas/acentos: `"joao"` casa `"João"`.
- Lista mantém ordem cronológica decrescente após filtro.
- `pnpm typecheck` passa.

---

### [Story 13.3] Navegação — incluir aba Arquivados após Kanban

**Objetivo:** Posicionar a nova aba na ordem correta no `AppShell`.

**Ordem final das abas:**

1. Dashboard → `/dashboard`
2. Kanban → `/kanban`
3. **Arquivados** → `/arquivados`
4. Matriz → `/matriz`
5. Usuários → `/admin` *(admin only)*

**Escopo técnico:**

- `components/features/AppShell.tsx`:
  - Inserir entrada `{ href: '/arquivados', label: 'Arquivados', icon: ArchiveBoxIcon }` no `NAV_ITEMS` entre Kanban e Matriz.
  - Ícone: usar o mesmo SVG `path` do botão "Arquivar" existente no `KanbanBoard.tsx` (caixa de arquivo) para consistência visual.

**Arquivos afetados:**

- `components/features/AppShell.tsx`

**Critério de aceite:**

- Aba "Arquivados" aparece entre "Kanban" e "Matriz".
- Estado ativo (highlight) funciona ao navegar para `/arquivados`.
- Layout mobile mantém a mesma ordem.

---

### [Story 13.4] Dívida técnica — remover seção inline "Arquivadas" do Kanban

**Objetivo (DT existente):** Eliminar a duplicação visual e de lógica criada pela seção colapsável "Arquivadas" dentro do `KanbanBoard.tsx`. A responsabilidade agora é da aba dedicada `/arquivados`; manter a seção inline seria estado paralelo e fonte de divergência.

**Contexto da dívida:**

- Hoje `KanbanBoard.tsx` (linhas 215-260, ~46 linhas) renderiza uma seção colapsável `<button id="btn-toggle-archived">` + grid de `TaskCard` para tarefas arquivadas.
- A query servidor em `app/(app)/kanban/page.tsx` traz `arquivada` junto, infla o payload e força filtragem cliente (`optimisticTasks.filter`).
- Após Story 13.1, a fonte canônica de tarefas arquivadas vira `/arquivados`. Manter a seção inline gera:
  - Duplicação de cards e estado (uma tarefa arquivada apareceria em dois lugares).
  - Risco de divergência se a aba Arquivados evoluir (ex.: filtros, ações).
  - Payload extra na rota mais quente do app.

**Escopo técnico:**

- `components/features/KanbanBoard.tsx`:
  - Remover `archivedOpen` state, `archivedTasks` computado, blocos JSX da seção colapsável e ícones associados.
  - Manter `KANBAN_COLUMNS.filter((c) => c.id !== 'arquivada')` (já está correto — `arquivada` nunca foi coluna do board).
  - Contador no header: remover sufixo `· N arquivada(s)`. Adicionar link textual `→ Ver Arquivados` apontando para `/arquivados`.
- `app/(app)/kanban/page.tsx`:
  - Excluir `status = 'arquivada'` da query principal (`.neq('status', 'arquivada')` ou filtro em SQL).
  - Reduzir o payload, alinhar com o foco operacional do kanban.

**Arquivos afetados:**

- `components/features/KanbanBoard.tsx`
- `app/(app)/kanban/page.tsx`

**Critério de aceite:**

- Página `/kanban` não traz mais tarefas com `status = 'arquivada'` no payload.
- Header do Kanban mostra apenas o contador de tarefas ativas + link "Ver Arquivados".
- `pnpm typecheck` e `pnpm test:unit` passam.
- Smoke test via browser subagent (ou manual): arquivar uma tarefa no Kanban → ela some do board e aparece em `/arquivados`.

---

### [Story 13.5] Testes unitários da busca

**Objetivo:** Garantir cobertura do filtro de busca antes de ele virar produção.

**Escopo técnico:**

- Criar `tests/unit/lib/utils/task-search.test.ts` cobrindo:
  - Busca por título exato/parcial.
  - Busca por descrição.
  - Busca por nome de guerra, patente, full_name e email de assignee.
  - Busca por setor (`'DT'`, `'Técnica'`, `'Divisão Técnica'`).
  - Busca por data em formato brasileiro (`'17/05/2026'`) e ISO (`'2026-05-17'`).
  - Busca insensível a maiúsculas e diacríticos.
  - Tarefa sem assignees não quebra `buildTaskHaystack`.
  - Tarefa com `description: null` não quebra.
  - Tarefa `is_servico: true` é encontrada por `'serviço'`.
  - Termo vazio retorna `true` (mostra tudo).
- Atualizar `tests/unit/src/modules/task-board/application/use-cases.test.ts` se necessário (não esperado).

**Arquivos afetados:**

- `tests/unit/lib/utils/task-search.test.ts` *(novo, ≥ 10 testes)*

**Critério de aceite:**

- `pnpm test:unit` passa com ≥ 10 testes novos (total ≥ 102).
- Todos os casos do critério da Story 13.2 cobertos por teste.

---

## Não-objetivos desta sprint

- **Restaurar tarefa arquivada para o Kanban.** Apenas leitura/consulta nesta sprint. O ADR 0010 permite essa transição, mas a UI não a expõe agora.
- **Excluir tarefa arquivada permanentemente** via a aba Arquivados. O botão "Excluir" continua no `TaskDetailModal` para admin; sem alteração.
- **Paginação / virtualização da lista.** Volume esperado da unidade militar comporta carregamento integral. Reavaliar após 1k+ tarefas arquivadas.
- **Substituir `revalidatePath` por `useQuery`** no fluxo de arquivamento. Mantém o padrão atual (Sprint 11/12); migração planejada quando o segundo consumidor de `useQuery` aparecer.

---

## Dependências entre Stories

```
13.1 (rota + query)
  └─► 13.2 (view + busca) ───► 13.5 (testes do filtro)
  └─► 13.3 (navegação)

13.4 (remoção da seção inline) — depende de 13.1 estar em produção
                                  (evita janela com tarefa arquivada invisível)
```

## Ordem de execução sugerida

1. **13.1** — rota + página servidor (curto, destrava todo o resto).
2. **13.2 + 13.5** em paralelo — view + testes do helper de busca.
3. **13.3** — entrada na navegação.
4. **13.4** — cleanup da seção inline no Kanban (último, depois da nova aba estar funcional).

---

## Estimativa de esforço

| Story | Complexidade | Justificativa |
|-------|-------------|---------------|
| 13.1 | Baixa | Página + query Supabase, padrão já estabelecido |
| 13.2 | Média | Componente novo + helper de busca normalizado |
| 13.3 | Baixa | Edição pontual em `NAV_ITEMS` |
| 13.4 | Baixa | Remoção de código + ajuste de query |
| 13.5 | Baixa | Testes puros, sem mocks |

---

## Riscos e mitigações

- **Risco:** Performance da busca em lista grande (>500 arquivadas) com `includes` sobre haystack concatenada.
  - **Mitigação:** Debounce de 150ms já evita re-render por keystroke. Reavaliar com `useMemo` no `buildTaskHaystack` se o p95 do render passar de 100ms.
- **Risco:** Tarefas finalizadas recém-concluídas ficarem "perdidas" entre Kanban (após Story 13.4 ainda apareçam na coluna "Finalizada") e Arquivados (aparecem por estar em `status IN ('finalizada','arquivada')`).
  - **Mitigação:** Comportamento intencional. "Finalizada" no Kanban é cenário operacional ativo; "Arquivados" é histórico consultável. Documentar no README do componente.
- **Risco:** Janela de inconsistência ao desativar a seção inline (Story 13.4) antes da aba Arquivados (Stories 13.1-13.3) estar 100% testada.
  - **Mitigação:** Ordem de execução estabelece 13.4 como último passo, atrás de smoke test manual.

---

## Status da Sprint

- **Início:** 17/05/2026
- **Status Atual:** **CONCLUÍDA**
- **Aprovação:** dada em 17/05/2026.
- **Dívida técnica explícita:** Story 13.4 (existente — duplicação inline `KanbanBoard.tsx` × aba dedicada) — saneada.
- **Execução:** ver [`docs/memory/execution/2026-05-17-sprint-13-arquivados.md`](../../memory/execution/2026-05-17-sprint-13-arquivados.md).
