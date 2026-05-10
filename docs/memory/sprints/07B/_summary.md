# Sprint 07-B — Resumo de fase (fechada)

**Última atualização:** 2026-05-10 (fechamento da sprint via Story 07B.4)
**Plano:** [docs/sprints/07B/sprint-plan.md](../../../sprints/07B/sprint-plan.md)
**Status de saída:** 🟡 entregue com débitos rastreados — 4/4 stories com entrega substantiva; 5 CAs deferidos para Camadas 2/3 da Sprint 07-A (bloqueadas por Docker indisponível neste sandbox).
**Branches de execução:**
- `claude/fix-technical-debt-bTaB7` (07B.1 e 07B.2)
- `claude/implement-story-07b3-0Zu6w` (07B.3)
- `claude/implement-story-07b4-retroactive-closure` (07B.4)

> Resumo cumulativo. Atualizado a cada story fechada dentro da Sprint 07-B.

---

## Status por story

| Story | Status | Commit / Push | Cobertura adicionada |
|---|---|---|---|
| [07B.1 — Logger estruturado](../../../sprints/07B/story-07B.1-logger.md) | ✅ entregue | `7fe430a` (push em `claude/fix-technical-debt-bTaB7`) | 16 testes unit (`tests/unit/lib/logger`) |
| [07B.2 — Callback mapping + UI domínio privilegiado](../../../sprints/07B/story-07B.2-callback-mapping.md) | 🟡 entregue parcial (CA-03/CA-09 deferidas — exigem 07A.2/07A.3) | (junto desta entrega) | 11 testes unit (`tests/unit/lib/i18n`, `tests/unit/lib/utils/admin-warnings`) |
| [07B.3 — Audit log + smoke anti-spoofing](../../../sprints/07B/story-07B.3-audit-log.md) | 🟡 entregue (CA-02/CA-04 deferidas — exigem 07A.2) | (push em `claude/implement-story-07b3-0Zu6w`) | — (testes de DB ficam para 07A.2/07A.4) |
| [07B.4 — Fechamento retroativo + ADR 0004 → Aceito + i18n base](../../../sprints/07B/story-07B.4-retroactive-closure.md) | ✅ entregue (10/10 CAs — i18n base já antecipada na 07B.2) | (push em `claude/implement-story-07b4-retroactive-closure`) | — (story de documentação) |

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

## Story 07B.3 — Audit log + smoke anti-spoofing (🟡)

**Arquivos novos:**
- `supabase/migrations/20260510000001_privileged_role_audit.sql` — cria tabela `public.privileged_role_audit` (`profile_id`, `email`, `role`, `source`, `whitelist_entry_id`, `created_at`), índice `created_at DESC`, RLS habilitada com policy SELECT só admin (sem policies de escrita — apenas trigger `SECURITY DEFINER`). Reescreve `handle_new_user` para resolver o `whitelist_entry_id` durante o lookup (match exato → match por domínio) e disparar INSERT condicional na audit table quando role ∈ {admin, coordenador}. INSERT da audit envolto em `BEGIN ... EXCEPTION WHEN OTHERS THEN RAISE WARNING ... END;` para garantir best-effort (CA-03).
- `tests/smoke/anti-spoofing.sh` — script bash para validação manual (3 cenários: spoof de `created_by` em `tasks`, spoof de `user_id` em `task_assignees`, UPDATE em `tasks` sem ser assignee). Imprime PASS/FAIL e sai 0/1. Detecta bloqueio via status ≥ 400 ou body vazio (`[]`) ou substring `row-level security` / `policy` / `permission denied` / `violates`.
- `tests/smoke/README.md` — documenta variáveis de ambiente, como gerar `EFETIVO_JWT`, quando usar (validação pós-deploy em staging/prod read-only) e quando NÃO usar (não substitui suíte CI; nunca com service-role).

**Arquivos modificados:**
- `lib/supabase/types.ts` — adiciona `PrivilegedRoleAuditSource` e `PrivilegedRoleAuditEntry`.
- `lib/actions/admin.ts` — Server Action `getPrivilegedRoleAudit({ limit, offset })` com guard `requireAdmin`. Limit clamped 1..200, default 50. Retorna `{ ok, data }` ou `{ ok: false, code, message }`.
- `lib/i18n/admin.ts` — namespace `admin.audit.*` com 13 chaves para a UI da nova aba.
- `app/(app)/admin/page.tsx` — busca `getPrivilegedRoleAudit({ limit: 50 })` e passa `auditEntries`, `auditError`, `currentUserRole` para `AdminView`.
- `components/features/AdminView.tsx` — nova aba "Auditoria" condicional a `currentUserRole === 'admin'` (defesa em camadas: server-side já bloqueia rota; aba também não monta para não-admin). Tabela com colunas data, e-mail, role, origem, entrada whitelist (com fallback "removida" quando o `ON DELETE SET NULL` zerou o ID). Footer com aviso de backfill.

