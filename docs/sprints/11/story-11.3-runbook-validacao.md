# Story 11.3: Runbook de validação — quando Docker e Supabase estiverem disponíveis

**Sprint:** 11 — ver [sprint-plan.md](sprint-plan.md)
**Tipo:** ops / gate humano
**Prioridade:** P0
**Pré-condição:** Docker daemon ativo + `pnpm` instalado + `.env.local` configurado (não exigido para Camada 2 isolada se as variáveis de teste forem injetadas via ambiente — ver §3).
**Responsável:** humano (não-agente).

---

## 1. Por que esta story existe

O sandbox onde o agente Claude executou a Sprint 11 não tem Docker daemon. As Stories 11.1 (fix de testes) e 11.2 (closure documental da 07-C) puderam ser executadas — a 11.1 retroativamente, a 11.2 sem dependência de runtime. Mas três passos do DoD da sprint **dependem de validação operacional** que o agente não pôde fazer:

1. `pnpm test:integration` saindo verde.
2. `pnpm test:e2e` e `pnpm test:db` ao menos iniciando (health-check).
3. Promoção de ADR 0005 de `proposto` para `aceito` (só faz sentido se 1 e 2 derem certo).

Esta story é o **runbook que você executa quando tiver Docker funcional** para fechar a sprint formalmente.

---

## 2. Checklist resumido

Execute na ordem. Cada passo tem detalhes na seção §3.

- [ ] **2.1** — Confirmar Docker + Supabase CLI funcionais.
- [ ] **2.2** — Subir Supabase local (`supabase start`).
- [ ] **2.3** — Garantir migrations aplicadas localmente (`supabase db reset` se necessário).
- [ ] **2.4** — Rodar `pnpm test:unit` — baseline (≥ 59 testes verde).
- [ ] **2.5** — Rodar `pnpm test:integration` — **principal gate desta story**.
- [ ] **2.6** — Rodar `pnpm test:db` (pgTAP) — health-check, não bloqueante.
- [ ] **2.7** — Rodar `pnpm test:e2e --list` (verifica config; rodar suíte completa é opcional) — health-check, não bloqueante.
- [ ] **2.8** — Se §2.5 verde: promover ADR 0005 a `aceito`.
- [ ] **2.9** — Se §2.5 verde: limpar `test_output*.txt` do repo root (artefatos stale).
- [ ] **2.10** — Escrever Sprint 11 Final Artifact em `docs/memory/execution/AAAA-MM-DD-sprint-11-final.md` referenciando esta validação.
- [ ] **2.11** — Atualizar retrospectiva do `docs/sprints/11/sprint-plan.md` §10.
- [ ] **2.12** — (Opcional) Aplicar G1 (migrations remotas) — passos em §5.
- [ ] **2.13** — (Opcional) Rodar G2 (smoke staging) — passos em §6.

---

## 3. Detalhes operacionais

### 3.1 Confirmar Docker + Supabase CLI

```bash
docker version          # exibe Client + Server (daemon ativo)
docker ps               # não pode falhar — daemon precisa estar rodando

pnpm exec supabase --version
# se "command not found": pnpm install (CLI está em devDependencies)
```

Se Docker mostrar erro `cannot connect to the Docker daemon`, inicie o Docker Desktop (macOS/Windows) ou `sudo systemctl start docker` (Linux).

### 3.2 Subir Supabase local

```bash
pnpm exec supabase start
```

Espere o output com URLs (`API URL: http://127.0.0.1:54321`, `Service Role Key: ...`). Se Studio não subir, geralmente é porta em conflito — `pnpm exec supabase stop && pnpm exec supabase start`.

### 3.3 Garantir migrations aplicadas

`supabase start` aplica migrations de `supabase/migrations/` automaticamente. Se você tiver dúvida (ex.: subiu antes e adicionou migrations depois), force reset:

```bash
pnpm exec supabase db reset
```

Isso recria o schema do zero a partir das migrations.

### 3.4 Baseline Camada 1

```bash
pnpm test:unit
```

