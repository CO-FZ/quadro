# Story 03: Hardening de Tasks (defesa em camadas + criação universal + UX)

**Sprint:** 03 — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0003 — defesa em camadas + criação universal](../../spec/adr/0003-defesa-em-camadas-tasks.md) (aceito 2026-05-07)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débitos rastreados em [docs/memory/sprints/02/_summary.md](../../memory/sprints/02/_summary.md) §2 + decisão de produto 2026-05-07 (criação universal + favicon CO-FZ).

---

## 1. Visão Geral

Esta story fecha a dívida transversal acumulada na Sprint 02 e implementa a decisão de produto de 2026-05-07:

1. **Criação universal de tarefas.** Qualquer authenticated cria tarefa via FAB. RLS de INSERT relaxada (ADR 0003 §B). Criador é auto-alocado como assignee inicial — pode adicionar/remover co-assignees no modal.
2. **Defesa em camadas para tasks destrutivas.** `requireRole(['admin','coordenador'])` em `updateTask`, `archiveTask`, `deleteTask`. `createTask` e `updateTaskStatus` ficam livres (RLS cobre).
3. **Regra única de "atrasada".** Lógica triplicada em `TaskCard`, `TaskDetailModal`, `ProfileView` centralizada em `lib/utils/task-status.ts`.
4. **Transição fluida do card no Kanban.** `useOptimistic` + `transition-all duration-200` com rollback em erro.
5. **Validação visual mobile** com browser subagent + screenshots.
6. **Favicon CO-FZ** via `app/icon.png` (convenção Next 16).

## 2. Requisitos de Negócio (Regras)

- **Criação:** qualquer authenticated cria tarefa. Não auto-aloca o criador — assignees são escolhidos livremente no modal (ou nenhum). `created_by` é imutável e registra quem criou inicialmente (histórico).
- **Status inicial:** `alocada` se há assignees no momento da criação, `backlog` caso contrário.
- **Edição/arquivamento/exclusão de task:** só `admin` ou `coordenador`. RLS cobre + `requireRole` em camadas.
- **Conclusão (status `finalizada`):** **só `admin` ou `coordenador`** podem mover uma tarefa para Finalizada. Demais transições de status (backlog ↔ alocada ↔ em_desenvolvimento) seguem livres para admin/coord/alocado via RLS.
- **Campos obrigatórios na criação:** título, setor (DT/DA), data início, data término. Drive URL e descrição opcionais.
- **"Atrasada"** = `status !== 'finalizada'` **E** `status !== 'arquivada'` **E** `end_date < hoje`.
- **Transição fluida:** ao mover card de coluna A → B, card aparece em B imediatamente. Em erro (incluindo efetivo tentando mover para Finalizada), card volta para A e Toast mostra mensagem.
- **Histórico:** o detalhe da tarefa exibe "Criada por &lt;nome&gt; em &lt;data&gt;".

## 3. Requisitos de UI/UX

- Drag-and-drop com transição visual de ≤150ms (alinhado a [docs/spec/01-design-system.md](../../spec/01-design-system.md)).
- Em erro de Server Action, Toast de erro + restauração automática do estado.
- Validação mobile: largura mínima testada 360px (Galaxy S8). Screenshot em `/kanban` e `/dashboard` em modo mobile.

## 4. Critérios de Aceite

### CA-01 — ADR 0003 aceito

- **Given** Sprint 03 iniciada
- **When** agente redige ADR 0003 cobrindo defesa em camadas + criação universal
- **Then** ADR em [docs/spec/adr/0003-defesa-em-camadas-tasks.md](../../spec/adr/0003-defesa-em-camadas-tasks.md) com status `aceito`. ✅

### CA-02 — Criação universal de tarefas

- **Given** usuário autenticado com qualquer role (`efetivo`, `coordenador`, `admin`)
- **When** clica no FAB "Nova Tarefa", preenche título/setor/data início/data término, escolhe (ou não) assignees, e salva
- **Then** tarefa é criada com `created_by = auth.uid()`. Status inicial = `alocada` se há assignees, `backlog` caso contrário. O criador **não é auto-alocado** — só entra como assignee se for explicitamente selecionado no modal. Spoofing de `created_by` via curl é bloqueado por `WITH CHECK`.

### CA-03 — Defesa em camadas em ações destrutivas e conclusão

- **Given** efetivo autenticado
- **When** chama `updateTask`/`archiveTask`/`deleteTask`/`updateTaskAssignees`, ou move card para coluna Finalizada
- **Then** retorna `{ ok: false, code: 'FORBIDDEN' }` **antes** de tocar o banco. `createTask` e demais transições de status continuam permitidos.

### CA-08 — Histórico de criação visível

- **Given** qualquer task com `created_by` preenchido
- **When** o usuário abre o `TaskDetailModal`
- **Then** vê "Criada por &lt;nome&gt;" com avatar do criador e data de criação.

### CA-04 — Helper único de "atrasada"

- **Given** task com `end_date` no passado
- **When** qualquer componente (`TaskCard`, `TaskDetailModal`, `ProfileView`) renderiza
- **Then** usa `isOverdue(task)` de `lib/utils/task-status.ts` — mesma regra em todos os pontos.

### CA-05 — Transição fluida do card

- **Given** usuário arrasta card da coluna A para B
- **When** Server Action `updateTaskStatus` é chamada
- **Then** card aparece em B **imediatamente** com transição CSS suave (≤ 200ms). Em erro, card volta para A e Toast mostra mensagem. Implementado via `useOptimistic`.

### CA-06 — Validação visual mobile

- **Given** browser subagent disponível
- **When** carrega `/kanban`, `/dashboard`, `/profile` em viewport 360x740
- **Then** screenshots anexados ao Final Artifact mostram layout legível sem overflow horizontal.

### CA-07 — Favicon CO-FZ

- **Given** assets em `public/CO-FZ.png`
- **When** o app é carregado em qualquer rota
- **Then** ícone CO-FZ aparece na tab do browser. Implementado via `app/icon.png` (convenção Next 16).

## 5. Modelagem de Dados

Esta story altera RLS via [migration 20260507000001](../../../supabase/migrations/20260507000001_relax_task_insert_policy.sql) — sem mudanças de tabela/coluna.

| Tabela | Operação | Policy nova |
|---|---|---|
| `tasks` | INSERT | `Authenticated cria a própria tarefa` — `WITH CHECK (created_by = auth.uid())` |
| `task_assignees` | INSERT | `Authenticated pode se auto-alocar` — `WITH CHECK (user_id = auth.uid())` (mantém policy admin/coord para ALL) |

## 6. Escopo negativo

- ❌ Suite de testes automatizada — sprint dedicada.
- ❌ Guard "último admin" — Sprint 04.
- ❌ Mapeamento detalhado RLS error → UI message — Sprint 04.
- ❌ Refactor de `lib/actions/admin.ts` (OK desde `f0d806e`).
- ❌ Mudança de tema/cores além do favicon.

## 7. Dependências

- ADR 0003 é bloqueante (passo 0) — ✅ aceito.
- Browser subagent precisa estar disponível para CA-06.
- Migration de RLS deve ser aplicada antes do smoke test de CA-02.
