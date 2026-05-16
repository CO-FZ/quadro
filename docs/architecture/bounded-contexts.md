# Bounded Contexts — Quadro CO-FZ

**Sprint:** 08 — Architecture Foundation
**Gate G1:** revisão e aprovação humana deste mapeamento antes de mover código.

---

## Contextos atuais

### Identity & Access

**Status:** atual — implementado
**Responsabilidade:** autenticação, perfis, roles, whitelist, RLS, autorização
**Entidades principais:** `User`, `Profile`, `Role`, `WhitelistEntry`
**Eventos candidatos:** `UserSignedUp`, `RoleAssigned`, `UserArchived`, `WhitelistEntryAdded`
**Integrações:** Supabase Auth (Google OAuth), trigger `handle_new_user`, trigger `check_whitelist`
**Fronteiras:** não conhece tarefas nem relatórios; expõe `requireRole()` como porta pública
**Arquivos hoje:** `lib/auth/`, `lib/actions/admin.ts` (parcial), `supabase/migrations/*_whitelist*`, `supabase/migrations/*_audit*`

---

### Task Board

**Status:** atual — implementado
**Responsabilidade:** tarefas, status, responsáveis, movimentação Kanban, regras de transição
**Entidades principais:** `Task`, `TaskAssignee`, `TaskStatus`
**Regras de domínio:** só admin/coordenador finalizam; arquivada é terminal; `isOverdue` lógica pura
**Eventos candidatos:** `TaskCreated`, `TaskMoved`, `TaskFinalized`, `TaskArchived`, `TaskDeleted`
**Integrações:** Google Sheets sync via evento (Integrations context)
**Fronteiras:** conhece identidade apenas via `UserId` — não importa `Profile` completo
**Arquivos hoje:** `lib/actions/tasks.ts`, `app/(app)/kanban/`, `components/features/KanbanBoard*`

---

### Reporting

**Status:** atual — implementado
**Responsabilidade:** dashboard, estatísticas agregadas, métricas por membro e status
**Entidades principais:** `UserTaskStats` (view), `TaskSummary`
**Eventos candidatos:** nenhum — somente leitura
**Integrações:** consulta direta a `user_task_stats` (view Supabase)
**Fronteiras:** somente leitura; não gera mutações
**Arquivos hoje:** `app/(app)/dashboard/`, view `user_task_stats` em migrations

---

### Administration

**Status:** atual — implementado
**Responsabilidade:** gestão de usuários, mudança de roles, arquivamento, audit log, bulk whitelist
**Entidades principais:** `Profile`, `WhitelistEntry`, `PrivilegedRoleAuditEntry`
**Regras:** last-admin guard; arquivar remove de assignee selector
**Eventos candidatos:** `UserRoleChanged`, `UserArchived`, `UserRestored`, `WhitelistBulkAdded`
**Integrações:** chama Identity & Access para verificar whitelist
**Fronteiras:** opera sobre usuários, não sobre tarefas diretamente
**Arquivos hoje:** `lib/actions/admin.ts`, `app/(app)/admin/`, `lib/i18n/` (parcial)

---

### Integrations

**Status:** atual — implementado
**Responsabilidade:** sincronização com providers externos (Google Sheets hoje; futuros providers)
**Entidades principais:** `SyncJob`, `SheetRow`
**Regras:** INSERT/UPDATE/DELETE em `tasks` dispara webhook → Edge Function → Sheets API
**Eventos candidatos:** `TaskSynced`, `SyncFailed`
**Integrações:** Supabase `pg_net.http_post`, Google Sheets API v4, Service Account
**Débito:** URL/anon-key hardcoded em migration; sem retry; sem dead-letter
**Arquivos hoje:** `supabase/functions/sync-sheets/`, migration `20260507000005`

---

## Contextos futuros

### Workspace *(futuro)*

Multi-board, multi-time. Agrupa contextos atuais sob um tenant. Pré-condição para multi-tenancy.

### Collaboration *(futuro)*

Presença em tempo real, cursores compartilhados, resolução de conflitos, broadcast Supabase Realtime.
Ver [realtime.md](realtime.md).

### Asset *(futuro)*

Anexos, arquivos, storage e metadados associados a tarefas ou usuários.

### AI *(futuro)*

Embeddings, automações, agentes e semantic search sobre tarefas e histórico.
Módulo `src/modules/ai` — desacoplado do core.

---

## Mapa de dependências

```text
Task Board ──uses──▶ Identity & Access (userId)
Task Board ──fires──▶ Integrations (TaskSynced)
Reporting  ──reads──▶ Task Board (view)
Administration ──manages──▶ Identity & Access (profiles, whitelist)
```

Contextos futuros não dependem de contextos atuais no core — entrarão como módulos separados.