**Esperado:** ≥ 59 testes verdes, exit 0. Se vermelho aqui, **PARE** — algo regrediu fora de escopo desta sprint. Investigue antes de continuar.

### 3.5 Gate principal — Camada 2

```bash
pnpm test:integration
```

**Esperado:** todos os 37 testes (≥) passando, exit 0. Compare com baseline histórico no `test_output_2.txt` (8 falhas em 37).

**Se ainda houver falhas**, use a árvore de diagnóstico abaixo.

#### Árvore de diagnóstico — se `pnpm test:integration` falhar

| Sintoma | Causa provável | Ação |
|---------|---------------|------|
| `Cannot find package '@/lib/actions/...'` | Fix do alias em `1e42077` foi revertido ou config foi reescrita | Verificar `tests/integration.config.ts` linha 7: deve ser `path.resolve(__dirname, '../')` (não `'.'`) |
| `expected 'Database error saving new user' to match /...not authorized/i` | Regex de CA-18 voltou ao formato antigo | Verificar `tests/integration/triggers/handle_new_user.test.ts:75`: regex deve incluir `\|database error saving new user` |
| `FetchError: connect ECONNREFUSED 127.0.0.1:54321` ou similar | Supabase local não está rodando | `pnpm exec supabase status` e/ou `supabase start` |
| `JWT expired` ou `Invalid API key` | URL/keys batem com outra instância | Reabrir o terminal após `supabase start` para pegar env atualizado; conferir `tests/integration/fixtures/supabase.ts` |
| Persona `admin`/`coord`/`efetivo` não existe | Seed de personas não rodou | `pnpm exec supabase db reset` para reaplicar `supabase/seed.sql` |
| Timeout em RLS test | `globalSetup.ts` lento | Aumentar `hookTimeout` em `tests/integration.config.ts`; ou rodar suíte por arquivo para isolar |
| Erro de pgTAP "extension not found" em integration tests | Não deve ocorrer (pgTAP só é usado em Camada 4), mas se ocorrer | Adicionar `CREATE EXTENSION IF NOT EXISTS pgtap` numa migration de teste |
| Outros / novo | Bug introduzido por sprint posterior | Bisect com `git log -- tests/integration/` e verificar diffs após `b01c52b` |

**Se falhar com sintoma fora desta tabela:** abrir issue separada (não tentar consertar dentro desta sprint). Esta sprint é estabilização do que existe, não cobertura nova.

### 3.6 Health-check Camada 4 (pgTAP)

```bash
pnpm test:db
```

**O que esperar:** ao menos um output de plan/finish do pgTAP. Falhas individuais de teste **não bloqueiam** a sprint — registre no Sprint 11 Final Artifact como débito P1 ("Camada 4 com X testes vermelhos a investigar").

Se o comando falhar com `pgtap not installed`, adicione a uma migration de teste:

```sql
-- supabase/migrations/AAAAMMDDhhmmss_enable_pgtap.sql (data atual)
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
```

### 3.7 Health-check Camada 3 (E2E)

```bash
pnpm test:e2e --list
```

**O que esperar:** Playwright lista os specs sem erro de config. Não precisa rodar a suíte completa — basta provar que a config carrega.

Se quiser rodar a suíte:

```bash
pnpm exec playwright install chromium  # primeira vez no host
pnpm test:e2e
```

Falhas E2E não bloqueiam ADR 0005 (Camada 3 é o gate mais frágil — flakiness conhecida). Registre como débito P1.

### 3.8 Promover ADR 0005

**Só execute se §3.5 saiu verde.**

Editar `docs/spec/adr/0005-estrategia-de-testes.md` linha 3 e logo abaixo:

```diff
-**Status:** proposto
+**Status:** aceito
+**Aceito em:** AAAA-MM-DD — após Sprint 11 validar `pnpm test:integration` verde (scaffolding entregue em `b01c52b`, fixes operacionais em `1e42077`).
 **Data:** 2026-05-09
```

### 3.9 Cleanup dos test_output stale

Se §3.5 verde:

```bash
git rm test_output.txt test_output_2.txt
git commit -m "chore: remove stale test_output artifacts (pre-1e42077)"
```

