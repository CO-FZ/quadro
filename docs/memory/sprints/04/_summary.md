# Resumo Sprint 04 — 2026-05-07

**Owner da fase:** Eduardo Lima
**Sessões envolvidas:**
- [docs/memory/execution/2026-05-07-sprint-04-final.md](../../execution/2026-05-07-sprint-04-final.md)

**Status de saída:** 🟡 aprovado com ressalva — smoke test multi-persona pendente humano.

---

## 1. O que foi decidido

- **Whitelist com `default_role`** ([ADR 0002 rev](../../../spec/adr/0002-whitelist-emails-trigger.md)): admin define role na adição. Trigger `handle_new_user` faz lookup com precedência email exato > domínio > fallback efetivo.
- **Last-admin guard**: `updateUserRole` rejeita rebaixamento do único admin com `code: 'LAST_ADMIN'` e mensagem amigável.
- **Indicador "Pendente"**: derivado client-side via `useMemo` em `AdminView` — entries sem profile correspondente recebem badge 🕐.
- **Backward compat** garantida: `DEFAULT 'efetivo'` na coluna nova significa que entries antigas seguem comportamento idêntico.
- **Detecção client-side** preferida sobre nova query no servidor — `profileEmails` é Set derivado de `profiles` já carregado.

## 2. O que ficou em aberto (carregar para próxima fase)

- Smoke manual com 2 personas (admin + convidado novo) — precisa segundo email Google.
- UI de aviso ao adicionar domínio com role privilegiada — débito do ADR 0002.
- Audit log de criação automática com role ≠ efetivo — débito do ADR 0002.
- Race condition em `LAST_ADMIN` — aceita para v1, documentar em runbook futuro.

## 3. ADRs criados nesta fase

| ADR | Título | Status |
|---|---|---|
| 0002 (rev) | Whitelist com `default_role` | aceito (revisão 2026-05-07) |

## 4. Padrões salvos na Knowledge Base

- **`SET search_path = public`** em todas as funções `SECURITY DEFINER` reescritas — replica padrão da migration `20260506000002`.
- **Detecção de pendentes via `Set` client-side** em vez de nova query — economiza round-trip quando o dado já está em scope.
- **`{ ok: false, code: 'LAST_ADMIN' }`** estabelece padrão para erros de **invariant de domínio** (não permission, não DB). Replicar em outros guards de invariant futuros.
- **Migration idempotente:** `ADD COLUMN IF NOT EXISTS` + `DROP TRIGGER IF EXISTS` + `DROP FUNCTION IF EXISTS ... CASCADE` antes do CREATE.

## 5. Métricas / artefatos verificáveis

- `pnpm exec tsc --noEmit` ✅
- `pnpm lint` ✅
- `supabase db push` aplicou 1 migration sem erro ✅
- `supabase migration list` → 6 local = 6 remoto ✅
- Smoke manual 2 personas — pendente

## 6. Avisos para o próximo agente

- **Migration via `db push` funciona** quando local↔remoto sincronizados (não como na Sprint 03 que precisou reset). Antes de criar migration nova, **sempre rodar `supabase migration list`** primeiro.
- **`useMemo(() => new Set(...))`** é o padrão para detecção de pendentes — não duplique query.
- **Entry de domínio com role privilegiada é footgun.** Avisar via UI quando alguém criar `@dominio` com role admin/coord.
- **`isEntryPending` é client-side** — fonte de verdade segue sendo o banco; é UX, não autoridade.

## 7. Harness debt observada

- **Sem teste automatizado para trigger** Postgres (`handle_new_user`) — toda mudança no trigger exige smoke manual. Considerar adicionar pgTAP em sprint dedicada de testes.
- **Diagnostics IDE stale** após `replace_all` em strings duplicadas (caso `isPending` colidiu com helper local) — proposta para skill: ao usar `replace_all`, agente deve preferir nomes únicos para helpers locais.
