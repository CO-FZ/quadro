# Smoke tests

Ferramentas humanas de validação. **Não rodam no CI.** Para regressões automáticas, use as Camadas 1–4 (ver `tests/README.md`).

## `anti-spoofing.sh` — Story 07B.3 (CA-07/CA-08)

Valida que um efetivo autenticado **não** consegue:

1. Criar `tasks` setando `created_by` para outro usuário (admin) — bloqueio via WITH CHECK / coluna controlada.
2. Inserir em `task_assignees` em nome de outro usuário — bloqueio via RLS.
3. Atualizar uma `tasks` que não lhe pertence (sem ser assignee) — bloqueio via RLS UPDATE.

**Não substitui** os integration tests (Story 07A.2 CA-11/CA-12) nem pgTAP (Story 07A.4). É ferramenta para validar **um deploy específico** em staging/produção (read-only) quando a suíte CI não está disponível ou não cobre aquele ambiente.

### Pré-requisitos

| Variável | Como obter |
|---|---|
| `SUPABASE_URL` | URL do projeto (Supabase Dashboard → Settings → API). |
| `SUPABASE_ANON_KEY` | Chave anônima pública. **NUNCA** use a service-role aqui — bypassaria RLS e produziria falsos PASS. |
| `EFETIVO_JWT` | Access token de um usuário com role `efetivo`. Ver fixture da Story 07A.2 (`tests/integration/fixtures/users.ts`) para gerar via signup local; em ambientes remotos, faça login na app e copie o JWT do cookie/devtools. |
| `ADMIN_USER_ID` | UUID de um usuário com role `admin`. Cenários 1 e 2 tentam spoofar este ID. |
| `TASK_ID` | UUID de uma task existente que **não** pertence ao efetivo (ele não pode ser assignee). Cenário 3 tenta editá-la. |

### Como rodar

```bash
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_ANON_KEY=<anon-key> \
EFETIVO_JWT=<jwt-do-efetivo> \
ADMIN_USER_ID=<uuid-do-admin> \
TASK_ID=<uuid-task-de-outro-usuario> \
    bash tests/smoke/anti-spoofing.sh
```

Saída esperada (caminho feliz):

```
[1/3] INSERT tasks com created_by = ADMIN_USER_ID (esperado: bloqueio)
PASS  INSERT tasks spoofando created_by  [status=403]

[2/3] INSERT task_assignees com user_id = ADMIN_USER_ID (esperado: bloqueio)
PASS  INSERT task_assignees spoofando user_id  [status=403]

[3/3] UPDATE tasks sem ser assignee (esperado: 0 rows / bloqueio)
PASS  UPDATE tasks fora de assignment  [status=200]   # body=[] também é PASS

=== Resultado: 3 PASS / 0 FAIL ===
```

Exit code `0` se todos PASS, `1` caso contrário. Variável obrigatória ausente → exit `2`.

### Quando usar

- Validação pós-deploy em staging.
- Diagnóstico em produção (somente com JWTs de usuários de teste — nunca usar JWT de um usuário real para evitar criar tasks-lixo).
- Antes de aprovar mudanças em RLS de `tasks` / `task_assignees`.

### Quando NÃO usar

- Como gate de PR — use a suíte de integration/pgTAP.
- Com `SUPABASE_SERVICE_ROLE_KEY` no lugar do anon key — service-role bypassa RLS e o smoke retornaria PASS falso.
- Sem antes confirmar que `ADMIN_USER_ID` e `TASK_ID` são de fato distintos do dono do `EFETIVO_JWT`.