Os arquivos foram commitados em `1e42077` como evidência da falha que motivou o fix. Hoje são ruído. Histórico de git preserva o conteúdo.

### 3.10 Sprint 11 Final Artifact

Criar `docs/memory/execution/AAAA-MM-DD-sprint-11-final.md` seguindo o template padrão (sumário, arquivos alterados, como testar, riscos conhecidos, próximo passo). Referenciar:

- Esta story 11.3 como gate executado.
- Resultados de `pnpm test:integration` e dos health-checks.
- Estado final de ADR 0005.
- Débitos remanescentes (se Camadas 3/4 ficaram vermelhas).

### 3.11 Retrospectiva

Preencher `docs/sprints/11/sprint-plan.md` §10 com métricas reais.

---

## 4. Critérios de Aceite

### CA-01 — Camada 2 verde

- **Given** Docker funcional + `supabase start`.
- **When** `pnpm test:integration` executa.
- **Then** exit 0, ≥ 37 testes passando, 0 falhando.

### CA-02 — ADR 0005 promovido

- **Given** CA-01 verde.
- **When** `docs/spec/adr/0005-estrategia-de-testes.md` é editado.
- **Then** `Status: aceito` com data de validação e referência ao Sprint 11.

### CA-03 — Sprint 11 Final Artifact escrito

- **Given** CA-01 e CA-02 atendidos.
- **When** `docs/memory/execution/AAAA-MM-DD-sprint-11-final.md` é criado.
- **Then** documento segue template e resume validação executada.

### CA-04 — Health-checks Camadas 3/4 registrados

- **Given** §3.6 e §3.7 executados.
- **When** Sprint 11 Final Artifact é escrito.
- **Then** estado de `pnpm test:db` e `pnpm test:e2e --list` documentado (verde, parcial ou bloqueado, com débito P1 se aplicável).

### CA-05 — `_summary.md` da Sprint 11 escrito

- **Given** sprint encerrada.
- **When** `docs/memory/sprints/11/_summary.md` é criado.
- **Then** segue padrão da Sprint 07-B (status, débitos, gates fechados).

---

## 5. Gate G1 — Migrations remotas (opcional, fora do escopo da sprint)

> Permanece como **débito aberto** após Sprint 11. Inclua aqui como referência para quando você decidir aplicar.

Migrations pendentes em remoto (não bloqueiam ADR 0005, mas bloqueiam G2):

- `supabase/migrations/20260510000000_check_whitelist_on_email_update.sql`
- `supabase/migrations/20260510000001_privileged_role_audit.sql`

**Comando** (após confirmar projeto linkado — ver `docs/memory/deploys/2026-05-06-supabase-remote.md`):

```bash
export SUPABASE_DB_PASSWORD='SUA_SENHA'
pnpm exec supabase db push --dry-run    # revisar plano
pnpm exec supabase db push              # aplicar
```

Detalhes e riscos: ver [docs/sprints/07C/gate-07C.G1-migrations-remotas.md](../07C/gate-07C.G1-migrations-remotas.md).

---

## 6. Gate G2 — Smoke anti-spoofing em staging (opcional, fora do escopo da sprint)

> Permanece como **débito aberto** após Sprint 11.

Depende de G1 aplicado + 1 task e 1 efetivo seeded em staging.

```bash
export STAGING_URL='https://...supabase.co'
export STAGING_ANON_KEY='...'
export EFETIVO_JWT='...'         # obter via login real do efetivo em staging
bash tests/smoke/anti-spoofing.sh
```

Esperado: `3 PASS / 0 FAIL`. Registrar resultado em `docs/memory/deploys/_summary.md`.

Detalhes: ver [docs/sprints/07C/gate-07C.G2-smoke-staging.md](../07C/gate-07C.G2-smoke-staging.md).

---

## 7. Escopo negativo

- ❌ Corrigir bugs novos descobertos pelos testes — abrir ticket separado.
- ❌ Adicionar testes novos — esta story só executa o que existe.
- ❌ Refatorar Server Actions ou Edge Function.
- ❌ Mexer em ADRs além do 0005.
