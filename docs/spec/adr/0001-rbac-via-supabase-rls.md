# ADR 0001 — RBAC via Supabase RLS

**Status:** aceito (retroativo)
**Data:** 2026-05-06
**Decisores:** Eng Carlos Eduardo
**Substitui:** —
**Substituído por:** —

> ADR retroativo. A decisão já está implementada em [supabase/migrations/20260506000000_user_management.sql](../../../supabase/migrations/20260506000000_user_management.sql) e [supabase/migrations/20260506000001_task_management.sql](../../../supabase/migrations/20260506000001_task_management.sql). Este documento existe para fechar a dívida do harness ([harness-retro-01.md §1.4](../../memory/harness-retro-01.md)) e tornar a decisão revisável.

---

## Contexto

O produto exige 3 papéis (Admin, Coordenador, Efetivo) com regras de autorização que cruzam tabelas (`profiles`, `tasks`, `task_assignees`, `whitelist`). Esquemas alternativos:

1. **Authorization-as-code no Next.js** — checagens em Server Actions/Route Handlers.
2. **RLS no Postgres** — Row-Level Security do Supabase, política por tabela.
3. **Híbrido** — RLS como guarda-rail, checagens em Server Actions para UX (mensagens claras de erro).

## Decisão

Adotar **(3) híbrido**, com RLS como camada **autoritativa**:

- `profiles.role` (enum `app_role`) é a fonte de verdade. Default `'efetivo'`.
- Toda tabela com dado autenticado tem `ENABLE ROW LEVEL SECURITY` antes de qualquer policy.
- Policies expressam a regra de negócio em SQL, sem depender de claim no JWT.
- Server Actions e UI consultam `profiles.role` para esconder controles e devolver `{ ok: false, code }` antes de bater no banco — é UX, não segurança.

## Mapa de policies (estado atual)

### `profiles`
| Operação | Quem | Política |
|---|---|---|
| SELECT (próprio) | qualquer auth | `auth.uid() = id` |
| SELECT (todos) | admin | `EXISTS (… role='admin')` |
| UPDATE | admin | `EXISTS (… role='admin')` |
| INSERT | — (sem policy) | feito por trigger `handle_new_user` (`SECURITY DEFINER`) |
| DELETE | — | cascata via `auth.users(id) ON DELETE CASCADE` |

### `tasks`
| Operação | Quem |
|---|---|
| SELECT | qualquer autenticado |
| INSERT | admin, coordenador |
| UPDATE | admin, coordenador, **ou** alocado (`task_assignees`) |
| DELETE | admin, coordenador |

### `task_assignees`
| Operação | Quem |
|---|---|
| SELECT | qualquer autenticado |
| ALL | admin, coordenador |

### `whitelist`
| Operação | Quem |
|---|---|
| ALL | admin |

## Consequências

**Positivas**
- Fonte única (Postgres) — clientes mobile/web futuros e jobs server-side respeitam a mesma autorização sem reimplementar.
- Não dá para "esquecer" a checagem em uma rota: a tabela recusa a query.
- Skill externa `supabase` já cobre testes de RLS.

**Negativas**
- Mensagens de erro do Postgres são opacas. Server Actions precisam mapear "RLS violation" → `code` legível.
- Política `Admins can view all profiles` é **recursiva** (SELECT em `profiles` para autorizar SELECT em `profiles`). Postgres lida, mas é uma armadilha — qualquer mudança nessa policy precisa rodar `EXPLAIN` para confirmar que não vira loop.
- Promoção do primeiro admin é manual (`UPDATE public.profiles SET role='admin' WHERE email = ...`). Não há fluxo automatizado — ver ADR 0002 §"Bootstrap do primeiro admin".
- A view `public.user_task_stats` herda RLS dos joins; auditar antes de expor para Efetivos.

## Riscos conhecidos a fechar

- [ ] Adicionar política de DELETE para `profiles` (hoje só cascata da `auth.users`; admin não pode revogar manualmente).
- [ ] Mapear erros de RLS para códigos `{ ok: false, code: 'forbidden' | ... }` em todas as Server Actions.
- [ ] Função `is_admin()` cacheada (`SECURITY DEFINER`, `STABLE`) para reduzir custo das policies admin — refator futuro, não bloqueia v1.

## Alternativas rejeitadas

- **(1) Apenas no Next.js**: descartado — uma rota esquecida vira CVE. Auditoria fica em código TS, não em SQL.
- **JWT claims com role**: descartado — invalida sessão a cada mudança de role; complica a US03 (mudança imediata de perfil).
