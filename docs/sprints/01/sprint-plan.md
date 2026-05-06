# Sprint 01 — Gestão de Usuários, Roles e Whitelist

**Objetivo de sprint:** estabelecer a base de autenticação e autorização do produto. Sem essa base, nenhuma feature de tarefa é segura.

**Data de início:** 2026-05-06
**Status:** 🟡 entregue parcialmente (auth + schema + clients SSR; UI Admin pendente)

---

## Stories

| ID | Título | Status | Arquivo |
|---|---|---|---|
| US01 | Painel de Controle de Usuários (Admin) | ⬜ pendente | [story-01-user-management.md §US01](story-01-user-management.md) |
| US02 | Cadastro de E-mails na Whitelist (Admin) | ⬜ pendente | [story-01-user-management.md §US02](story-01-user-management.md) |
| US03 | Alteração de Perfil de Acesso (Admin) | ⬜ pendente | [story-01-user-management.md §US03](story-01-user-management.md) |
| US04 | Server-side guard de criação de tarefas | 🟢 schema OK / 🟡 UI guard parcial | [story-01-user-management.md §US04](story-01-user-management.md) |
| US05 | Atribuição automática de role `efetivo` | 🟢 entregue (trigger `handle_new_user`) | [story-01-user-management.md §US05](story-01-user-management.md) |

## ADRs aplicáveis

- [ADR 0001 — RBAC via Supabase RLS](../../spec/adr/0001-rbac-via-supabase-rls.md)
- [ADR 0002 — Whitelist via trigger](../../spec/adr/0002-whitelist-emails-trigger.md)

## Já entregue (sessão 01 — 2026-05-06)

- Migrations [`20260506000000_user_management.sql`](../../../supabase/migrations/20260506000000_user_management.sql) com:
  - Enum `app_role`, tabelas `whitelist` + `profiles`, RLS, triggers de whitelist e perfil padrão.
  - Seed da whitelist com `eduardolimacesl@gmail.com`.
- Clients SSR Supabase em `lib/supabase/{client,server}.ts`.
- `proxy.ts` com refresh de sessão por requisição (Next 16).
- Login via Google em `app/(marketing)/login/` e callback em `app/auth/callback/`.

## Pendente (vira Sprint 03)

- UI Admin para Whitelist (criar/listar/remover regras de e-mail e domínio).
- UI Admin para alteração de role com guarda "não pode remover o último admin" (US03).
- Mapeamento de erros de RLS / trigger para `{ ok: false, code }` em todas as Server Actions já existentes.
- Logging estruturado de tentativas de signup barradas pelo trigger.

## Exit criteria

- [x] Schema + RLS + triggers em produção
- [x] Auth Google funcional fim-a-fim
- [ ] UI Admin para Whitelist e roles
- [ ] Server Actions com erros tipados
- [x] ADRs 0001 e 0002 ratificados
- [ ] `_summary.md` da Sprint 01 escrito ao fechar (parcial — depende das UIs Admin)
