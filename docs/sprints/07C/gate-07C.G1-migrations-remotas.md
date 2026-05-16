# Gate G1 — Aplicar Migrations Remotas

**Sprint:** 07-C — ver [sprint-plan.md](sprint-plan.md)
**Owner:** humano (gate de deploy)
**Pré-condição:** acesso ao projeto Supabase remoto com permissão de `db push`.
**Pós-condição:** registrar output de `supabase db push` em `docs/memory/deploys/_summary.md`.

---

## O que está pendente

Duas migrations estão em `supabase/migrations/` mas **não foram aplicadas no ambiente remoto** (só existem localmente):

| Arquivo | Story | Status local | Status remoto |
|---------|-------|-------------|---------------|
| `20260510000000_check_whitelist_on_email_update.sql` | 07B.2 CA-05 | ✅ aplicado | ❌ pendente |
| `20260510000001_privileged_role_audit.sql` | 07B.3 | ✅ aplicado | ❌ pendente |

---

## Migration 1: `20260510000000_check_whitelist_on_email_update.sql`

### O que faz

Cria um trigger `on_auth_user_email_updated_whitelist_check` na tabela `auth.users` que dispara `BEFORE UPDATE OF email`.

**Lacuna coberta:** o trigger original `check_whitelist` só cobria `INSERT` (novo signup). Um usuário já autenticado poderia chamar `supabase.auth.updateUser({ email: 'fora@da.whitelist.com' })` — o GoTrue escreveria o novo email em `auth.users.email` após confirmação por email — **sem passar pela whitelist**.

### Código completo

```sql
DROP TRIGGER IF EXISTS on_auth_user_email_updated_whitelist_check ON auth.users;

CREATE TRIGGER on_auth_user_email_updated_whitelist_check
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.check_whitelist();
```

### Riscos e mitigações

| Risco | Análise |
|-------|---------|
| Bloqueia troca legítima de email | Esperado — é o comportamento correto. Um admin deve remover o email antigo da whitelist e adicionar o novo antes de permitir a troca. |
| Interfere com sync OAuth Google (Google atualiza email) | Baixo. O OAuth do Google usa o mesmo email da conta, não troca. Se o usuário mudar o email na conta Google, o GoTrue atualiza `auth.users` via `updateUser` — e o trigger vai checar a whitelist. Se o novo email não estiver na whitelist, a atualização é bloqueada. Documentar esse comportamento como conhecido. |
| Custo de performance | Zero — `check_whitelist()` já existe e é executada em INSERT. |

### Reversão

```sql
DROP TRIGGER IF EXISTS on_auth_user_email_updated_whitelist_check ON auth.users;
```

---

## Migration 2: `20260510000001_privileged_role_audit.sql`

### O que faz

1. **Cria tabela** `public.privileged_role_audit` (append-only):
   - `id` UUID PK
   - `profile_id` FK → `profiles.id` (CASCADE DELETE)
   - `email TEXT`
   - `role app_role` (enum: admin, coordenador, efetivo)
   - `source TEXT` — `'whitelist_email' | 'whitelist_domain' | 'manual'`
   - `whitelist_entry_id` FK → `whitelist.id` (SET NULL se entry removida)
   - `created_at TIMESTAMPTZ`

2. **RLS:** SELECT apenas admin. Nenhuma policy de escrita — só o trigger SECURITY DEFINER escreve.

3. **Reescreve `handle_new_user()`**: lógica de criação de profile **idêntica** à versão anterior. Acrescenta apenas:
   - Captura o `id` da entry de whitelist que fez match (`resolved_entry_id`).
   - Se `resolved_role IN ('admin', 'coordenador')`: INSERT best-effort na tabela de audit com `EXCEPTION WHEN OTHERS` — falha no INSERT nunca bloqueia o signup.

### Por que reescreve `handle_new_user` inteiro?

Postgres não suporta `ALTER FUNCTION` para adicionar lógica. A função precisa ser recriada. A migration faz `DROP FUNCTION ... CASCADE` (remove trigger antigo junto) e recria ambos. O comportamento externamente observável é idêntico para a criação de profile; a diferença é o INSERT adicional na tabela de audit.

### Riscos e mitigações

| Risco | Análise |
|-------|---------|
| `DROP FUNCTION CASCADE` remove o trigger `on_auth_user_created_profile` | Esperado — a migration recria imediatamente. Janela de ausência: milissegundos dentro da mesma transação DDL. |
| Profile criado sem registro na audit (best-effort) | Aceito — melhor um signup sem log do que um signup bloqueado por falha de audit. |
| Backfill de roles privilegiadas pré-existentes | **Não** ocorre automaticamente. Profiles admin/coord criados antes desta migration **não** aparecem na tabela de audit. Limitação documentada. |
| Dados de prod com inconsistência em `whitelist` | Improvável (há foreign key). Se `whitelist.id` foi deletado, `whitelist_entry_id` vai para NULL (ON DELETE SET NULL). |

### Reversão (se necessário)

```sql
-- 1. Remover trigger novo
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Restaurar handle_new_user da migration 20260507000002
-- (copiar a função de supabase/migrations/20260507000002_whitelist_default_role.sql e recriar)

-- 3. Remover tabela de audit
DROP TABLE IF EXISTS public.privileged_role_audit;
```

---

## Checklist antes de executar

- [ ] Verificar que `supabase migration list` mostra as 2 migrations como `pending` no remoto.
- [ ] Confirmar que não há usuário em processo de troca de email em prod (raro, mas vale checar no Supabase Dashboard → Auth → Users).
- [ ] Avisar equipe de que haverá janela de DDL de ~1 segundo (recriação do trigger `on_auth_user_created_profile`).
- [ ] Ter acesso ao Supabase Dashboard para verificar as tabelas após o push.

---

## Comando

```bash
supabase db push
```

Saída esperada:
```
Connecting to remote database...
Applying migration 20260510000000_check_whitelist_on_email_update.sql...ok
Applying migration 20260510000001_privileged_role_audit.sql...ok
Finished supabase db push.
```

---

## Verificação pós-push

No Supabase Dashboard → Table Editor, confirmar:

1. `public.privileged_role_audit` existe com as colunas descritas.
2. No SQL Editor:
   ```sql
   SELECT tgname FROM pg_trigger
   WHERE tgrelid = 'auth.users'::regclass
     AND tgname LIKE '%whitelist%';
   ```
   Deve retornar 2 linhas: `on_auth_user_signup_whitelist_check` (do INSERT original) e `on_auth_user_email_updated_whitelist_check` (novo).

---

## Registro pós-execução

Após executar, adicionar entrada em `docs/memory/deploys/_summary.md`:

```markdown
## 2026-05-XX — Gate G1 Sprint 07-C

- Migrations aplicadas: `20260510000000`, `20260510000001`
- Ambiente: produção / staging
- Output: [colar resultado do supabase db push]
- Verificação: privileged_role_audit criada ✅ | 2 triggers whitelist ✅
```
