---
sprint: 18
title: Histórico de Tarefas — Busca e Paginação
status: concluida
inicio: 2026-05-21
conclusao: 2026-05-21
objetivo: Adicionar uma nova aba de "Histórico" (entre Kanban e Matriz) que liste as tarefas finalizadas e arquivadas com paginação e busca textual.
---

# Sprint 18 — Histórico de Tarefas

- **Status:** CONCLUÍDA
- **Início:** 21/05/2026
- **Conclusão:** 21/05/2026
- **Objetivo:** Adicionar uma nova aba de "Histórico" (entre Kanban e Matriz) que liste as tarefas finalizadas e arquivadas com paginação e busca textual.

---

## Motivação

Atualmente, tarefas finalizadas são exibidas nas colunas do Kanban e na Matriz, enquanto tarefas arquivadas só são visíveis no Kanban através de um painel expansível no rodapé. À medida que o número de tarefas cresce, a ausência de uma visualização histórica dedicada com paginação e filtro textual dificulta a auditoria, consulta e o acompanhamento de atividades antigas. 

Esta sprint introduz a aba "Histórico" que consolida as tarefas nestes dois estados e disponibiliza recursos robustos de busca e paginação.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 18.1 | Aba de Histórico de Tarefas com Busca e Paginação | M | ✅ concluída | Alto |

---

## Dependências

- Sem novas dependências externas.
- Sem modificações no schema do banco de dados (reaproveita a tabela `tasks` e seus status `finalizada`/`arquivada`).

## Riscos

- **Desempenho da Consulta**: Pesquisa textual ampla com múltiplos filtros `OR` do Supabase usando `ilike` pode causar lentidão se a base de dados crescer muito. Recomendamos a criação de índices adequados para as colunas pesquisáveis (`title`, `description`) no futuro se necessário.
- **Paginação de Relacionamentos**: Ao realizar buscas textuais que cruzam para tabelas associadas (ex: perfis de responsáveis), o PostgREST do Supabase tem limitações para fazer filtros OR entre tabelas. A query deve ser otimizada para buscar por responsáveis de forma performática.

## Critérios de aceite

- [x] A aba "Histórico" está localizada entre "Kanban" e "Matriz" na barra de navegação principal (`AppShell`).
- [x] Apenas tarefas com status `finalizada` e `arquivada` são exibidas no Histórico.
- [x] A listagem é exibida em formato de tabela organizada por data de criação (`created_at`) em ordem decrescente (mais recente primeiro).
- [x] Limite estrito de 20 tarefas exibidas por página.
- [x] Navegação de páginas (Voltar/Avançar e números de página) localizada no canto inferior centralizado.
- [x] Caixa de pesquisa funcional que realiza busca em qualquer campo da tarefa (título, descrição, setor).
- [x] O filtro de busca é executado no servidor (Supabase) dinamicamente e atualiza a URL.

## Débitos técnicos registrados para próxima sprint

- Paginação renderiza todos os botões de página — sem janela deslizante. Risco de UI quebrada com >20 páginas.
- Busca por setor usa substring de string literal (`'dt'.includes(term)`) — ativar com termos curtos como 'd'. Baixo impacto no contexto atual.
