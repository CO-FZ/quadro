# Sprint 07-B — Resumo de fase (em andamento)

**Última atualização:** 2026-05-10
**Plano:** [docs/sprints/07B/sprint-plan.md](../../../sprints/07B/sprint-plan.md)
**Branch de execução:** `claude/fix-technical-debt-bTaB7`

> Resumo cumulativo. Atualizado a cada story fechada dentro da Sprint 07-B.

---

## Status por story

| Story | Status | Commit / Push | Cobertura adicionada |
|---|---|---|---|
| [07B.1 — Logger estruturado](../../../sprints/07B/story-07B.1-logger.md) | ✅ entregue | `7fe430a` (push em `claude/fix-technical-debt-bTaB7`) | 16 testes unit (`tests/unit/lib/logger`) |
| [07B.2 — Callback mapping + UI domínio privilegiado](../../../sprints/07B/story-07B.2-callback-mapping.md) | 🟡 entregue parcial (CA-03/CA-09 deferidas — exigem 07A.2/07A.3) | (junto desta entrega) | 11 testes unit (`tests/unit/lib/i18n`, `tests/unit/lib/utils/admin-warnings`) |
| [07B.3 — Audit log + smoke anti-spoofing](../../../sprints/07B/story-07B.3-audit-log.md) | ⬜ não iniciada | — | — |
| [07B.4 — Fechamento retroativo + ADR 0004 → Aceito + i18n base](../../../sprints/07B/story-07B.4-retroactive-closure.md) | 🟡 parte do `lib/i18n` antecipada na 07B.2 | — | — |

---

## Story 07B.1 — Logger estruturado (✅)

**Arquivos novos:**
- `lib/logger/index.ts` — wrapper Node, ~80 linhas, redação automática de 7 chaves sensíveis (`password`, `jwt`, `token`, `authorization`, `cookie`, `secret`, `service_role_key`).
- `supabase/functions/_shared/logger.ts` — gêmeo Deno (sincronia manual; mesma API).
- `lib/logger/README.md` — guia de uso, níveis, lista de chaves redigidas.
- `tests/unit/lib/logger/index.test.ts` — 16 cenários (redact + JSON/pretty + roteamento por nível).

**Arquivos integrados:**
- `lib/auth/require-role.ts` — emite `warn role_forbidden` quando `assertRoleAllowed` retorna FORBIDDEN.
- `app/auth/callback/route.ts` — captura erro do trigger, loga, redireciona. (Refatorado novamente em 07B.2.)
- `lib/actions/admin.ts` — `info whitelist_privileged_role` em entries com role admin/coordenador (sem email completo).
- `supabase/functions/sync-sheets/index.ts` — todos os `console.{log,error}` substituídos. Verificação: `grep -nE 'console\\.' supabase/functions/sync-sheets/index.ts` → vazio.

**Critérios de aceite:**
- CA-01..02 ✅; CA-03 ✅ (cobertura unit; integration de mock console fica para 07A.2 quando o stack estiver de pé); CA-04..08 ✅.

---

## Story 07B.2 — Callback mapping + UI domínio privilegiado (🟡)

**Arquivos novos:**
- `lib/i18n/index.ts` — resolvedor `t(key, ...args)` minimalista, sem dependência. Suporta string literal e função interpoladora; degrade visível (retorna a chave).
- `lib/i18n/auth.ts` — `auth.errors.{not_authorized, auth_failed}` em pt-BR.
- `lib/i18n/admin.ts` — `admin.whitelist.privileged_domain_warning` (função(domain, role) → string).
- `lib/utils/admin-warnings.ts` — `isPrivilegedDomainEntry(identifier, role)`: pura, retorna `true` se identifier começa com `@` **e** role ∈ {admin, coordenador}.
- `supabase/migrations/20260510000000_check_whitelist_on_email_update.sql` — trigger `BEFORE UPDATE OF email` aplicando `check_whitelist`.
- `tests/unit/lib/i18n/index.test.ts` — 4 cenários do resolvedor.
- `tests/unit/lib/utils/admin-warnings.test.ts` — 7 cenários (matriz role × tipo de identifier + bordas).

