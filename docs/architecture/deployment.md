# Deployment — Quadro CO-FZ

---

## Topologia

```text
GitHub ──CI (Actions)──▶ Vercel (Next.js)
                              │
                              └──▶ Supabase Cloud (PostgreSQL + Auth + Edge Functions)
```

---

## Ambientes

| Ambiente | Next.js | Banco | Auth |
|----------|---------|-------|------|
| Local dev | `pnpm dev` (localhost:3000) | Supabase local (Docker, porta 54321) | Supabase local |
| CI | ubuntu-latest runner | Supabase local (Docker nativo) | Supabase local |
| Produção | Vercel | Supabase Cloud | Supabase Cloud (Google OAuth) |

---

## Variáveis de ambiente

| Variável | Ambiente | Obrigatória |
|---------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | todos | sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | todos | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | sim (actions admin) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Supabase secrets | sim (Edge Function) |

Nunca commitadas. Configuradas em Vercel dashboard e `supabase secrets set`.

---

## Migrations

- Aplicadas localmente via `supabase db reset --local` (CI) ou `supabase start` (dev).
- Aplicadas em produção via `supabase db push` com aprovação humana.
- Histórico em `supabase/migrations/` — 10 migrations até Sprint 07-B.

---

## Edge Functions

- Deploy via `supabase functions deploy sync-sheets`.
- Runtime Deno — excluído de `tsconfig.json` e `.eslintrc`.
- Secrets injetados via `supabase secrets set`.

---

## Rollback

- Next.js: revert via Vercel dashboard (instantâneo).
- Migrações: nenhuma migration usa `DOWN` — rollback manual se necessário.
- Edge Functions: re-deploy da versão anterior.
