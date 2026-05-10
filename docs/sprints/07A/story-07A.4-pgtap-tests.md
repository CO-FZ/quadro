# Story 07A.4: pgTAP — triggers e schema

**Sprint:** 07-A — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0005 — Estratégia de testes](../../spec/adr/0005-estrategia-de-testes.md), [ADR 0001 — RBAC via RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [ADR 0002 — Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito explícito de [Sprint 04 §7](../../memory/sprints/04/_summary.md): "Sem teste automatizado para trigger Postgres `handle_new_user`. Considerar adicionar pgTAP em sprint dedicada."

---

## 1. Visão Geral

Estabelecer a **Camada 4** da estratégia (ADR 0005): testes pgTAP cobrindo triggers Postgres e constraints de schema em **isolamento da unidade SQL**. Complementa a Story 07A.2 (que exercita os triggers indiretamente via auth.signUp ponta-a-ponta) com cobertura precisa de cada caminho de execução do PL/pgSQL.

## 2. Requisitos de Negócio (Regras)

Triggers a cobrir:

- **`check_whitelist()` em `auth.users`** ([migration 20260506000000](../../../supabase/migrations/20260506000000_user_management.sql)):
  - Email exato na whitelist → permite INSERT.
  - Domínio na whitelist → permite INSERT.
  - Nada na whitelist → `RAISE EXCEPTION 'Acesso negado: ...'`.
  - Whitelist vazia → bloqueia 100% (decisão deliberada do ADR 0002 §"Consequências positivas").
  - Email com case diferente (`Foo@X.COM` vs `foo@x.com`) — **documentar** comportamento atual: trigger faz match case-insensitive? Se sim, validar; se não, registrar como gap.

- **`handle_new_user()` em `auth.users`** ([migration 20260507000002](../../../supabase/migrations/20260507000002_whitelist_default_role.sql)):
  - Email com match exato → cria profile com `default_role` da entry.
  - Sem match exato, com match de domínio → usa `default_role` da entry de domínio.
  - Sem match nenhum (cenário só possível se `check_whitelist` falhar primeiro; mas se trigger order mudar, queremos detectar) → fallback `'efetivo'`.
  - Precedência email > domínio: email específico em conflito com regra de domínio prevalece.

- **`sync_google_metadata()` em `auth.users`** ([migration 20260507000000](../../../supabase/migrations/20260507000000_sync_google_metadata.sql)):
  - INSERT com `raw_user_meta_data` populado → `profiles.full_name` e `avatar_url` recebem valores.
  - UPDATE de `raw_user_meta_data` → propaga para `profiles`.
  - `raw_user_meta_data` sem `full_name` → `profiles.full_name` permanece como fallback (`split_part(email, '@', 1)` ou similar — verificar implementação).

- **`handle_updated_at()` em tabelas com `updated_at`** ([migration 20260506000000](../../../supabase/migrations/20260506000000_user_management.sql)):
  - INSERT → `updated_at = created_at` (NOT triggered em INSERT, só em UPDATE? Ler migration).
  - UPDATE qualquer coluna → `updated_at` muda para `now()`.
  - UPDATE sem mudar nada (`SET col = col`) → `updated_at` muda? Comportamento padrão do trigger: não distingue.

Constraints/enums a cobrir:

- `task_status` enum aceita só `'backlog','alocada','em_desenvolvimento','finalizada','arquivada'`. Tentar INSERT com `'foobar'` falha.
- `task_sector` enum aceita só `'DT','DA'`.
- `app_role` enum aceita só `'admin','coordenador','efetivo'`.
- `whitelist.identifier` UNIQUE — INSERT duplicado falha.
- CASCADE de `auth.users → profiles` — `DELETE FROM auth.users WHERE id = X` remove `profiles.id = X`.
- `tasks.created_by ON DELETE SET NULL` — `DELETE FROM profiles` deixa `tasks.created_by = NULL`, não cascateia exclusão.

## 3. Requisitos técnicos

- **pgTAP:** já incluído na imagem default do Supabase Postgres. Não precisa instalar — só `CREATE EXTENSION IF NOT EXISTS pgtap;` em `supabase/seed.sql` (test-only) ou no início de cada arquivo de teste.
- **Runner:** `supabase test db` lê arquivos `.sql` em `supabase/tests/` e executa cada um em transação isolada. Cada arquivo começa com `BEGIN; SELECT plan(N);` e termina com `SELECT * FROM finish(); ROLLBACK;`.
- **Estrutura:**
  ```
  supabase/
    tests/
      triggers/
        check_whitelist.sql
        handle_new_user.sql
        sync_google_metadata.sql
        handle_updated_at.sql
      schema/
        enums.sql
        constraints.sql
        cascades.sql
  ```
- **Scripts no `package.json`:**
  - `"test:db": "supabase test db"`
- **CI:** mesmo job de integration (Story 07A.2) já sobe Supabase local; rodar `pnpm test:db` em sequência.

## 4. Critérios de Aceite

### CA-01 — Setup pgTAP

- **Given** Supabase local rodando com migrations aplicadas
- **When** `pnpm test:db` é executado
- **Then** runner descobre arquivos em `supabase/tests/`, executa cada um, mostra resumo `ok` por teste. Saída TAP padrão.

### CA-02 — `check_whitelist`: email exato

- **Given** whitelist contém `'allowed@x.com'`
- **When** `INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'allowed@x.com');`
- **Then** sucesso (sem exceção). Linha persiste antes do ROLLBACK.

### CA-03 — `check_whitelist`: domínio

- **Given** whitelist contém `'@cofz.gov.br'`
- **When** INSERT com email `'qualquer@cofz.gov.br'`
- **Then** sucesso.

### CA-04 — `check_whitelist`: rejeita

- **Given** whitelist sem entries que batam com `'intruso@evil.com'`
- **When** INSERT com esse email
- **Then** `throws_ok` com mensagem matching `'Acesso negado'`. Sem linha persistida.

### CA-05 — `check_whitelist`: whitelist vazia bloqueia tudo

- **Given** `TRUNCATE whitelist;`
- **When** qualquer INSERT em `auth.users`
- **Then** `throws_ok`.

### CA-06 — `handle_new_user`: email exato pega role

- **Given** whitelist com `('foo@x.com', 'coordenador')`
- **When** INSERT em `auth.users` com email `'foo@x.com'`
- **Then** `is(SELECT role FROM profiles WHERE email='foo@x.com', 'coordenador')`.

### CA-07 — `handle_new_user`: domínio pega role

- **Given** whitelist com `('@x.com', 'efetivo')`
- **When** INSERT com email `'novo@x.com'`
- **Then** `is(SELECT role FROM profiles WHERE email='novo@x.com', 'efetivo')`.

### CA-08 — `handle_new_user`: precedência email > domínio

- **Given** whitelist com `('@x.com', 'efetivo')` **e** `('chefe@x.com', 'admin')`
- **When** INSERT com email `'chefe@x.com'`
- **Then** `is(SELECT role FROM profiles WHERE email='chefe@x.com', 'admin')`. E user `'outro@x.com'` ganha `'efetivo'`.

### CA-09 — `handle_new_user`: fallback efetivo

- **Given** condição artificial: trigger `check_whitelist` desabilitado temporariamente (`ALTER TABLE auth.users DISABLE TRIGGER check_whitelist`), whitelist vazia
- **When** INSERT em `auth.users`
- **Then** profile criado com `role = 'efetivo'` (fallback do `handle_new_user`). Reabilitar trigger ao final.

### CA-10 — `sync_google_metadata`: INSERT com metadata

- **Given** INSERT com `raw_user_meta_data = '{"full_name": "Foo Bar", "avatar_url": "https://..."}'::jsonb`
- **When** trigger executa
- **Then** profile tem `full_name = 'Foo Bar'`, `avatar_url = 'https://...'`.

### CA-11 — `sync_google_metadata`: UPDATE propaga

- **Given** profile já existente
- **When** `UPDATE auth.users SET raw_user_meta_data = '{"full_name": "Novo Nome"}'::jsonb WHERE id = X`
- **Then** `is(SELECT full_name FROM profiles WHERE id=X, 'Novo Nome')`.

### CA-12 — `handle_updated_at` em UPDATE

- **Given** task com `updated_at = T0`
- **When** `UPDATE tasks SET title = 'Novo' WHERE id = X` (com `pg_sleep(0.01)`)
- **Then** `is(SELECT updated_at > T0 FROM tasks WHERE id=X, true)`.

### CA-13 — Enums rejeitam valores inválidos

- **Given** task válida
- **When** `UPDATE tasks SET status = 'invalido'`
- **Then** `throws_ok` com SQLSTATE `22P02` (invalid input value for enum).

### CA-14 — `whitelist.identifier` UNIQUE

- **Given** whitelist com `('foo@x.com', 'efetivo')`
- **When** INSERT mesmo identifier
- **Then** `throws_ok` com SQLSTATE `23505` (unique violation).

### CA-15 — CASCADE auth.users → profiles

- **Given** profile com `id = X`
- **When** `DELETE FROM auth.users WHERE id = X`
- **Then** `is(SELECT count(*) FROM profiles WHERE id=X, 0)`.

### CA-16 — `tasks.created_by ON DELETE SET NULL`

- **Given** task com `created_by = userA`
- **When** `DELETE FROM profiles WHERE id = userA` (admin via fixture)
- **Then** task ainda existe; `is(SELECT created_by FROM tasks WHERE id=Y, NULL)`.

## 5. Modelagem de Dados

Nenhuma alteração em schema de produção. Apenas:

- Adicionar arquivos em `supabase/tests/` (não fazem deploy).
- Verificar se `supabase/config.toml` lista pasta `tests` correta para `supabase test db` encontrar.

## 6. Escopo negativo

- ❌ Coverage report de pgTAP — pgTAP não tem nativamente; rastrear cobertura de trigger via inspeção visual da matriz de CAs acima.
- ❌ Testar policies RLS em pgTAP — RLS é cobertura de Story 07A.2 (Vitest integration com clients reais) porque pgTAP não simula `auth.uid()` adequadamente. Documentar a divisão em `tests/README.md`.
- ❌ Performance de queries / `EXPLAIN ANALYZE`.
- ❌ Mutações em produção — sempre usar `BEGIN/ROLLBACK` em cada arquivo.

## 7. Dependências

- Story 07A.2 (Supabase local rodando, fixtures de personas).
- Story 07A.1 (script `pnpm test:db` adicionado ao `package.json` no mesmo PR de scripts).
- Migrations sincronizadas com remoto (verificar com `supabase migration list`).