**Arquivos modificados:**
- `app/auth/callback/route.ts` — agora distingue dois caminhos:
  1. GoTrue redireciona com `?error=&error_description=` → parse, decide `not_authorized` (substring "acesso negado") vs `auth_failed`.
  2. `exchangeCodeForSession` retorna erro → mesma lógica via `error.message`.
  Em ambos: log estruturado + redirect para `/login?error=...`.
- `app/(marketing)/login/page.tsx` — lê `useSearchParams().get('error')`, mapeia via `t('auth.errors.<key>')`, renderiza alert com `role="alert"`. Erro do próprio `signInWithOAuth` permanece num bloco separado.
- `components/features/AdminView.tsx` — derivado puro `isPrivilegedDomainEntry(newIdentifier, newDefaultRole)` controla um bloco de warning (`data-testid="privileged-domain-warning"`); botão "Adicionar" continua habilitado (warning é informacional).

**Critérios de aceite:**
- CA-01 ✅ — callback detecta substring "acesso negado" em `error_description`/`error.message`, loga `signup_blocked`, redireciona `/login?error=not_authorized`.
- CA-02 ✅ — login page renderiza mensagem amigável vinda de `t('auth.errors.not_authorized')`.
- CA-03 ⏸️ deferida — depende da Story 07A.3 (Playwright) que está bloqueada por Docker indisponível neste sandbox.
- CA-04 ✅ — caminhos não-whitelist redirecionam para `/login?error=auth_failed`.
- CA-05 ✅ resolvido — investigação concluiu que o gap **é real** (Supabase Auth permite `updateUser({ email })` pelo cliente; sem trigger BEFORE UPDATE, um usuário whitelisted poderia trocar para email fora da whitelist). Migration `20260510000000_check_whitelist_on_email_update.sql` adiciona o trigger; reaproveita `check_whitelist()` (idempotente). **Aplicação remota pendente** (`supabase db push`) — fica como gate de Gate 2.
- CA-06 ✅ — warning aparece com `@dominio` + role privilegiada.
- CA-07 ✅ — derivado puro recalcula a cada render; some imediatamente quando role muda para `efetivo` ou identifier deixa de ser domínio.
- CA-08 ✅ — `lib/i18n` base com 5 chaves críticas (3 de auth + 2 de admin via função). Migração total continua como débito formal.
- CA-09 ⏸️ deferida — depende da Story 07A.2 (integration tests) bloqueada por Docker.

**Riscos abertos da story:**
- Migration `20260510000000` não foi aplicada (sandbox sem Docker/Supabase). Quando o humano rodar `supabase db push`, validar que o trigger não interfere com sync de OAuth (no caso do Google atualizar email do usuário durante refresh, o trigger reaplica o `check_whitelist` — comportamento desejado: re-valida contra whitelist).
- Tests CA-03/CA-09 ficam pendentes até 07A.2/07A.3 entregarem stack de integration/E2E.

---

## Histórico de execução (sessão atual)

**Branch:** `claude/fix-technical-debt-bTaB7` (designada para a sessão).

| Hora | Evento |
|---|---|
| ~00:18 | Sessão começa em `68ec4ff` (após 07A.1 mergeada). |
| ~00:22 | Story 07B.1 entregue, push em `7fe430a`. |
| ~00:29 | Story 07B.2 entregue (CAs aplicáveis ao sandbox), suite 59/59 verde. |

---

## Gates pendentes para Gate 2 humano (Sprint 07-B inteira)

- [ ] Aplicar `supabase db push` para a migration `20260510000000_check_whitelist_on_email_update.sql` em ambiente remoto.
- [ ] Rodar `pnpm test:integration` (Story 07A.2 — quando entregue) para CA-09 da 07B.2.
- [ ] Rodar `pnpm test:e2e` (Story 07A.3 — quando entregue) para CA-03 da 07B.2.
- [ ] Atualizar este `_summary.md` ao fechar 07B.3 e 07B.4.
- [ ] Atualizar `docs/memory/sprints/_summary.md` (index global) ao fechar a sprint.
