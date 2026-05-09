# Story 07B.4: Fechamento retroativo Sprints 05/06 + ADR 0004 → Aceito

**Sprint:** 07-B — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0004 — Google Sheets Sync](../../spec/adr/0004-google-sheets-sync.md) (promover para `Aceito`)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** auditoria desta sprint detectou que `docs/memory/sprints/05/_summary.md` e `docs/memory/sprints/06/_summary.md` não existem; ADR 0004 ainda em status `Proposto` apesar da migration `20260507000005` em produção.

---

## 1. Visão Geral

Sprints 05 e 06 foram executadas mas nunca formalmente fechadas com `_summary.md`. Ficou na cabeça de quem executou. Esta story reconstrói os summaries a partir do estado atual do repositório (commits, migrations, ADR existente, `sprint-plan.md`), promove o ADR 0004 para `Aceito` (porque a implementação já está em prod) e atualiza o índice global `docs/memory/sprints/_summary.md`.

É **trabalho de documentação retroativa**, não de código. Se durante a reconstrução descobrirmos que algo nunca foi implementado, registramos como débito explícito ao invés de "fingir que foi feito".

## 2. Requisitos de Negócio (Regras)

- **`_summary.md` da Sprint 05** deve seguir o template da Sprint 04 ([memory/sprints/04/_summary.md](../../memory/sprints/04/_summary.md)) com seções 1–7. Conteúdo reconstruído de:
  - [docs/sprints/05/sprint-plan.md](../../sprints/05/sprint-plan.md) (compromissos)
  - [docs/sprints/05/story-05-admin-enhancements.md](../../sprints/05/story-05-admin-enhancements.md) (CAs)
  - Migrations `20260507000003_profiles_archived_at.sql`, `20260507000004_fix_admin_rls.sql` (deliverables)
  - `lib/actions/admin.ts` funções `archiveUser`, `restoreUser`, `addToWhitelist` bulk parsing (entregue?)
  - `components/features/AdminView.tsx` (busca por email, badges archived?) — **investigar**
- **`_summary.md` da Sprint 06** idem, baseado em:
  - [docs/sprints/06/sprint-plan.md](../../sprints/06/sprint-plan.md)
  - [docs/sprints/06/story-06-google-sheets-sync.md](../../sprints/06/story-06-google-sheets-sync.md)
  - Migration `20260507000005_google_sheets_webhook.sql`
  - `supabase/functions/sync-sheets/index.ts`
- **ADR 0004:** mudar status para `Aceito` com data `2026-05-09` (data do fechamento retroativo); adicionar nota: "Aceito retroativamente — implementação já em prod desde Sprint 06."
- **Índice de sprints (`docs/memory/sprints/_summary.md`):** adicionar entradas para Sprint 05, Sprint 06, Sprint 07-A, Sprint 07-B.

## 3. Requisitos técnicos

- **Arqueologia:** usar `git log --diff-filter=A` em `lib/actions/admin.ts`, `supabase/functions/sync-sheets/`, e migrations `20260507000003+` para reconstruir cronologia.
- **Validação por código:** para cada CA da Sprint 05/06, verificar se está implementada hoje. Marcar como `[implementado]`, `[parcial — falta X]`, ou `[não implementado — débito Y]`.
- **i18n complementar:** se Sprint 07B.2 deixou chaves de mensagem incompletas, esta story complementa **só** as relacionadas a fechamento (mensagens de toast em `archiveUser/restoreUser`).

## 4. Critérios de Aceite

### CA-01 — `_summary.md` da Sprint 05 escrito

- **Given** ausência atual de `docs/memory/sprints/05/_summary.md`
- **When** agente reconstrói baseado em código + sprint-plan + story
- **Then** arquivo existe em `docs/memory/sprints/05/_summary.md` com seções 1–7. Cada CA da story 05 marcada com seu status atual ([implementado] / [parcial] / [não implementado]). Status de saída coerente: 🟢 se tudo implementado; 🟡 com lista de débitos abertos.

### CA-02 — `_summary.md` da Sprint 06 escrito

