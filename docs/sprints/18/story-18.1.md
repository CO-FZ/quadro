---
id: 18.1
sprint: 18
title: Aba de Histórico de Tarefas com Busca e Paginação
status: concluida
size: M
tipo: feature
depends_on: []
---

# Story 18.1 — Aba de Histórico de Tarefas

## Problema

Não há atualmente uma forma centralizada de buscar ou filtrar tarefas que já saíram do fluxo de trabalho ativo (tarefas em status `finalizada` ou `arquivada`). A tabela e a matriz de atividades focam em tarefas ativas. Além disso, não há suporte a paginação para tarefas antigas, o que sobrecarregaria o carregamento conforme o histórico aumentasse.

## Solução

Criar uma nova aba "/historico" e implementar os seguintes componentes:

1. **Item de Navegação**:
   Inserção no array `NAV_ITEMS` de `components/features/AppShell.tsx` entre `Kanban` e `Matriz`.
   Link: `/historico`, Label: `Histórico`.

2. **RSC Page (`app/(app)/historico/page.tsx`)**:
   - Lê os query parameters `q` (termo de busca) e `page` (número da página).
   - Realiza consulta via Supabase para tarefas finalizadas e arquivadas.
   - Aplica paginação: `limit = 20`, `offset = (page - 1) * 20`.
   - Ordena por `created_at` em ordem decrescente (mais recente primeiro).
   - Filtra dinamicamente no Supabase com `.or(...)` nos campos textuais da tarefa (título, descrição, setor).

3. **Loading Skeleton (`app/(app)/historico/loading.tsx`)**:
   - Cria um esqueleto de tabela simulando as linhas de tarefas para exibição instantânea.

4. **Client View (`components/features/HistoricoView.tsx`)**:
   - Renderiza a caixa de busca com debounce (evitando requisições excessivas).
   - Mostra a tabela contendo:
     - Título
     - Setor (DT / DA)
     - Status (Finalizada / Arquivada, representados por Badges com cores adequadas)
     - Data de Término
     - Responsáveis (exibindo avatares e nomes/guerra)
   - Adiciona um seletor de paginação centralizado na parte inferior da página.

## Arquivos Envolvidos

- `components/features/AppShell.tsx` (modificação)
- `app/(app)/historico/page.tsx` (novo)
- `app/(app)/historico/loading.tsx` (novo)
- `components/features/HistoricoView.tsx` (novo)

## Critérios de aceite

- [x] A aba "Histórico" aparece na ordem correta na navegação principal.
- [x] Listagem paginada correta (20 itens por página).
- [x] Ordenação decrescente por data (mais recentes no topo).
- [x] Filtro textual de busca abrangendo título, descrição e setor no banco de dados.
- [x] A busca é reativa e atualiza a URL, preservando o estado no navegador.
- [x] Exibe os avatares dos responsáveis atribuídos a cada tarefa.
- [x] Estilização premium e compatível com temas Light/Dark do projeto.
