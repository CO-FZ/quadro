# Coding Standards — Quadro CO-FZ

**Fonte de autoridade:** [AGENTS.md §3-4](../../AGENTS.md) (prevalece em caso de conflito)
**Este documento:** referência de navegação rápida para novos devs/agentes.

---

## Stack

| Camada | Tecnologia | Versão mínima |
|--------|-----------|---------------|
| Framework | Next.js App Router | 16.2+ |
| Estilo | Tailwind v4 (`@theme` em `globals.css`) | v4 |
| Linguagem | TypeScript strict (`"strict": true`) | 5.x |
| Banco/Auth | Supabase | — |
| Package manager | pnpm | 9.x |

**Proibido:**

- `tailwind.config.js` (Tailwind v4 usa `@theme`)
- `npm install` / `yarn`
- `any` implícito — use `unknown` + narrowing ou tipos discriminados
- API routes exceto webhooks externos documentados

---

## Regras de componente

1. Props interface explícita (sem `React.FC`), export nomeado.
2. Server Component por default. `"use client"` só com `useState`, `useEffect`, listeners ou hooks de browser.
3. Sem `useEffect` para data fetching. Use Server Components ou TanStack Query (quando adotado em Sprint 10).
4. Sem `localStorage` direto — encapsular em hook tipado com fallback SSR.
5. Acessibilidade: `role`/`aria` correto, foco visível, contraste mínimo AA.
6. Mensagens de UI: centralizar em `lib/i18n`.

---

## Mutações e estado

- Mutações via **Server Actions** (contrato Zod + retorno discriminado `{ ok: true } | { ok: false, code }`).
- Cache com `"use cache"` explícito.
- Sem `console.log` — use `lib/logger`.
- Sem secrets hardcoded.

---

## Débito técnico rastreado

| Item | Prioridade | Sprint |
|------|-----------|--------|
| `is_admin()` SECURITY DEFINER sem ADR | P1 | ADR 0001 revisão — Sprint 09 |
| Race condition `LAST_ADMIN` | P3 | backlog |
| URL/anon-key hardcoded em migration 20260507000005 | P2 | backlog |

---

## Estrutura de pastas (atual)

```text
app/
  (marketing)/    ← rotas públicas
  (app)/          ← rotas autenticadas
components/
  ui/             ← primitives
  features/       ← componentes de domínio
lib/
  actions/        ← Server Actions
  auth/           ← requireRole, helpers de autorização
  i18n/           ← mensagens UI
  logger/         ← logger estruturado
  supabase/       ← clients SSR/server
  utils/          ← helpers puros
```

**Futuro (Sprint 09+):**

```text
src/
  modules/
    task-board/   ← primeiro módulo refatorado
    identity/
    ...
  shared/
```

Ver [clean-architecture.md](../architecture/clean-architecture.md) e [ADR 0006](../spec/adr/0006-modular-monolith-clean-architecture.md).
