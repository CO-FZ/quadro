---
sprint: 19
title: CD Vercel + Cobertura TDD
status: concluida
inicio: 2026-05-21
conclusao: 2026-05-21
objetivo: Estabelecer pipeline de deploy contínuo na Vercel e expandir cobertura de testes com TDD para utilitários críticos e rota /historico.
---

# Sprint 19 — CD Vercel + Cobertura TDD

- **Status:** CONCLUÍDA
- **Início:** 21/05/2026
- **Conclusão:** 21/05/2026

---

## Motivação

Dois déficits estruturais identificados:

1. **Ausência de CD**: merges em `main` não geram deploy automático. Deploy é manual, sujeito a esquecimento e inconsistência.
2. **Cobertura de testes incompleta**: funções de formato adicionadas na Sprint 14 (`formatDateBr`, `formatDateTimeBr`, `formatNomeCompleto`) não têm unit tests. A rota `/historico` (Sprint 18) não tem cobertura E2E. O botão de clear de busca não tem `aria-label`, bloqueando teste acessível e screen readers.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 19.1 | CD — Deploy contínuo na Vercel | S | ✅ concluída | Alto (operacional) |
| 19.2 | TDD — Cobertura de utilitários e rota /historico | S | ✅ concluída | Alto (qualidade) |

---

## Dependências

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` como secrets no GitHub Actions (manual, admin do repo)
- Variáveis de ambiente de produção configuradas no dashboard da Vercel (ver `docs/runbooks/vercel-deploy.md`)
- Sem nova dependência de pacote

## Riscos

- **CD**: primeiro deploy requer setup manual (`vercel link` local). Documentado no runbook.
- **Preview deploy em PRs**: depende de `VERCEL_TOKEN` com scope correto. Token de projeto não serve — usar token de conta (Full Account).
- **TDD/E2E historico**: testes de busca dependem de dados seed. Seed deve conter ao menos 1 tarefa `finalizada` e 1 `arquivada`.

## Critérios de aceite

- [x] `pnpm typecheck` verde
- [x] `pnpm test:unit` verde — 108 testes, 9 arquivos (inclui 16 casos de `format.test.ts`)
- [x] `cd.yml` implementado — production via `workflow_run` após CI, preview via PR com comentário auto-atualizado
- [x] E2E `/historico` — 5 cenários (nav, headers, busca→URL, clear→URL, estado vazio)
- [x] Botão de clear tem `aria-label="Limpar busca"`
- [ ] Push em `main` dispara CD — requer setup manual de secrets (ver runbook §3)
