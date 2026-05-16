# Story 09.2: Premium Dark Mode UI

**Status:** DONE — 2026-05-16
**Sprint:** 09 — ver [sprint-plan.md](sprint-plan.md)
**ADRs relacionadas:** nenhum (design system, sem impacto em auth/schema/billing)

## 1. Visão geral

Atualizar `app/globals.css` para elevar o Dark Mode de "funcional" para "premium":
- Primary teal no dark mode (distingue dark de light, aumenta percepção de profundidade)
- Glassmorphism como utilitário CSS (`.glass`) disponível para cards/modais
- Fonte corrigida: `--font-sans` aponta para Inter sem fallback Geist não-carregado

## 2. Requisitos

- [x] Dark mode primary: teal (`oklch ~195°`) em vez de azul (`oklch ~260°`)
- [x] Glassmorphism: `--glass-bg` + `--glass-border` + classe utilitária `.glass`
- [x] `--font-sans` simplificado para `var(--font-inter), sans-serif`
- [x] `@theme inline` mapeado com variáveis glass
- [x] Backward compat: tokens existentes mantidos; nenhum componente quebrado

## 3. Implementação

- `app/globals.css`: dark mode primary → teal, adicionados `--glass-bg`/`--glass-border`, utilitário `.glass`, font-sans corrigido
