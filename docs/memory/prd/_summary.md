# PRD — Summary

**Fase encerrada em:** 2026-05-06 (status `📝 draft` ratificado para entrar em Spec — aprovações formais Sponsor/Eng-lead pendentes em [PRD §14](../../prd/00-prd.md))
**Versão:** v1.0
**PRD de origem:** [docs/prd/00-prd.md](../../prd/00-prd.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)

---

## TL;DR

Resolver a desorganização de planilhas concorrentes da CO-FZ entregando **Kanban interativo + Dashboard mobile-first** para DT e DA. Sucesso = 100% de adesão diária. v1 hospedada em Vercel + Supabase.

## Personas

- **Membro da Equipe (DT/DA)**: registra atividades diariamente pelo celular. Necessidade primária = registro fluido com poucos cliques.
- **Gestor (Eng Carlos Eduardo)**: avalia progresso semanal, redistribui carga.

## Escopo v1

- Login Google via Supabase Auth (whitelist).
- Kanban mobile-first com 3 colunas mínimas (PRD usa "A Fazer / Fazendo / Concluído"; spec evoluiu para 4 colunas — Backlog/Alocada/Em Desenvolvimento/Finalizada — alinhar PRD na próxima revisão).
- Dashboard com totais por pessoa e status.
- Sincronização Google Sheets (P1 — não trava launch).

## Fora de escopo v1

- Folha de pagamento. Estoque/materiais. Auth corporativo além do Gmail.

## Stories registradas

| ID | Story | Status |
|---|---|---|
| US-01 | Login Gmail | 🟢 entregue |
| US-02 | Visualização Kanban mobile | 🟡 UI entregue, validação mobile pendente |
| US-03 | CRUD de status com poucos cliques | 🟡 idem |
| US-04 | Dashboard gerencial | 🟡 idem |
| US-05 | Sync Google Sheets | ⬜ não iniciado |

## NFRs ratificados

- LCP < 2.5s p75; INP < 200ms p75
- Mobile-first absoluto
- Stack: Next 16 (App Router), Tailwind v4, TypeScript

## Decisões que a fase deixa para Spec / ADR

- Restrição de acesso por whitelist é P0 (US-01, marcado 🟡 no PRD §6) → resolvido em [ADR 0002](../../spec/adr/0002-whitelist-emails-trigger.md).
- Sync com Google Sheets = "rotas assíncronas sólidas + logs" → quando entrar, exigirá ADR próprio (webhook + idempotência).

## Lacunas / harness debt

- PRD §6 (US-02 / US-03) usa colunas Kanban diferentes das que a story 02 e o glossário usam. **Action:** atualizar PRD na revisão da Sprint 03 para a nomenclatura canônica.
- Sponsor / Eng-lead em [PRD §14](../../prd/00-prd.md) ainda como ⬜. Não bloqueia execução porque é a mesma pessoa, mas gate formal por boa higiene precisa ser marcado.
