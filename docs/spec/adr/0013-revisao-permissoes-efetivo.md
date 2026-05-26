# ADR 0013 — Revisão do Modelo de Permissões: Acesso Universal com Restrição Seletiva

**Data:** 2026-05-26  
**Status:** Aceito  
**Gatilho:** Falha de teste humano detectada em 2026-05-26

---

## Contexto

Teste humano identificou que o perfil `efetivo` não conseguia:
- Ver tarefas dos demais membros no dashboard e kanban
- Ver fotos/avatars dos outros membros
- Alocar membros em tarefas
- Editar detalhes de tarefas

O modelo anterior assumia uma hierarquia rígida `efetivo < coordenador < admin` para todas as operações de gestão de tarefas. Na prática, a equipe opera de forma colaborativa e qualquer membro deve poder gerir o quadro de atividades — com exceção de ações destrutivas (finalizar, arquivar, deletar) e gestão de usuários.

---

## Decisão

### O que muda

| Área | Antes | Depois |
|------|-------|--------|
| RLS `profiles` SELECT | Apenas próprio perfil | Todos os perfis ativos para qualquer autenticado |
| RLS `task_assignees` INSERT/UPDATE/DELETE | Apenas admin/coordenador | Qualquer autenticado |
| RLS `tasks` UPDATE | admin/coordenador ou assignee | Qualquer autenticado |
| `updateTask()` use-case | Requer privileged | Qualquer autenticado |
| `updateTaskAssignees()` use-case | Requer privileged | Qualquer autenticado |
| UI `canManage` | Boolean único (admin/coordenador) | Três flags: `canEdit`, `canAssign`, `canFinalize` |

### O que não muda

- `updateTaskStatus()` para `finalizada`/`arquivada`: restrição a admin/coordenador mantida
- `archiveTask()` e `deleteTask()`: restrição a admin/coordenador mantida
- Página `/admin` (gestão de usuários): restrita a admin
- Link "Usuários" no AppShell: visível apenas para admin

---

## Alternativas rejeitadas

**Criar role intermediário** (ex.: `membro_ativo`) entre efetivo e coordenador: adicionaria complexidade sem benefício real — a distinção relevante é apenas "pode finalizar/arquivar" vs "não pode".

**Manter hierarquia e adicionar UI de solicitação** (efetivo pede permissão para coordenador aprovar): overhead operacional desnecessário para uma equipe pequena.

---

## Consequências

**Positivas:**
- Qualquer membro pode gerir o board sem dependência de admin/coordenador para edições do dia a dia
- Fotos e identidade dos membros visíveis em toda a interface
- Ranking no dashboard visível para todos

**Riscos:**
- Efetivo pode editar detalhes de qualquer tarefa, incluindo tarefas criadas por outros — aceito pelo time
- RLS `tasks UPDATE` aberta para todos autenticados — mitigado pela camada de aplicação que mantém restrições para ações destrutivas

---

## ADRs relacionados

- ADR 0001: RBAC via Supabase RLS — políticas de `profiles` e `task_assignees` evoluem
- ADR 0003: Defesa em Camadas — camada use-cases perde guards de `updateTask`/`updateTaskAssignees`; camada RLS ainda restringe ações destrutivas
- ADR 0009: Centralização Guards — `requirePrivileged` removido de dois use-cases