- **Given** sprint 06 com status 🟡 "em andamento" no plano
- **When** agente verifica que migration `20260507000005` e Edge Function `sync-sheets` estão em prod
- **Then** `docs/memory/sprints/06/_summary.md` confirma entrega. Lista débitos remanescentes: ADR 0004 em proposed (resolvido por CA-03 desta story), Edge Function sem testes (resolvido por Sprint 07-A integration de auth, mas sync-sheets em si fica como débito P2 futuro), sync bi-direcional fora de escopo (não-débito), idempotência/retry da Edge Function (débito P2 futuro).

### CA-03 — ADR 0004 promovido a `Aceito`

- **Given** ADR em status `Proposto`
- **When** agente atualiza
- **Then** status muda para `Aceito`, data `2026-05-09`, nota explicativa adicionada no topo: "*Aceito retroativamente após verificação de que migration `20260507000005` e Edge Function `sync-sheets` estão em prod desde Sprint 06.*"

### CA-04 — Final Artifact da Sprint 06 retroativo

- **Given** ausência de `docs/memory/execution/2026-05-07-sprint-06-final.md`
- **When** agente cria
- **Then** artifact existe seguindo template das Sprints 02/03/04. Sumário ≤ 5 linhas, lista arquivos alterados (extraídos do git log), riscos conhecidos, próximo passo.

### CA-05 — Final Artifact da Sprint 05 retroativo

- **Given** ausência de `docs/memory/execution/2026-05-07-sprint-05-final.md`
- **When** agente cria
- **Then** idem CA-04 para Sprint 05.

### CA-06 — Índice global atualizado

- **Given** [`docs/memory/sprints/_summary.md`](../../memory/sprints/_summary.md) atualizado por último em 2026-05-07 (cobre Sprints 01–04)
- **When** agente atualiza
- **Then** acrescentadas seções para Sprint 05, 06, 07-A, 07-B (mesmo formato das anteriores). Data de atualização atualizada.

### CA-07 — Débitos não-implementados são tickets, não invenção

- **Given** durante a reconstrução, descoberta de que CA-X da Sprint 05 (ex.: "busca por email") não foi de fato implementado
- **When** agente preenche `_summary.md` da Sprint 05
- **Then** marca a CA como `[não implementado]` e adiciona à seção 2 ("O que ficou em aberto") como débito explícito com prioridade. **Não inventar** que foi implementado.

### CA-08 — `_summary.md` da Sprint 07-A escrito

- **Given** Sprint 07-A já fechada (DoR da Sprint 07-B)
- **When** Sprint 07-B chega em sua última story
- **Then** confirma que `_summary.md` da Sprint 07-A foi escrito como parte da DoD da própria 07-A; se não, escreve. Este CA é checagem, não entrega principal.

### CA-09 — `_summary.md` da Sprint 07-B escrito

- **Given** Sprint 07-B em fechamento
- **When** todas as stories 07B.1–07B.4 estiverem prontas
- **Then** `_summary.md` da 07-B é escrito como parte do fechamento desta story. Lista todos os débitos fechados nesta sprint e os que **continuam abertos** (race-condition LAST_ADMIN, sync bi-direcional Sheets, etc).

### CA-10 — Lista consolidada de débitos abertos

- **Given** fim da Sprint 07-B
- **When** humano abre `docs/memory/sprints/_summary.md`
- **Then** seção final "Débitos abertos pós-Sprint 07" lista (com prioridade) os débitos que **não foram fechados** após esta sprint dupla — para ficar visível qual é a próxima fronteira.

## 5. Modelagem de Dados

Nenhuma. Esta story é só documentação.

## 6. Escopo negativo

- ❌ Implementar débitos descobertos durante a arqueologia — só registrar.
- ❌ Reescrever ADR 0004 com novas seções — só promover status.
- ❌ Migrar histórico antigo de `console.log` para `lib/logger` — Story 07B.1 cobre o que precisa.
- ❌ Refatorar Edge Function `sync-sheets` — débitos identificados ficam para sprint futura.

## 7. Dependências

- Stories 07B.1, 07B.2, 07B.3 fechadas — esta story precisa do estado final do repositório para escrever `_summary.md` da Sprint 07-B.
- Sprint 07-A fechada e seu `_summary.md` escrito.
