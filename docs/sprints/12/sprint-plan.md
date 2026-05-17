# Sprint 12: Matriz, Patente e Métricas DT/DA

## Meta

Expandir o produto com três eixos: (1) nova aba **Matriz** com visão de grade cronológica por efetivo, (2) campo **Patente** militar no perfil exibido em todo o app, e (3) métricas de divisão **DT vs DA** no Dashboard.

---

## Stories

### [Story 12.1] Patente — Migration e domínio

**Objetivo:** Adicionar campo `patente` ao perfil de cada usuário.

**Escopo técnico:**
- Criar migration `20260517000000_add_patente_to_profiles.sql`:
  - Criar enum `patente_type`: `'Cel'`, `'TCel'`, `'Maj'`, `'Cap'`, `'Ten'`, `'SUB'`, `'1SGT'`, `'2SGT'`, `'3SGT'`, `'CB'`, `'SD'`
  - Adicionar coluna `patente patente_type NULL` à tabela `profiles`
- Atualizar tipo `Profile` em `src/modules/task-board/domain/entities.ts`:
  - Adicionar campo `patente: PatenteType | null`
- Atualizar view `user_task_stats` para incluir `patente` no SELECT
- Criar helper `formatNomeCompleto(patente, full_name): string` em `lib/utils/format.ts`
  - Resultado: `"Maj Eduardo Lima"` (patente + nome de guerra)
  - Fallback: só `full_name` se `patente` for null

**Arquivos afetados:**
- `supabase/migrations/20260517000000_add_patente_to_profiles.sql` *(novo)*
- `supabase/migrations/20260517000001_update_user_task_stats_patente.sql` *(novo)*
- `src/modules/task-board/domain/entities.ts`
- `lib/utils/format.ts` *(novo ou atualizado)*

**Critério de aceite:**
- `pnpm typecheck` passa
- `PatenteType` exportado e usado no tipo `Profile`
- `formatNomeCompleto('Maj', 'Eduardo Lima')` retorna `'Maj Eduardo Lima'`

---

### [Story 12.2] Patente — UI em todo o app

**Objetivo:** Substituir exibição de `full_name` ou `email` por `formatNomeCompleto(patente, full_name)` em todos os pontos do app.

**Escopo técnico:**
- `components/features/AdminView.tsx`:
  - Tabela de usuários: exibir `formatNomeCompleto(patente, full_name)`
  - Formulário de criação/edição: adicionar campo `Patente` com `<select>` das opções do enum
  - Server Action `updateUserProfile` / `createUser`: incluir `patente` no upsert
- `components/features/KanbanBoard.tsx`:
  - Avatar tooltip / label dos assignees: usar `formatNomeCompleto`
- `components/features/DashboardView.tsx`:
  - Tabela de colaboradores: coluna de nome → `formatNomeCompleto`
- `components/features/AppShell.tsx`:
  - Header com nome do usuário logado → `formatNomeCompleto`
- Checar qualquer outro ponto que renderize `full_name` ou `email` de perfil

**Arquivos afetados:**
- `components/features/AdminView.tsx`
- `components/features/KanbanBoard.tsx`
- `components/features/DashboardView.tsx`
- `components/features/AppShell.tsx`
- `lib/actions/users.ts` (ou arquivo de server actions de usuários)

**Critério de aceite:**
- Exibição uniforme `Patente Nome` em todos os componentes
- Admin consegue setar/editar patente via painel
- Smoke test visual via browser subagent: kanban, dashboard, admin

---

### [Story 12.3] Aba Matriz — Página e componente

**Objetivo:** Criar visualização matricial (grade dias × efetivo) com janela de ±7 dias centrada no dia corrente.

**Escopo técnico:**
- Criar rota `app/(app)/matriz/page.tsx`:
  - Buscar tasks com `start_date <= today+7 AND end_date >= today-7`, incluindo `task_assignees { profiles }` e `patente`
  - Buscar `profiles` ativos (não arquivados)
  - Passar dados ao `MatrizView`

- Criar `components/features/MatrizView.tsx`:
  - **Estrutura da grade:**
    - Linhas: dias de `today-7` a `today+7` (15 linhas de dados + 1 header)
    - Colunas: um usuário por coluna (ordenado por patente militar, depois nome)
    - Células: lista de tarefas onde `assignee === user && start_date <= dia <= end_date`
  - **Frozen layout** via CSS `position: sticky`:
    - Header row (nomes dos usuários): `sticky top-0 z-20`
    - Primeira coluna (datas): `sticky left-0 z-10`
    - Corner cell (interseção): `sticky top-0 left-0 z-30`
  - **Linha do dia corrente:** destaque com background diferenciado (ex.: `bg-primary/10 ring-1 ring-primary`)
  - **Células com múltiplas tarefas:** stack vertical de badges/chips com título truncado e cor por status
  - **Container:** overflow-x + overflow-y scroll, altura máxima definida para caber na viewport sem scroll da página
  - **Responsive:** em mobile, colunas de usuário menores (só avatar + patente abreviada)

