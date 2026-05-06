# Execução — Bootstrap de Auth (Sprint 01)

**Data:** 2026-05-06
**Story:** [docs/sprints/01/story-01-user-management.md](../../sprints/01/story-01-user-management.md) — recortes de US04 (server-side guard schema) e US05 (role default).
**Sessão de origem (log bruto):** [docs/memory/session-01-discovery-auth.md](../session-01-discovery-auth.md)
**ADRs ratificados retroativamente:** [0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [0002 Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md)
**Commits relacionados:** `36301d7` (design system), `95f91fd` (auth + tasks).

---

## Sumário (≤ 5 linhas)

Subiu fundação de autenticação: enum `app_role`, tabelas `whitelist`/`profiles`, triggers de gate (whitelist) e de criação automática de perfil com role `efetivo`, todas as RLS de `profiles` e `whitelist`. Adicionados clients SSR Supabase (`lib/supabase/{client,server}.ts`) e `proxy.ts` (Next 16) para refresh automático de sessão. Página de login Google em `app/(marketing)/login/` e callback em `app/auth/callback/`. Seed da whitelist com o admin bootstrap. ADRs e gate humano formal (Plan Artifact) **não foram produzidos no momento da execução** — registrados retroativamente como dívida do harness.

## Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/migrations/20260506000000_user_management.sql` | nova migration: enum, tabelas, triggers, RLS, seed |
| `lib/supabase/client.ts`, `lib/supabase/server.ts` | clients SSR Supabase |
| `proxy.ts` | refresh de sessão (Next 16) |
| `app/(marketing)/login/page.tsx` | UI de login Google |
| `app/auth/callback/route.ts` | troca de code por sessão |
| `app/globals.css` | tokens Tailwind v4 (`@theme`) com paleta CO-FZ |
| `docs/spec/01-design-system.md` | princípios visuais e paleta |
| `docs/sprints/story-01-user-management.md` | story original (depois movida para `01/`) |

## Como testar

```bash
pnpm dev
# 1. Acessar / → redireciona para /login
# 2. Clicar em "Entrar com Google"
# 3. Logar com email da whitelist → redireciona para o app autenticado
# 4. Logar com email FORA da whitelist → erro do trigger (mensagem genérica hoje)
# 5. No console Supabase, executar:
#    SELECT * FROM public.profiles;
#    e confirmar que o admin foi promovido manualmente:
#    UPDATE public.profiles SET role='admin' WHERE email='eduardolimacesl@gmail.com';
```

## Riscos conhecidos

- Erro de whitelist barrada chega à UI como mensagem genérica de OAuth — pendente mapear em `app/auth/callback`.
- Policy `Admins can view all profiles` é auto-referencial; mudanças nela exigem `EXPLAIN`.
- Trigger só cobre `BEFORE INSERT` em `auth.users` — UPDATE de email escapa. Pendente.
- Promoção do primeiro admin é manual via SQL — deliberado, ver [ADR 0002](../../spec/adr/0002-whitelist-emails-trigger.md) §"Bootstrap".

## Harness debt produzida nesta execução

Catalogada em [docs/memory/harness-retro-01.md](../harness-retro-01.md). Itens locais (§4) sendo fechados na sessão "Saúde de Processo" de 2026-05-06 (esta mesma data). Itens globais (§3) viram PR contra a skill `agent-product-harness`.

## Próximo passo sugerido

Sprint 03 com Plan Artifact: ou (a) fechar Sprint 01 entregando UI Admin de Whitelist + roles, ou (b) hardening transversal (mensagens tipadas, helpers de role guard, audit do FAB).
