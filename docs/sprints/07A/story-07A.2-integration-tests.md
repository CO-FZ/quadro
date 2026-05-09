# Story 07A.2: Integration tests (Vitest + Supabase local)

**Sprint:** 07-A — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md), [ADR 0001 — RBAC via RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0003 — Defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito de "Smoke anti-spoofing" registrado em [Sprint 03 §2](../../memory/sprints/03/_summary.md), débito de "Server Actions sem teste" em [Sprint 02 §2](../../memory/sprints/02/_summary.md).

---

## 1. Visão Geral

Estabelecer a **Camada 2** da estratégia (ADR 0005): Vitest + Supabase local cobrindo RLS por persona e Server Actions ponta-a-ponta. Esta é a camada que paga a maior parte do risco — confirma que [ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md) e [ADR 0003](../../spec/adr/0003-defesa-em-camadas-tasks.md) estão de fato implementados e que regressão futura será detectada em CI.

Cada teste sobe contra uma instância local do Supabase (`supabase start`), cria 3 perfis seed (admin, coordenador, efetivo) via admin SDK, gera 3 anon clients com session JWT real para cada persona, e exercita CRUD direto na PostgREST + Server Actions.

## 2. Requisitos de Negócio (Regras)

- **Spoofing.** ADR 0003 §B garante `WITH CHECK (created_by = auth.uid())` em INSERT de `tasks` e `WITH CHECK (user_id = auth.uid())` em INSERT de `task_assignees`. Provar que ambos bloqueiam tentativas com UUID de outro user.
- **Defesa em camadas.** Server Actions destrutivas (`updateTask`, `archiveTask`, `deleteTask`, `updateTaskAssignees`) devem retornar `{ ok: false, code: 'FORBIDDEN' }` para efetivo **antes de tocar o banco** (`requireRole`). Isso é distinto da policy RLS que também bloqueia — o teste prova que o gate da aplicação dispara primeiro.
- **`updateTaskStatus` condicional.** Status `'finalizada'` exige role admin/coord; demais transições são livres para assignee.
- **Last-admin guard.** `updateUserRole` rejeita rebaixar único admin com `code: 'LAST_ADMIN'`.
- **Whitelist trigger.** Signup com email não-whitelisted falha; com email exato pega `default_role`; com domínio pega `default_role` da entry de domínio. Precedência email > domínio confirmada.
- **`created_by` imutável.** `updateTask` não permite alterar `created_by` (testar via tentativa direta REST).

## 3. Requisitos técnicos

- **Pré-requisito local:** Docker + Supabase CLI. Documentar em `tests/README.md`.
- **Setup:** Vitest com `globalSetup` que executa:
  1. `supabase start` (idempotente — se já rodando, no-op).
  2. `supabase db reset --no-seed --local` para zerar.
  3. Aplicar migrations (já é o que `db reset` faz).
  4. Seed via `tests/integration/fixtures/seed.ts` cria 3 usuários no `auth.users` via `supabase.auth.admin.createUser`, depois UPDATE em `profiles` para setar `role`.
- **Isolamento entre testes:** cada `describe` recebe um `testContext` com IDs únicos (UUID por execução de suite); `afterEach` limpa rows criados naquele teste via `cleanup(taskIds)`. **Não** usar `BEGIN/ROLLBACK` no client porque o admin SDK mantém pool — usar TRUNCATE seletivo ou cleanup por ID.
- **Clients:**
  - `adminClient` — service_role key, bypassa RLS. Usado só em fixtures.
  - `personaClient(role)` — gera novo client com session JWT da persona via `signInWithPassword` (3 contas seed com senhas conhecidas).
  - **Importante:** `cache()` do React em `requireRole` não funciona fora de request scope. Server Actions chamadas em teste exigem wrapper que zera o cache entre chamadas. Implementar em `tests/integration/fixtures/server-action.ts`.
- **Estrutura:**
  ```
  tests/
    integration/
      fixtures/
        supabase.ts          ← createPersonaClient(role)
        seed.ts              ← seedPersonas() retorna {admin, coord, efetivo, anon}
        cleanup.ts           ← cleanup({taskIds, userIds})
        server-action.ts     ← runAction(persona, action, ...args) com cache reset
      rls/
        tasks.rls.test.ts
        task_assignees.rls.test.ts
        profiles.rls.test.ts
        whitelist.rls.test.ts
      actions/
        tasks.actions.test.ts
        admin.actions.test.ts
      triggers/
        handle_new_user.test.ts   ← cobre via auth.signUp; pgTAP cobre em isolamento (Story 07A.4)
    integration.config.ts          ← Vitest config separada com timeout maior
  ```
- **Scripts:**
  - `"test:integration": "vitest run -c tests/integration.config.ts"`
  - `"test:integration:watch": "vitest -c tests/integration.config.ts"`

## 4. Critérios de Aceite

### CA-01 — Setup e fixtures de persona

- **Given** Supabase local rodando
- **When** `pnpm test:integration` é executado
- **Then** `globalSetup` cria 3 usuários (admin, coord, efetivo) com senhas determinísticas e perfis com role correspondente. Cada teste pode obter `personaClient('admin')` e fazer queries autenticadas. `afterAll` limpa.

### CA-02 — RLS de `tasks` × 4 personas × 4 operações

- **Given** persona `admin/coord/efetivo/anon`
- **When** cada uma tenta SELECT/INSERT/UPDATE/DELETE em `tasks` (com fixtures que põem cada persona como assignee em alguns rows e não em outros)
- **Then** matriz de aceitação corresponde ao [ADR 0003 §"Mapa final de policies"](../../spec/adr/0003-defesa-em-camadas-tasks.md):
  - SELECT: admin/coord/efetivo ok; anon erro.
  - INSERT: admin/coord/efetivo ok com `created_by = self`; spoofing (`created_by = outro`) erro RLS para qualquer persona; anon erro.
  - UPDATE metadados: admin/coord ok; efetivo ok **se assignee**, erro se não assignee; anon erro.
  - DELETE: admin/coord ok; efetivo erro; anon erro.

### CA-03 — RLS de `task_assignees`

- **Given** persona logada
- **When** tenta INSERT em `task_assignees`
- **Then** admin/coord ok para qualquer `user_id`; efetivo ok **só se** `user_id = self` (self-assign permitida pela ADR 0003 §B); efetivo com `user_id = outro` erro; anon erro. SELECT permitido para todos authenticated.

### CA-04 — RLS de `profiles`

- **Given** persona logada
- **When** SELECT/UPDATE em `profiles`
- **Then**: admin SELECT all ok; coord/efetivo SELECT só self ok (com row count = 1); admin UPDATE ok; coord/efetivo UPDATE erro RLS.

### CA-05 — RLS de `whitelist`

- **Given** persona logada
- **When** SELECT/INSERT/DELETE em `whitelist`
- **Then** admin ALL ok; coord/efetivo ALL erro; anon erro.

### CA-06 — `createTask` Server Action ponta-a-ponta

- **Given** efetivo autenticado
- **When** chama `createTask({title, sector, start_date, end_date, drive_url, description, assignee_ids: []})`
- **Then** retorna `{ ok: true }`. Linha em `tasks` com `created_by = efetivoId`, `status = 'backlog'` (sem assignees). Trim de title aplicado, description vazia salva como `null`.

### CA-07 — `createTask` com assignees

- **Given** efetivo cria task com `assignee_ids: [coordId, otherEfetivoId]`
- **When** action executa
- **Then** task criada com `status = 'alocada'`. Linhas em `task_assignees` para os dois IDs. Criador **não** é auto-assignee (ADR 0003 §C).

### CA-08 — Defesa em camadas: `updateTask` por efetivo

- **Given** efetivo autenticado, task existente
- **When** chama `updateTask(taskId, ...)`
- **Then** retorna `{ ok: false, code: 'FORBIDDEN' }`. **Verificar**: nenhuma row de `tasks` foi modificada — `updated_at` permanece igual. (Prova que o gate disparou antes do banco.)

### CA-09 — `updateTaskStatus` para `finalizada` por efetivo

- **Given** efetivo é assignee de task em `'em_desenvolvimento'`
- **When** chama `updateTaskStatus(taskId, 'finalizada')`
- **Then** retorna `{ ok: false, code: 'FORBIDDEN' }`. Status na tabela permanece `'em_desenvolvimento'`.

### CA-10 — `updateTaskStatus` para outros estados por efetivo

- **Given** efetivo é assignee de task
- **When** move entre `'backlog' → 'alocada' → 'em_desenvolvimento' → 'alocada'`
- **Then** todas retornam `{ ok: true }`. RLS aceita porque é assignee.

### CA-11 — Spoofing de `created_by`

- **Given** efetivo autenticado
- **When** tenta INSERT direto via REST com `created_by = adminId`
- **Then** RLS recusa (`row violates row-level security policy`). Confirma `WITH CHECK (created_by = auth.uid())`.

### CA-12 — `created_by` imutável

- **Given** task com `created_by = userA`
- **When** admin tenta UPDATE setando `created_by = userB`
- **Then** o UPDATE não persiste a alteração — a Server Action `updateTask` não inclui `created_by` no payload, e tentativa direta via REST com admin (que tem permissão de UPDATE) também não muda. Documentar que a única defesa hoje é "Server Action não envia esse campo" + "RLS ainda permite UPDATE via REST direto" — registrar como débito ⚠️ se necessário.

### CA-13 — `updateUserRole` last-admin guard

- **Given** banco com 1 admin e 1 coord
- **When** admin tenta `updateUserRole(adminId, 'efetivo')`
- **Then** retorna `{ ok: false, code: 'LAST_ADMIN' }`. Profile permanece com `role = 'admin'`.

### CA-14 — `addToWhitelist` bulk parsing

- **Given** admin envia `"a@x.com, b@x.com\nc@x.com; d@x.com"`
- **When** action processa
- **Then** retorna `{ ok: true, message: '4 adicionado(s) com sucesso.' }`. Tabela tem as 4 entries com `default_role = 'efetivo'` (default da action).

### CA-15 — `addToWhitelist` com duplicado

- **Given** whitelist já tem `existing@x.com`
- **When** admin envia `"existing@x.com, new@x.com"`
- **Then** retorna `{ ok: true, message: '1 adicionado(s) com sucesso, 1 ignorado(s) (já existiam).' }`. Tabela agora tem `new@x.com` adicional.

### CA-16 — `archiveUser` last-admin guard

- **Given** banco com 1 admin
- **When** admin tenta `archiveUser(adminId)`
- **Then** retorna `{ ok: false, code: 'LAST_ADMIN' }`.

### CA-17 — Trigger `handle_new_user` lookup precedência

- **Given** whitelist com entry de domínio `@cofz.gov.br` (role efetivo) **e** entry específica `chefe@cofz.gov.br` (role admin)
- **When** admin SDK cria user com email `chefe@cofz.gov.br`
- **Then** profile criado com `role = 'admin'` (precedência email > domínio). E user com email `outro@cofz.gov.br` ganha `role = 'efetivo'`. Pgtap cobre o trigger em isolamento (Story 07A.4); aqui valida-se via auth.signUp ponta-a-ponta.

### CA-18 — Trigger `check_whitelist` rejeita email não autorizado

- **Given** whitelist sem entry para `intruso@evil.com`
- **When** admin SDK chama `signUp` com esse email
- **Then** retorna erro com mensagem do trigger ("Acesso negado..."). Nenhuma row em `auth.users` ou `profiles` para esse email.

### CA-19 — Cobertura mínima da camada

- **Given** suite executada com `--coverage`
- **When** Vitest gera relatório
- **Then** `lib/actions/tasks.ts` ≥ 90% lines covered. `lib/actions/admin.ts` ≥ 90%. RLS de cada tabela tem ≥ 1 teste por operação por persona.

## 5. Modelagem de Dados

Nenhuma migration de produção. Pode ser necessário:

- Adicionar **migration de teste** (ou seed via `supabase/seed.sql`) com whitelist mínima para o `globalSetup` rodar `signUp` sem ser bloqueado pelo trigger. Padrão: seed de teste **separado** do seed de produção, em `tests/integration/fixtures/seed.sql` invocado via `psql` no `globalSetup`.
- Considerar adicionar coluna `metadata.test_marker` em rows criados pelos testes para facilitar cleanup. **Rejeitado** — usar `userId/taskId` retornados nas próprias asserts é mais limpo.

## 6. Escopo negativo

- ❌ Testar Edge Function `sync-sheets` em integration — fica para Sprint 07-B (precisa de mock de Google Sheets API, escopo separado).
- ❌ Testar UI / componentes React.
- ❌ Performance benchmarks (queries N+1, etc) — registrar como ticket separado se descoberto.
- ❌ Refactor das Server Actions se um teste expor bug — registrar como ticket de Sprint 07-B; **não consertar inline** (corrompe o sentido da DoD).
- ❌ pgTAP — Story 07A.4 dedicada.

## 7. Dependências

- Story 07A.1 (Vitest configurado, `tests/README.md` criado, refactor de validações).
- Supabase CLI ≥ 2.98 já em devDependencies. Docker disponível localmente.
- Migrations sincronizadas (verificar com `supabase migration list`).
- Senhas determinísticas das personas seed: armazenar em `tests/integration/fixtures/personas.ts` como constantes — **nunca usar como credencial real**, banco é efêmero.