**Critérios de aceite:**
- CA-01 ✅ — migration cria tabela com colunas/índice/RLS especificadas.
- CA-02 ⏸️ deferida — exige integration test (Story 07A.2) para validar via signup real. Lógica do trigger revisada manualmente.
- CA-03 ✅ — INSERT da audit dentro de bloco `EXCEPTION WHEN OTHERS THEN RAISE WARNING`. Falha não bloqueia o INSERT do profile.
- CA-04 ⏸️ deferida — exige integration test (Story 07A.2) para validar RLS contra usuários de role efetivo/coord.
- CA-05 ✅ — aba "Auditoria" lista os últimos 50 eventos (limit aplicado server-side) com layout consistente com aba Usuários.
- CA-06 ✅ — aba só renderiza se `currentUserRole === 'admin'`. Server route já redireciona não-admins.
- CA-07 ✅ — `tests/smoke/anti-spoofing.sh` cobre 3 cenários, com PASS/FAIL e exit code consistente.
- CA-08 ✅ — `tests/smoke/README.md` cobre o que cada cenário valida, como obter o JWT, e quando não usar.
- CA-09 ✅ — sem backfill automático; aviso em UI (footer da aba) e neste `_summary.md`.

**Limitação documentada (CA-09):** Audit log começa do zero a partir da aplicação da migration `20260510000001_privileged_role_audit.sql`. Profiles privilegiados criados anteriormente **não foram auditados** — não há como inferir retroativamente se vieram de match exato, match de domínio ou `UPDATE` manual. Aceitável para v1; revisitar somente se aparecer necessidade regulatória.

**Riscos abertos da story:**
- Migration `20260510000001` ainda não aplicada (sandbox sem Docker/Supabase). Aplicar com `supabase db push` em ambiente remoto antes de promover a aba para usuários finais.
- Tests CA-02/CA-04 ficam pendentes até 07A.2 entregar stack de integration.

---

## Story 07B.4 — Fechamento retroativo + ADR 0004 → Aceito + i18n base (✅)

**Arquivos novos:**
- `docs/memory/execution/2026-05-07-sprint-05-final.md` — Final Artifact retroativo da Sprint 05 (CA-05). Sumário, arquivos alterados, riscos, próximo passo. Marca claramente: regra §2 ("arquivados não aparecem como assignees") **não foi implementada**.
- `docs/memory/execution/2026-05-07-sprint-06-final.md` — Final Artifact retroativo da Sprint 06 (CA-04). Documenta pipeline em duas fases (commits `7c6aa45` e `77c0f06`), commit misto com `is_admin()` fix, débitos de hardening (URL/anon-key hardcoded, sem retry, sem testes da Edge Function).
- `docs/memory/sprints/07A/_summary.md` — Resumo retroativo da Sprint 07-A (CA-08). Confirma que **só Camada 1 foi entregue** (35→59 testes Vitest unit); Camadas 2/3/4 e ADR 0005 (`proposto`) e CI ficaram em débito por bloqueio de Docker no sandbox.

**Arquivos modificados:**
- `docs/memory/sprints/07B/_summary.md` — este arquivo, finalizando a sprint (CA-09): status de saída 🟡, branches de execução, status por story, débitos consolidados.
- `docs/memory/sprints/_summary.md` — índice global atualizado para 2026-05-10 (CA-06): entradas das Sprints 05/06/07-A já existiam (escritas em 2026-05-09); 07-B fechada agora; nova seção "Débitos abertos pós-Sprint 07" consolidada (CA-10).

**Arquivos verificados como já entregues em sessão anterior** (não tocados):
- `docs/memory/sprints/05/_summary.md` (CA-01) — escrito em 2026-05-09 com 8 seções, status 🟡, lacuna §2 destacada.
- `docs/memory/sprints/06/_summary.md` (CA-02) — escrito em 2026-05-09 com 8 seções, débitos detalhados.
- `docs/spec/adr/0004-google-sheets-sync.md` (CA-03) — promovido a `Aceito (retroativo — promovido em 2026-05-09)` com nota explicativa no topo.

**Critérios de aceite:**
- CA-01 ✅ — `_summary.md` da Sprint 05 já existia (sessão anterior, 2026-05-09). Verificado: 8 seções, status 🟡, regra §2 marcada como `[não implementado]`.
- CA-02 ✅ — `_summary.md` da Sprint 06 já existia (sessão anterior, 2026-05-09). Verificado: confirma entrega + lista 7 débitos rastreados.
- CA-03 ✅ — ADR 0004 promovido a `Aceito` retroativo em 2026-05-09. Nota explicativa presente.
- CA-04 ✅ — Final Artifact da Sprint 06 criado em `docs/memory/execution/2026-05-07-sprint-06-final.md`.
- CA-05 ✅ — Final Artifact da Sprint 05 criado em `docs/memory/execution/2026-05-07-sprint-05-final.md`.
- CA-06 ✅ — índice global tem entradas para 05/06/07-A/07-B; data atualizada para 2026-05-10; seção de débitos consolidada (CA-10).
- CA-07 ✅ — débitos descobertos durante a arqueologia foram registrados como tickets explícitos (não inventados como entregues): regra §2 da Sprint 05 (assignees arquivados), `is_admin()` sem ADR, URL/anon-key hardcoded da Sprint 06, ADR 0005 ainda `proposto`, Camadas 2/3/4 da Sprint 07-A pausadas.
- CA-08 ✅ — `_summary.md` da Sprint 07-A criado em `docs/memory/sprints/07A/_summary.md`. Status 🟡 reflete só-Camada-1 entregue.
- CA-09 ✅ — este `_summary.md` da 07-B finalizado com fechamento da sprint, status por story, débitos abertos.
- CA-10 ✅ — seção "Débitos abertos pós-Sprint 07" no índice global lista débitos por prioridade.

