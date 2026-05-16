# Git Flow — Quadro CO-FZ

---

## Branches

| Branch | Propósito |
|--------|----------|
| `main` | produção — base de PRs |
| `claude/<slug>` | branches geradas por agente |
| `feat/<slug>` | novas features |
| `fix/<slug>` | bug fixes |
| `chore/<slug>` | manutenção, docs |

Não há `develop` — flow direto para `main` via PR.

---

## Conventional Commits

Formato: `<type>(<scope>): <descrição>`

| Tipo | Uso |
|------|-----|
| `feat` | nova feature |
| `fix` | bug fix |
| `chore` | manutenção, dependências |
| `docs` | documentação |
| `refactor` | refatoração sem mudança comportamental |
| `test` | testes |
| `ci` | mudanças de CI/CD |

Exemplos:

```
feat(kanban): add drag-and-drop optimistic update
fix(auth): map not_authorized RLS error to UI message
docs(adr): open ADR 0006 for modular monolith
```

---

## Gates

### Pre-commit (local — rápido)

```bash
pnpm typecheck && pnpm lint && pnpm test:unit
```

### Pre-merge (CI — completo)

```bash
pnpm typecheck && pnpm lint && pnpm test:unit
pnpm test:integration && pnpm test:db && pnpm test:e2e
```

Detalhes em [ci-cd.md](ci-cd.md).

---

## Regras

- Nunca force push em `main`.
- Nunca `--no-verify` exceto com justificativa explícita.
- Nenhum `git push` sem aprovação humana.
- Commits de agente incluem `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.
