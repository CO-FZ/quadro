# Story 07B.3: Audit log de criação automática com role ≠ efetivo + smoke anti-spoofing fixture

**Sprint:** 07-B — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0002 (rev) — Whitelist com `default_role`](../../spec/adr/0002-whitelist-emails-trigger.md), [ADR 0003 — Defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito de [ADR 0002 rev §"Riscos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md): "Considerar audit log: registrar quando um profile é criado com role ≠ `efetivo` via whitelist — para auditoria de privilégios automáticos." E [Sprint 03 §2](../../memory/sprints/03/_summary.md): "Smoke anti-spoofing (curl com JWT de efetivo tentando spoofar `created_by`) — script de teste a anexar."

---

## 1. Visão Geral

Dois débitos coesos:

1. **Audit log persistente** quando o trigger `handle_new_user` cria um profile com role `admin` ou `coordenador`. Hoje nada registra esse evento — se uma whitelist mal configurada criar 5 admins por engano, não há trilha. Criar tabela `public.privileged_role_audit` com row por evento.

2. **Smoke anti-spoofing automatizado.** Story 07A.2 já cobre via integration test (CA-11/12), mas a Sprint 03 prometeu "script de smoke anexado". Esta story formaliza esse script como fixture documentada — útil para validação manual em ambientes que não têm Supabase local (staging, prod read-only).

## 2. Requisitos de Negócio (Regras)

- **Audit log:** toda vez que `handle_new_user` cria profile com role ≠ `efetivo`, INSERT em `public.privileged_role_audit` com `{ profile_id, email, role, source: 'whitelist_email' | 'whitelist_domain', whitelist_entry_id, created_at }`.
- **Visibilidade do audit log:** apenas admin pode ler. RLS: `SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role='admin'))`.
- **UI:** `/admin` ganha aba opcional "Auditoria" (badge "novo") listando os últimos 50 eventos. **Read-only.**
- **Retenção:** sem TTL automático em v1 — audit log é append-only. Se ficar grande no futuro, plano é truncar manualmente após exportação.
- **Smoke anti-spoofing:** script bash em `tests/smoke/anti-spoofing.sh` que recebe `SUPABASE_URL` e `EFETIVO_JWT` por env, faz 3 curl POST ilustrando os bloqueios:
  1. INSERT em `tasks` com `created_by = <admin_id>` → espera 403/RLS error.
  2. INSERT em `task_assignees` com `user_id = <admin_id>` → espera 403/RLS error.
  3. UPDATE em `tasks` (sem ser assignee) → espera 0 rows affected ou erro RLS.

## 3. Requisitos técnicos

- **Migration:** `supabase/migrations/<timestamp>_privileged_role_audit.sql` cria tabela + RLS + trigger.
- **Trigger refactor:** `handle_new_user` ganha INSERT condicional na nova tabela. **Cuidado:** trigger é `SECURITY DEFINER` — INSERT na audit usa privilégio do dono da função (postgres), bypassando RLS da audit table. RLS da audit é só para leitura (SELECT) por admin.
- **UI:** `components/features/AdminView.tsx` ganha tab "Auditoria" condicional (`if role === 'admin'`). Lista paginada simples (50 por página, sem filtro por enquanto).
- **Server Action:** `lib/actions/admin.ts` ganha `getPrivilegedRoleAudit({ limit, offset })` retornando rows para a UI.
- **Smoke script:** documentado em `tests/smoke/README.md`. Executável local com `bash tests/smoke/anti-spoofing.sh`. CI **não** roda (depende de URL/JWT externo); é ferramenta humana.

## 4. Critérios de Aceite

### CA-01 — Migration de audit log

- **Given** Sprint 07-B em execução
- **When** agente cria migration `<timestamp>_privileged_role_audit.sql`
- **Then** tabela `public.privileged_role_audit` com colunas `(id, profile_id, email, role, source, whitelist_entry_id, created_at)`, índice em `(created_at DESC)`, RLS habilitada com policy SELECT só admin.

### CA-02 — Trigger atualizado

- **Given** mesma migration ou subsequente
- **When** `handle_new_user` é reescrito
- **Then** após criar profile com role `admin`/`coordenador`, faz INSERT na audit. Confirma via integration test: criar user via signup com email exato em entry de role privilegiada → 1 row em `privileged_role_audit`.

### CA-03 — Audit log não falha signup

- **Given** trigger atualizado
- **When** INSERT na audit table falha por qualquer motivo (constraint, etc)
- **Then** signup não pode ser bloqueado pelo audit. Documentar política: trigger captura exceção do INSERT da audit em bloco `EXCEPTION WHEN OTHERS THEN ... NULL` — registrar via `RAISE WARNING` mas continuar. Audit é best-effort.

### CA-04 — RLS da audit table

- **Given** integration test
- **When** efetivo/coord tenta SELECT em `privileged_role_audit`
- **Then** retorna 0 rows (ou erro). Admin SELECT vê todas as rows.

### CA-05 — UI: aba Auditoria

- **Given** admin em `/admin`
- **When** clica em nova aba "Auditoria"
- **Then** lista as últimas 50 entries com colunas: data, email, role, source, link para o whitelist entry (se ainda existir). Tabela com layout consistente com aba Usuários.

### CA-06 — UI: aba Auditoria escondida para não-admin

- **Given** coord/efetivo (que não pode acessar `/admin` mesmo, mas se de alguma forma chegasse)
- **When** componente renderiza
- **Then** aba Auditoria não aparece. Defesa em camadas: server-side já bloqueia rota; aba também não renderiza no client.

### CA-07 — Smoke script anti-spoofing

- **Given** dev tem Supabase local rodando + JWT de efetivo válido (gerado via fixture)
- **When** roda `SUPABASE_URL=... EFETIVO_JWT=... ADMIN_USER_ID=... bash tests/smoke/anti-spoofing.sh`
- **Then** script executa 3 cenários, imprime PASS/FAIL para cada um, sai com código 0 se todos PASS. Saída clara para humano.

### CA-08 — Documentação do smoke

- **Given** `tests/smoke/README.md`
- **When** dev abre
- **Then** encontra: o que cada cenário valida, como gerar `EFETIVO_JWT` (referência à fixture de Story 07A.2), quando usar (validação em staging/prod read-only, não substitui a suíte CI).

### CA-09 — Backfill de eventos passados

- **Given** banco tem profiles existentes com role `admin`/`coordenador` criados antes desta story
- **When** migration roda
- **Then** **não** faz backfill automático (não temos como saber se foram criados via whitelist ou via `UPDATE` manual). Documentar limitação explicitamente em `_summary.md` da Sprint 07-B: "Audit log começa do zero; eventos anteriores não auditados."

## 5. Modelagem de Dados

```sql
CREATE TABLE public.privileged_role_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('whitelist_email','whitelist_domain','manual')),
  whitelist_entry_id UUID REFERENCES public.whitelist(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.privileged_role_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ler audit log"
  ON public.privileged_role_audit
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role='admin'));

-- Sem policies de INSERT/UPDATE/DELETE — só trigger SECURITY DEFINER pode escrever.
CREATE INDEX idx_privileged_role_audit_created_at ON public.privileged_role_audit(created_at DESC);
```

## 6. Escopo negativo

- ❌ Audit log para mudanças de role pós-cadastro (`updateUserRole`) — útil mas escopo separado. Esta story só cobre criação automática via trigger.
- ❌ Backfill de eventos históricos.
- ❌ Filtros / busca na UI de Auditoria — primeira versão é lista cronológica simples.
- ❌ Export CSV — débito futuro.
- ❌ Roda smoke script no CI — é ferramenta humana, não regression test.

## 7. Dependências

- Sprint 07-A fechada (suíte de testes operante).
- Story 07B.1 (logger usado em pontos relacionados, não bloqueante mas facilita debug).
- Story 07B.2 (i18n base) — UI desta story usa as chaves se já existirem.
