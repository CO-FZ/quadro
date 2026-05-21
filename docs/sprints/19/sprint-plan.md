---
sprint: 19
title: CD Vercel + Cobertura TDD
status: pendente
inicio: 2026-05-21
objetivo: Estabelecer pipeline de deploy contínuo na Vercel e expandir cobertura de testes com TDD para utilitários críticos e rota /historico.
---

# Sprint 19 — CD Vercel + Cobertura TDD

- **Status:** PENDENTE
- **Início:** 21/05/2026

---

## Motivação

Dois déficits estruturais identificados:

1. **Ausência de CD**: merges em `main` não geram deploy automático. Deploy é manual, sujeito a esquecimento e inconsistência.
2. **Cobertura de testes incompleta**: funções de formato adicionadas na Sprint 14 (`formatDateBr`, `formatDateTimeBr`, `formatNomeCompleto`) não têm unit tests. A rota `/historico` (Sprint 18) não tem cobertura E2E. O botão de clear de busca não tem `aria-label`, bloqueando teste acessível e screen readers.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 19.1 | CD — Deploy contínuo na Vercel | S | pendente | Alto (operacional) |
| 19.2 | TDD — Cobertura de utilitários e rota /historico | S | pendente | Alto (qualidade) |

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

- [ ] `pnpm typecheck` verde
- [ ] `pnpm test:unit` verde com novos testes de `format.ts`
- [ ] Push em `main` dispara CD e gera URL de produção no GitHub Actions
- [ ] PR aberto dispara preview deploy com comentário automático de URL
- [ ] E2E `/historico` cobre: navegação, renderização de tabela, busca com atualização de URL
- [ ] Botão de clear de busca tem `aria-label="Limpar busca"`
