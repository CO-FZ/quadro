# Roadmap — Quadro CO-FZ

**Derivado de:** [PRD §4.3](../prd/00-prd.md) + débitos consolidados em [_summary.md](../memory/sprints/_summary.md)

---

## V1 — Entregue

Todas as US do PRD fechadas. Suíte de testes completa (Camadas 1–4). Infraestrutura CI/CD operacional.

## V1.1 — Hardening técnico (Sprint 08–09)

- Estrutura canônica de docs (Sprint 08)
- Primeira fatia de refatoração para Modular Monolith (Sprint 09 — somente `task-board/domain`)
- ADR 0001 revisado para `is_admin()` SECURITY DEFINER (Sprint 09)
- Promoção ADR 0005 → `aceito` (após validação Docker local)

## V2 — Produto (pós-v1, não compromissivo)

| Feature | Origem | Prioridade |
|---------|--------|------------|
| Alertas para tarefas atrasadas | PRD §4.3 | P1 |
| Exportação de relatórios PDF | PRD §4.3 | P2 |
| Audit log para `updateUserRole` pós-cadastro | débito 07B.3 | P1 |
| Migração total de strings para `lib/i18n` | débito 07B.4 | P2 |

## Backlog técnico (P2/P3)

| Item | Contexto |
|------|---------|
| Race condition `LAST_ADMIN` (transação real) | débito Sprint 01 |
| URL/anon-key hardcoded em migration `20260507000005` → `app.settings.*` | débito Sprint 06 |
| Retry/dead-letter Edge Function `sync-sheets` | débito Sprint 06 |
| Trace IDs / correlation IDs no logger | débito Sprint 07-B |
| Visual regression desktop (E2E hoje só mobile) | débito Sprint 07-C |
| Sincronização bidirecional Sheets | fora de escopo PRD |

## Trilhas arquiteturais de longo prazo

Ver [Sprint 08 sprint-plan §5](../sprints/08/sprint-plan.md) para o roadmap completo de Sprints 08–18 (Engineering Foundation → Open Source Maturity).
