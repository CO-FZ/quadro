# Final Artifact — Sprint 04 / Story 04 (Whitelist com role + last-admin + pendentes)

**Data:** 2026-05-07
**Story:** [docs/sprints/04/story-04-whitelist-roles.md](../../sprints/04/story-04-whitelist-roles.md)
**Sprint plan:** [docs/sprints/04/sprint-plan.md](../../sprints/04/sprint-plan.md)
**ADR:** [0002 — Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md) (revisado em 2026-05-07)
**Plan Artifact (Gate 1):** aprovado em chat 2026-05-07

---

## Sumário (≤ 5 linhas)

Sprint 04 entrega: whitelist com `default_role` (admin escolhe role no convite), trigger `handle_new_user` reescrito para ler role da entry (precedência email > domínio > fallback efetivo), guard "último admin" em `updateUserRole` (rejeita rebaixar único admin com `LAST_ADMIN`), indicador visual "Pendente" para entries da whitelist sem profile correspondente. Migration aplicada via `db push` (sem reset). `tsc --noEmit` e `pnpm lint` passam.

## Arquivos alterados

| Arquivo | Operação | Razão |
|---|---|---|
| [`docs/spec/adr/0002-whitelist-emails-trigger.md`](../../spec/adr/0002-whitelist-emails-trigger.md) | atualizar | seção "Revisão 2026-05-07: `default_role`" (passo 0) |
| [`supabase/migrations/20260507000002_whitelist_default_role.sql`](../../../supabase/migrations/20260507000002_whitelist_default_role.sql) | criar | adiciona `default_role` em `whitelist`; reescreve `handle_new_user` com lookup de role; hardening `SET search_path = public` |
| [`lib/actions/admin.ts`](../../../lib/actions/admin.ts) | atualizar | `addToWhitelist` aceita `defaultRole`; `updateUserRole` ganha guard `LAST_ADMIN` |
| [`lib/supabase/types.ts`](../../../lib/supabase/types.ts) | atualizar | tipo `WhitelistEntry` exportado |
| [`components/features/AdminView.tsx`](../../../components/features/AdminView.tsx) | atualizar | form com select de role; helper `isEntryPending`; badges (role + Pendente); `useMemo` para `profileEmails` |
| [`docs/memory/sprints/04/_summary.md`](../sprints/04/_summary.md) | criar | resumo de fase |
| [`docs/memory/sprints/_summary.md`](../sprints/_summary.md) | atualizar | entrada Sprint 04 |

> `app/(app)/admin/page.tsx` **não** precisou de mudança — `profileEmails` é derivado client-side em `AdminView` via `useMemo` a partir do `profiles` que já era passado.

## Como testar

```bash
pnpm dev

# Como admin:
# 1. /admin → tab "Whitelist"
# 2. Adicionar fulano-teste@example.com com role "Coordenador" → entry aparece com badge "Coordenador" + 🕐 Pendente
# 3. Em browser anônimo / outra conta Google, logar com fulano-teste@example.com
#    (precisa estar liberado por OAuth provider — ou usar provedor próprio de teste)
# 4. Voltar ao /admin como admin original
# 5. Tab Whitelist: badge "Pendente" sumiu (profile criado)
# 6. Tab Usuários: fulano-teste aparece já como "Coordenador" (não "Efetivo")

# Last-admin guard:
# 7. Com apenas 1 admin (você), abrir tab Usuários e tentar mudar a própria role para Efetivo
# 8. Toast de erro: "Não é possível rebaixar o único admin do sistema..."
# 9. Promover outro usuário a admin → rebaixar o segundo admin → ok
# 10. Tentar rebaixar o último que sobrou → bloqueado novamente

# Verificações automáticas
pnpm exec tsc --noEmit  # passou ✅
pnpm lint               # passou ✅
```

## Riscos conhecidos

- **🟢 Migration aplicada em remoto** via `pnpm supabase db push --include-all` (sem reset). 6/6 migrations sincronizadas (`supabase migration list`).
- **🟡 Race condition no guard "último admin".** Se 2 admins se rebaixarem simultaneamente, ambos passam pelo `COUNT == 1` e ambos UPDATE rebaixam. Aceito como improvável em v1; futuro: `SELECT FOR UPDATE` ou CTE atômica.
- **🟡 Entry de domínio com role privilegiada.** Adicionar `@cofz.gov.br` com role `admin` faria todo email novo desse domínio entrar como admin. Documentado no ADR 0002 §"Riscos a fechar" — UI deveria avisar (Sprint 05+).
- **🟡 Pendentes de domínio:** se entry é `@cofz.gov.br` e existe ao menos 1 profile com email desse domínio, badge "Pendente" some. Decisão simplista (queue de "todos os do domínio que ainda não logaram" exigiria modelagem própria).

## Verificações executadas

- [x] `pnpm exec tsc --noEmit` → sem erros.
- [x] `pnpm lint` → sem erros.
- [x] Migration aplicada em remoto via `db push`.
- [x] `supabase migration list` → 6/6 sincronizadas.
- [ ] Smoke test manual com 2 personas — **pendente humano** (precisa segundo email Google).

## Harness debt produzida nesta sprint

- **Race condition em `LAST_ADMIN`** documentada como aceita para v1 — adicionar a `docs/runbooks/` futuro.
- **Sem suite de testes** para o trigger `handle_new_user` (precisaria pgTAP ou similar). Continua em débito da Sprint 03.

## Próximo passo sugerido

Sprint 05 candidatos:
1. Soft-delete / archived_at em `profiles` (gap 5).
2. Bulk add de emails na whitelist (gap 6).
3. Busca/filtro na lista de usuários (gap 4).
4. Logger estruturado para FORBIDDEN / LAST_ADMIN.
5. UI de aviso ao criar domínio com role privilegiada (débito do ADR 0002 §"Riscos").
6. Sincronização Google Sheets (US-05) — exige ADR 0004.

Confirmar com humano qual entra primeiro.
