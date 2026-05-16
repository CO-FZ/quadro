# Story 10.1: Kanban & Dashboard Improvements

## Requisitos de Negócio
- O Kanban deve acrescentar uma raia de "Em revisão" entre as raias "Em desenvolvimento" e "Finalizadas".
- O Dashboard de Atividades deve mostrar o avatar do Google do usuário, em vez de apenas um ícone com a letra inicial.

## Tarefas Técnicas

### 1. Novo Status `em_revisao` no Kanban
- **Mapeamento:** `src/modules/task-board/domain/entities.ts`
  - Incluir `'em_revisao'` no union type `TaskStatus`.
  - Inserir na constante `KANBAN_COLUMNS` logo após `em_desenvolvimento`: `{ id: 'em_revisao', label: 'Em Revisão' }`.
- **UI:**
  - O componente `KanbanBoard.tsx` irá gerar automaticamente a nova raia através do mapeamento do `KANBAN_COLUMNS`. Verificar responsividade para assegurar que cabem as novas colunas sem quebrar o layout.
  - Atualizar chaves dependentes que usam o status `TaskStatus` estrito (ex: `STATUS_CONFIG` em `DashboardView.tsx`, map de labels no `ProfileView.tsx`).
- **Banco de Dados (Supabase):**
  - Escrever uma **Migration** para adicionar `'em_revisao'` no Enum do Postgres ou relaxar constraint (se aplicável), conforme definido na tabela de `tasks`.

### 2. Avatar de Usuário no Dashboard
- **Backend (Supabase / RPC):**
  - Atualizar a procedure ou a query SQL que computa os dados do Dashboard (ex: em `UserTaskStats`) para também realizar join (ou incluir no select, dependendo do design) o campo `avatar_url` provindo da tabela `profiles`.
- **Mapeamento de Tipos:**
  - No `lib/supabase/types.ts` ou na definição principal (`entities.ts`), modificar a interface `UserTaskStats` para adicionar `avatar_url: string | null`.
- **Frontend (`DashboardView.tsx`):**
  - Substituir a caixa com a inicial do usuário por uma tag `<img>` ou `<Image>` nativa que aponte para `s.avatar_url`.
  - Manter o fallback atual (a letra inicial num círculo) se `s.avatar_url` for `null` ou inválido.

## Dependências
- Nenhuma dependência externa. Requer conhecimento sobre a query atual do Dashboard e acesso à geração de migrations do Supabase local (`pnpm supabase migration new ...`).

## Critérios de Aceite
- [ ] A tela de Kanban possui uma coluna "Em Revisão" após "Em Desenvolvimento".
- [ ] Cartões de tarefa podem ser arrastados livremente para a nova coluna.
- [ ] As tarefas que caem na coluna de revisão salvam o status adequadamente no banco.
- [ ] O Dashboard de métricas engloba corretamente os dados do novo status, se a visualização for dividida por status de tarefa.
- [ ] A tabela no Dashboard de Atividades exibe o avatar correto associado à conta do Google para os usuários.
