# Spec — Summary

**Fase encerrada em:** 2026-05-06 (parcial — só Design System + decisões de auth via ADR; tech spec geral fica para evolução por ADRs incrementais)
**Documentos:**
- [docs/spec/01-design-system.md](../../spec/01-design-system.md)
- [docs/spec/adr/0001-rbac-via-supabase-rls.md](../../spec/adr/0001-rbac-via-supabase-rls.md)
- [docs/spec/adr/0002-whitelist-emails-trigger.md](../../spec/adr/0002-whitelist-emails-trigger.md)

---

## Design System

- Paleta extraída da logo CO-FZ:
  - Primary `#1E40AF` (Blue 800) — azul escuro do mar / FAB.
  - Accent `#FACC15` / `#F59E0B` (Yellow/Amber) — amarelo do sol e do brasão.
  - Status: `#64748B` (To Do), `#F59E0B` (In Progress), `#10B981` (Done), `#EF4444` (Blocked).
- Tipografia: `Inter`, escala mobile-first.
- Tokens em `app/globals.css` via Tailwind v4 `@theme` — sem `tailwind.config.js`.
- Estilo Shadcn UI; bordas `rounded-lg`/`rounded-xl`; sombras sutis.
- Layout: header fixo + FAB inferior-direito no mobile; sidebar opcional no desktop.

## Arquitetura de auth e autorização

Decisões formalizadas em ADRs retroativos:

- **[ADR 0001](../../spec/adr/0001-rbac-via-supabase-rls.md)**: RBAC autoritativo via RLS no Postgres; checagens em Server Actions são apenas UX. 3 papéis: admin / coordenador / efetivo.
- **[ADR 0002](../../spec/adr/0002-whitelist-emails-trigger.md)**: gate de signup via trigger `BEFORE INSERT` em `auth.users`. Whitelist suporta e-mail exato e domínio.

## Stack confirmada

- Next.js 16 (App Router), Tailwind v4 (`@theme`), TypeScript estrito.
- `proxy.ts` em vez de `middleware.ts` (Next 16).
- Supabase: Postgres + Auth + RLS. Clients SSR em `lib/supabase/{client,server}.ts`.
- Pacote: pnpm.

## O que NÃO está na spec ainda

- Server Actions: contrato `{ ok: true } | { ok: false, code }` declarado em [AGENTS.md §12](../../../AGENTS.md), mas não há audit dos atuais.
- Sincronização Google Sheets — quando entrar, exige ADR (webhook + idempotência + HMAC se aplicável).
- Estratégia de testes (unit, integration, e2e) — só `pnpm test:unit` está na allowlist do AGENTS, sem framework declarado.

## Harness debt para PR contra a skill

Vários gaps documentados em [docs/memory/harness-retro-01.md §1.1, §1.4, §1.7](../harness-retro-01.md): falta fase Design Foundations no harness, falta gate de ADR para auth/RBAC, falta checklist de revisão de migration. Não bloqueiam Sprint 03; viram PR à parte.
