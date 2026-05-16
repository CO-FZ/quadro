# Gate G2 — Smoke Anti-Spoofing em Staging

**Sprint:** 07-C — ver [sprint-plan.md](sprint-plan.md)
**Owner:** humano (gate de deploy)
**Pré-condição:** Gate G1 executado (migrations aplicadas no remoto).
**Script:** `tests/smoke/anti-spoofing.sh`
**Resultado esperado:** `3 PASS / 0 FAIL` (exit code 0).

---

## O que o script valida

O script faz 3 requisições REST diretas ao ambiente remoto usando o JWT de um usuário com role `efetivo`, tentando operações que deveriam ser bloqueadas pelo RLS (ADR 0003):

| Cenário | Tentativa | Esperado |
|---------|-----------|----------|
| 1/3 | INSERT em `tasks` com `created_by = ADMIN_USER_ID` (spoofing de autoria) | RLS recusa (`WITH CHECK (created_by = auth.uid())`) |
| 2/3 | INSERT em `task_assignees` com `user_id = ADMIN_USER_ID` (spoofing de assignee) | RLS recusa (efetivo só pode atribuir a si mesmo) |
| 3/3 | PATCH em `tasks?id=eq.TASK_ID` sem ser assignee da task | RLS retorna 0 rows modificados |

Se qualquer cenário passar (spoofing bem-sucedido), o script retorna `FAIL` e exit code 1 — investigar imediatamente.

---

## Por que rodar em staging (não só em local)?

O CI (Story 07C.1) vai cobrir os mesmos cenários via Vitest integration (Camada 2) contra o Supabase **local**. O smoke em staging valida que:
1. As migrations foram aplicadas corretamente no ambiente remoto.
2. Não há divergência entre as policies locais e as do banco remoto (um `supabase db push` mal-sucedido não deixaria evidência óbvia sem este teste).

---

## Como obter as variáveis de ambiente

### `SUPABASE_URL` e `SUPABASE_ANON_KEY`

No Supabase Dashboard → Project Settings → API:
- `Project URL` → `SUPABASE_URL`
- `anon public` key → `SUPABASE_ANON_KEY`

### `EFETIVO_JWT`

Precisa de um JWT de sessão de um usuário com `role = 'efetivo'` no banco remoto.

**Opção A (recomendada para staging):** usar o Supabase CLI para gerar:
```bash
# Se tiver um usuário de teste com email/senha:
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"efetivo@test.com","password":"senha-teste"}' \
  | jq -r '.access_token'
```
Copie o `access_token` retornado.

**Opção B:** logar via browser no app em staging, abrir DevTools → Application → Local Storage → `supabase.auth.token` → copiar `access_token` do JSON.

### `ADMIN_USER_ID`

UUID de qualquer usuário com `role = 'admin'` no banco remoto. Obter via:
```sql
SELECT id FROM profiles WHERE role = 'admin' LIMIT 1;
```
(Supabase Dashboard → SQL Editor)

### `TASK_ID`

UUID de qualquer task existente no banco remoto em que o usuário `EFETIVO` **não seja assignee**. Obter via:
```sql
SELECT t.id FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM task_assignees ta
  WHERE ta.task_id = t.id
    AND ta.user_id = '<EFETIVO_USER_ID>'
)
LIMIT 1;
```

---

## Comando completo

```bash
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co \
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
EFETIVO_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
ADMIN_USER_ID=00000000-0000-0000-0000-000000000000 \
TASK_ID=11111111-1111-1111-1111-111111111111 \
  bash tests/smoke/anti-spoofing.sh
```

---

## Saída esperada

```
=== Smoke anti-spoofing — alvo: https://xxxx.supabase.co ===

[1/3] INSERT tasks com created_by = ADMIN_USER_ID (esperado: bloqueio)
PASS  INSERT tasks spoofando created_by  [status=403]

[2/3] INSERT task_assignees com user_id = ADMIN_USER_ID (esperado: bloqueio)
PASS  INSERT task_assignees spoofando user_id  [status=403]

[3/3] UPDATE tasks sem ser assignee (esperado: 0 rows / bloqueio)
PASS  UPDATE tasks fora de assignment  [status=200]

=== Resultado: 3 PASS / 0 FAIL ===
```

> Nota: cenário 3/3 pode retornar status 200 com body `[]` — isso é um PASS. O RLS filtra a query para 0 rows (o UPDATE não encontra nenhuma row que o efetivo possa modificar), então não retorna erro HTTP.

---

## Se algum cenário FAIL

| Cenário | Possível causa | Investigação |
|---------|---------------|-------------|
| 1/3 FAIL | Policy `WITH CHECK (created_by = auth.uid())` ausente em `tasks` | `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'tasks';` |
| 2/3 FAIL | Policy de `task_assignees` permite `user_id` arbitrário para qualquer role | `SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'task_assignees';` |
| 3/3 FAIL (retornou row modificada) | Policy de UPDATE em `tasks` não filtra por assignee | Verificar policy `efetivo só modifica se é assignee` em `pg_policies` |

---

## Registro pós-execução

Adicionar entrada em `docs/memory/deploys/_summary.md`:

```markdown
## 2026-05-XX — Gate G2 Sprint 07-C

- Script: `tests/smoke/anti-spoofing.sh`
- Ambiente: staging / produção (URL: https://xxxx.supabase.co)
- Resultado: 3 PASS / 0 FAIL ✅
- Executado por: [nome]
- Output completo: [colar ou resumir]
```