- Ordenação de patentes para colunas (do mais alto ao mais baixo):
  `Cel > TCel > Maj > Cap > Ten > SUB > 1SGT > 2SGT > 3SGT > CB > SD`

**Arquivos afetados:**
- `app/(app)/matriz/page.tsx` *(novo)*
- `components/features/MatrizView.tsx` *(novo)*
- `lib/utils/patente.ts` *(ordem hierárquica para sort)*

**Critério de aceite:**
- Grid renderiza corretamente com header e coluna de datas frozen
- Dia corrente destacado e visível no centro do scroll inicial
- Múltiplas tarefas na mesma célula são exibidas
- `pnpm typecheck` e `pnpm lint` passam

---

### [Story 12.4] Navegação — Reordenação e inclusão da Matriz

**Objetivo:** Ajustar `NAV_ITEMS` em `AppShell.tsx` para a ordem correta e incluir a nova aba Matriz.

**Ordem final das abas:**
1. Dashboard → `/dashboard`
2. Kanban → `/kanban`
3. Matriz → `/matriz`
4. Usuários → `/admin` *(admin only)*

**Escopo técnico:**
- `components/features/AppShell.tsx` linhas 23–42:
  - Reordenar array `NAV_ITEMS`
  - Adicionar entrada `{ label: 'Matriz', href: '/matriz', icon: <TableCells...> }`
  - Ícone sugerido: `TableCellsIcon` do Heroicons ou equivalente já importado no projeto

**Arquivos afetados:**
- `components/features/AppShell.tsx`

**Critério de aceite:**
- Abas aparecem na ordem: Dashboard, Kanban, Matriz, Usuários
- Link Matriz ativo no estado correto
- Navegação mobile reflete a mesma ordem

---

### [Story 12.5] Dashboard — Métricas DT vs DA

**Objetivo:** Adicionar painel de distribuição por divisão ao Dashboard.

**Escopo técnico:**
- `app/(app)/dashboard/page.tsx`:
  - Adicionar query para `tasks` agrupado por `sector`, filtrando `status IN ('alocada', 'finalizada')`
  - Computar: `{ DT: { alocadas, finalizadas }, DA: { alocadas, finalizadas }, total }`
  - Passar `sectorStats` ao `DashboardView`

- `components/features/DashboardView.tsx`:
  - Novo card **"Distribuição por Divisão"** abaixo dos KPI cards de status existentes
  - Layout: dois blocos lado a lado (DT | DA)
  - Cada bloco exibe:
    - Sigla da divisão em destaque
    - Contagem de tarefas alocadas + concluídas
    - Barra de progresso (% em relação ao total geral)
    - Ex.: `DT — 80% (40 tarefas)` / `DA — 20% (10 tarefas)`
  - Se total = 0: exibir estado vazio gracioso

**Arquivos afetados:**
- `app/(app)/dashboard/page.tsx`
- `components/features/DashboardView.tsx`

**Critério de aceite:**
- Card renderiza com dados reais de DT e DA
- Percentuais somam 100% (ou 0/0 no estado vazio)
- Responsivo (stacks em coluna no mobile)

---

## Dependências entre Stories

```
12.1 (migration + domínio)
  └─► 12.2 (UI patente — depende do tipo e helper de 12.1)
  └─► 12.3 (Matriz — usa patente no header de coluna)

12.3 (componente Matriz)
  └─► 12.4 (nav — depende da rota existir)

12.5 — independente, pode rodar em paralelo com 12.1–12.4
```

## Ordem de execução sugerida

1. **12.1** → 2. **12.2 + 12.5** (paralelo) → 3. **12.3** → 4. **12.4**

---

## Estimativa de esforço

| Story | Complexidade | Justificativa |
|-------|-------------|---------------|
| 12.1 | Baixa | Só migration + tipo + helper |
| 12.2 | Média | Múltiplos componentes, mas mudança cirúrgica |
| 12.3 | Alta | Componente novo com lógica de grid + sticky + dates |
| 12.4 | Baixa | Edição pontual em `NAV_ITEMS` |
| 12.5 | Média | Query nova + componente de card DT/DA |

---

## Status da Sprint

- **Início:** 18/05/2026
- **Status Atual:** **PLANEJADA**
- **Riscos:**
  - Story 12.3 (Matriz): CSS `sticky` com scroll duplo (X+Y) pode ter comportamento inconsistente entre browsers — testar em Chrome e Firefox.
  - Story 12.2: muitos pontos de exibição de nome; usar `pnpm typecheck` para garantir cobertura total após adicionar `patente` ao tipo `Profile`.
  - Story 12.1: migration de enum no Postgres exige ordem específica (`CREATE TYPE` antes de `ALTER TABLE`) — atenção à migration sequencial.
