# Auth — Quadro CO-FZ

**Provider:** Supabase Auth (Google OAuth)
**Restrição:** whitelist de emails/domínios

---

## Fluxo OAuth

```text
[Browser] → /login → Supabase Auth (Google OAuth)
                           │
                           ▼
                    Google OAuth consent
                           │
                           ▼
                    Callback: /auth/callback
                           │
                    proxy.ts (Next 16 middleware)
                           │
                    ┌──────┴──────┐
                    │             │
             sucesso           erro
                    │             │
             /kanban         /login?error=<code>
```

---

## Trigger `check_whitelist`

Executa BEFORE INSERT e BEFORE UPDATE (coluna `email`) em `auth.users`.
Se email não está na whitelist (por endereço exato ou domínio), retorna `P0001: not_authorized`.

---

## Trigger `handle_new_user`

Executa AFTER INSERT em `auth.users`.
Cria `public.profiles` com role lookup:

1. Email exato na whitelist → `default_role` da entrada.
2. Domínio na whitelist → `default_role` da entrada de domínio.
3. Fallback → `efetivo`.

Audit log em `privileged_role_audit` se role atribuída for `admin` ou `coordenador`.

---

## Mapeamento de erros

| Código Supabase | Código UI | Mensagem exibida |
|----------------|-----------|-----------------|
| `P0001: not_authorized` | `not_authorized` | "Acesso negado. Seu email não está autorizado." |
| Outros erros OAuth | `auth_failed` | "Não foi possível autenticar. Tente novamente." |

---

## `requireRole(roles)`

Porta de autorização server-side em `lib/auth/require-role.ts`.
Lança `UNAUTHORIZED` se a sessão não contiver role permitida.
Chamada no topo de toda Server Action que modifica dados.

---

## Sessão

Gerenciada via `@supabase/ssr` — cookies HttpOnly. `proxy.ts` (não `middleware.ts`) faz refresh de token.
