# CI/CD — Quadro CO-FZ

**Pipeline:** [.github/workflows/ci.yml](../../.github/workflows/ci.yml)

---

## Triggers

- Push em `main`
- Pull Request para `main`

---

## Jobs (paralelos)

| Job | Comando | Pré-requisito |
|-----|---------|---------------|
| typecheck | `pnpm typecheck` | Node 20 |
| lint | `pnpm exec eslint .` | Node 20 |
| unit | `pnpm test:unit` | Node 20 |
| integration | `pnpm test:integration` | Supabase CLI + Docker |
| db | `pnpm test:db` | Supabase CLI + Docker + pgTAP |
| e2e | `pnpm test:e2e` | Supabase CLI + Docker + Playwright + Next.js build |

---

## Setup Supabase em CI

Jobs `integration`, `db` e `e2e` usam `supabase/setup-cli@v1`:

```yaml
- uses: supabase/setup-cli@v1
  with: { version: latest }
- run: supabase start
- run: supabase db reset --local
```

Runners `ubuntu-latest` têm Docker nativo — sem necessidade de configuração adicional.

---

## Variáveis de ambiente em CI

| Variável | Jobs | Fonte |
|---------|------|-------|
| `SUPABASE_URL` | integration | hardcoded `http://127.0.0.1:54321` |
| `SUPABASE_ANON_KEY` | integration, e2e | `supabase status -o env` |
| `SUPABASE_SERVICE_ROLE_KEY` | integration | `supabase status -o env` |
| `NEXT_PUBLIC_SUPABASE_URL` | e2e | hardcoded |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | e2e build + run | `supabase status -o env` |

---

## Artefatos de falha

Job `e2e` faz upload de screenshots diff em caso de falha:

- Artefato: `playwright-screenshots`
- Path: `tests/e2e/snapshots/`
- Retenção: 7 dias

---

## Deploy

Feito via integração Vercel ↔ GitHub. Cada push em `main` após CI verde dispara deploy automático.

**Migrations remotas:** executadas manualmente via `supabase db push` com aprovação humana (ver [Gate 07C.G1](../sprints/07C/gate-07C.G1-migrations-remotas.md)).
