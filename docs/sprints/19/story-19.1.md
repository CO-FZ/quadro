---
id: 19.1
sprint: 19
title: CD — Deploy contínuo na Vercel
status: concluida
size: S
tipo: infra
depends_on: []
---

# Story 19.1 — Continuous Deployment na Vercel

## Problema

Sem CD, cada deploy exige intervenção manual. Risco de ambiente de produção ficar desatualizado após merges em `main`.

## Solução

Dois artefatos entregues:

### `vercel.json`

Configura pnpm como package manager explicitamente e fixa região `gru1` (São Paulo) para latência mínima com usuários brasileiros:

```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "framework": "nextjs",
  "regions": ["gru1"]
}
```

### `.github/workflows/cd.yml`

Dois jobs:

**`deploy-production`** — dispara via `workflow_run` após CI completar com sucesso em `main`. Faz checkout do SHA exato que passou no CI (evita race condition com commits simultâneos). Deploy com `vercel --prod`.

**`deploy-preview`** — dispara em todo PR. Deploy sem `--prod` (ambiente preview da Vercel). Comenta URL no PR, atualizando comentário existente em vez de criar novos (sem flood).

### `docs/runbooks/vercel-deploy.md`

Guia operacional com: setup inicial, variáveis de ambiente, secrets necessários, verificação pós-deploy, rollback e troubleshooting.

## Setup necessário (manual, uma vez)

1. `vercel link` no repositório local
2. Copiar `orgId` e `projectId` de `.vercel/project.json`
3. Adicionar 3 secrets no GitHub: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
4. Configurar env vars de produção no dashboard da Vercel (ver runbook)

## Arquivos

- `vercel.json` — novo
- `.github/workflows/cd.yml` — novo
- `docs/runbooks/vercel-deploy.md` — novo

## Critérios de aceite

- [x] `vercel.json` com região `gru1` e pnpm como install command
- [x] `cd.yml` com job de produção (workflow_run após CI) e job de preview (PR)
- [x] Preview job comenta/atualiza URL no PR sem flood de comentários
- [x] Runbook cobre setup, rollback e troubleshooting
- [ ] Secrets adicionados no GitHub (ação manual do admin)
- [ ] Primeiro deploy de produção verificado manualmente
