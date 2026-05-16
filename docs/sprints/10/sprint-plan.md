# Sprint 10: Kanban & Dashboard Improvements

## Meta
Implementar uma nova coluna de "Em revisão" no Kanban, melhorando o fluxo de validação de tarefas, e atualizar o Dashboard para exibir o avatar de cada colaborador via Google Auth.

## Stories

1. **[Story 10.1] Melhorias de Fluxo e UI (Kanban e Dashboard)**
   - Adicionar o status `'em_revisao'` no modelo de dados (`TaskStatus`).
   - Atualizar construtores de UI (`KANBAN_COLUMNS`) e componentes de Kanban para refletir a nova raia entre "Em desenvolvimento" e "Finalizadas".
   - Criar migration de banco de dados para adaptar a constraint/ENUM da tabela de tarefas.
   - Atualizar a View ou RPC de estatísticas (`UserTaskStats`) no backend (Supabase) para incluir o `avatar_url` oriundo de `profiles`.
   - Ajustar o `DashboardView.tsx` para exibir a imagem do avatar caso exista, com fallback para a inicial.

## Status da Sprint
- **Início:** A definir
- **Status Atual:** **PLANEJADA**
- **Riscos Mitigados:** Alterações no domínio de tarefas exigem atualização em todos os arrays/objetos que mapeiam `TaskStatus` (como `STATUS_CONFIG` no dashboard, e labels no profile view). O TypeScript em strict mode (garantido pelo `pnpm typecheck`) cobrirá todas as ramificações.
