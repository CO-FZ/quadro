---
sprint: 17
title: Tab Transition Performance — Perceived Latency
status: concluida
inicio: 2026-05-20
conclusao: 2026-05-21
objetivo: Eliminar tela branca entre abas via skeletons + reduzir TTFB com queries paralelas e deduplicacao de fetch.
---

# Sprint 17 — Tab Transition Performance

- **Status:** CONCLUÍDA
- **Início:** 20/05/2026
- **Conclusão:** 21/05/2026
- **Objetivo:** Navegação entre abas percebida como imediata. Usuário vê skeleton ao clicar; dados chegam ao fundo.

---

## Diagnóstico

### Causa raiz 1 — Sem `loading.tsx` (maior impacto)

Nenhuma rota `(app)` possui `loading.tsx`. No App Router do Next.js, `loading.tsx` é envolvido em `<Suspense>` automaticamente: o browser renderiza o skeleton **imediatamente** ao clicar no link enquanto o RSC executa as queries no servidor. Sem esse arquivo, o usuário vê tela branca ou conteúdo congelado até `page.tsx` completar.

### Causa raiz 2 — Queries sequenciais

Cada `page.tsx` faz múltiplos `await` em série:

| Rota | Queries | Dependência |
|------|---------|-------------|
| `/kanban` | tasks · profiles · getUser · currentProfile | queries 1-3 independentes; 4 depende de 3 |
| `/dashboard` | stats · taskCounts | independentes |
| `/matriz` | tasks · profiles | independentes |

Queries independentes poderiam correr em paralelo com `Promise.all`, reduzindo TTFB em até 50–60%.

### Causa raiz 3 — Fetch de perfil duplicado

`layout.tsx` faz `getUser()` + `profiles.select('*')`. `kanban/page.tsx` faz `getUser()` + `profiles.select('id,role')` separadamente. São 4 hits no DB onde 2 bastam. Solução: `cache()` do React — deduplicates dentro da mesma render-pass RSC.

---

## Stories

| ID | Título | Size | Status | Impacto |
|----|--------|------|--------|---------|
| 17.1 | Loading skeletons para todas as rotas (app) | S | ✅ concluída | Maior (UX imediata) |
| 17.2 | Paralelizar queries independentes nas pages | XS | ✅ concluída | Médio (TTFB) |
| 17.3 | Deduplicar fetch de perfil com React cache() | XS | ✅ concluída | Médio (DB calls) |

---

## Dependências

- Sem nova dependência externa
- Sem schema change — sem migration

## Riscos

- **Story 17.1**: Skeleton de `/kanban` precisa refletir o layout de 5 colunas para evitar layout shift (CLS).
- **Story 17.3**: `cache()` do React deduplica apenas dentro da mesma requisição RSC (não persiste entre requests). Comportamento correto — não é cache de servidor, é dedup de render-pass.

## Critérios de aceite

- [x] `pnpm typecheck` verde
- [x] Clicar em qualquer aba exibe skeleton imediatamente (< 50ms visual response)
- [x] Zero tela branca entre transições de aba
- [x] `/kanban`, `/dashboard`, `/matriz`, `/profile`, `/admin` têm `loading.tsx`
- [x] Queries independentes correm com `Promise.all`
- [x] `getUser()` chamado uma única vez por render-pass no layout+kanban

## Commit de entrega

- `67adbe1` — feat: implement loading skeletons across app routes, optimize dashboard data fetching, and centralize supabase queries