**Limitação metodológica:** Os Final Artifacts retroativos (CA-04, CA-05) são reconstruções **a partir do diff, do estado atual do código e dos sprint-plans / stories** — não há registro de Plan Artifact ou Gate 2 humano à época. Marcados explicitamente com nota retroativa para distinguir de artifacts escritos no momento da execução.

---

## Débitos consolidados pós-Sprint 07-B

### 🔴 P0 — entrar como story na Sprint 07-C (a planejar)

- **Filtro `archived_at IS NULL` no assignee selector** (`app/(app)/kanban/page.tsx`). Regra §2 da story 05 nunca implementada; afeta UX e potencialmente seleção indevida de usuários arquivados.
- **Aplicar migrations remotas** `20260510000000_check_whitelist_on_email_update.sql` e `20260510000001_privileged_role_audit.sql` via `supabase db push` (gate humano).
- **Camadas 2/3/4 da Sprint 07-A** — integration (Vitest+Supabase local), E2E (Playwright + screenshot diff mobile) e pgTAP. Bloqueadas por Docker indisponível neste sandbox.
- **ADR 0005 promover de `proposto` a `aceito`** (depende das Camadas 2/3/4).
- **CI configurado** com os 4 jobs (typecheck/lint, unit, integration, e2e + db).

### 🟡 P1 — investigar / documentar

- **`is_admin()` SECURITY DEFINER sem ADR** — virar ADR 0006 ou revisão do ADR 0001.
- **Smoke anti-spoofing em staging** — rodar `tests/smoke/anti-spoofing.sh` quando ambiente disponível e registrar resultado em `docs/memory/deploys/_summary.md`.
- **Final Artifact da Sprint 07-A** — Plan Artifact existe (`2026-05-09-sprint-07A-plan-artifact.md`); Final Artifact não. Pode acompanhar o fechamento das Camadas 2/3/4 quando entregues.

### 🟢 P2/P3 — backlog longo

- Race-condition do `LAST_ADMIN` (transação real).
- URL e anon-key hardcoded em migration `20260507000005_google_sheets_webhook.sql`.
- Retry/dead-letter para falhas da Google API em `sync-sheets`.
- Cobertura automatizada da Edge Function (mock de Google API).
- Audit log para `updateUserRole` (mudança pós-cadastro) — Story 07B.3 só cobre criação automática.
- Migração total de mensagens hard-coded para `lib/i18n` (hoje só 5 chaves críticas + 13 da audit tab).
- Trace IDs / correlation IDs no logger.
- Sincronização bi-direcional Google Sheets — fora de escopo do PRD v1.
- Visual regression em desktop (E2E hoje só mobile, conforme PRD).

---

## Histórico de execução

| Data | Evento |
|---|---|
| 2026-05-10 ~00:18 | Sessão 1 começa em `68ec4ff` (branch `claude/fix-technical-debt-bTaB7`). |
| 2026-05-10 ~00:22 | Story 07B.1 entregue, push em `7fe430a`. |
| 2026-05-10 ~00:29 | Story 07B.2 entregue (CAs aplicáveis ao sandbox), suite 59/59 verde. |
| 2026-05-10 (sessão 2) | Story 07B.3 entregue em `claude/implement-story-07b3-0Zu6w`, commit `1dcca95`. |
| 2026-05-10 (sessão 3) | Story 07B.4 entregue em `claude/implement-story-07b4-retroactive-closure`. Sprint 07-B fechada. |

---

## Gates pendentes para Gate 2 humano (pós-Sprint 07-B)

- [ ] Aplicar `supabase db push` para as migrations `20260510000000_check_whitelist_on_email_update.sql` e `20260510000001_privileged_role_audit.sql` em ambiente remoto.
- [ ] Rodar `pnpm test:integration` (Camada 2 — quando entregue) para CA-09 da 07B.2 e CA-02/CA-04 da 07B.3.
- [ ] Rodar `pnpm test:e2e` (Camada 3 — quando entregue) para CA-03 da 07B.2.
- [ ] Rodar `tests/smoke/anti-spoofing.sh` em staging assim que a migration for aplicada (ferramenta humana — registrar resultado em `docs/memory/deploys/_summary.md`).
- [x] Atualizar este `_summary.md` ao fechar 07B.4. ← feito.
- [x] Atualizar `docs/memory/sprints/_summary.md` (index global) ao fechar a sprint. ← feito.
