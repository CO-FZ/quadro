# ADR 0002 — Whitelist de e-mails via trigger Postgres

**Status:** aceito (retroativo)
**Data:** 2026-05-06
**Decisores:** Eng Carlos Eduardo
**Substitui:** —
**Substituído por:** —

> ADR retroativo. Decisão já está em [supabase/migrations/20260506000000_user_management.sql:24-51](../../../supabase/migrations/20260506000000_user_management.sql).

---

## Contexto

A v1 só pode admitir membros da Comissão de Obras de Fortaleza (CO-FZ). O Supabase Auth com provider Google aceita por padrão **qualquer Gmail**. Precisamos de um gate antes da criação do usuário, com duas formas de regra: e-mail exato (`fulano@gmail.com`) e domínio (`@cofz.gov.br`).

Alternativas:

1. **Provider OAuth restrito por workspace** (Google Workspace `hd=`). Inviável: equipe usa contas pessoais Gmail.
2. **Pós-login**: checar e deletar usuário se não estiver na whitelist. Janela de race + perfil já criado.
3. **Pré-insert no `auth.users`**: trigger Postgres `BEFORE INSERT` que `RAISE EXCEPTION` se o e-mail não estiver na whitelist.
4. **Checagem na Server Action de callback** (`app/auth/callback`). Bypass possível se alguém chamar o Supabase Auth direto.

## Decisão

Adotar **(3) trigger pré-insert**. A whitelist é uma tabela `public.whitelist` com coluna `identifier TEXT UNIQUE`. A função `public.check_whitelist()` (`SECURITY DEFINER`) é chamada antes de cada INSERT em `auth.users` e bate `NEW.email` contra `identifier` exato **OU** contra `'@' || split_part(NEW.email, '@', 2)`.

Se nenhuma regra bater, levanta exceção e o signup falha.

## Consequências

**Positivas**
- Gate no nível do banco — qualquer cliente (web, mobile, CLI) é barrado simétricamente.
- Whitelist é dado, não código: admin gerencia via UI sem deploy.
- Vazia ≠ aberta. Whitelist vazia bloqueia 100% dos signups (decisão deliberada — ver §"Bootstrap").

**Negativas**
- Mensagem da exceção (`Acesso negado: Seu e-mail não consta na Whitelist.`) chega ao Supabase Auth como erro genérico. UI precisa mapear.
- Não distingue "primeiro signup nunca" de "lista vazia por engano". Operacionalmente: seed inicial precisa estar presente no environment de cada deploy.
- Trigger em `auth.users` cria acoplamento entre `public` e o schema `auth` do Supabase. Em upgrade futuro do Supabase, validar que a interface não mudou.

## Bootstrap do primeiro admin

A whitelist é semeada com `eduardolimacesl@gmail.com` na própria migration ([linha 125](../../../supabase/migrations/20260506000000_user_management.sql#L125)). Após o primeiro signup desse e-mail:

1. Trigger `handle_new_user` cria `profiles` com `role='efetivo'`.
2. Promoção manual via SQL no console Supabase:
   ```sql
   UPDATE public.profiles SET role='admin' WHERE email='eduardolimacesl@gmail.com';
   ```
3. Daí em diante, todo gerenciamento de whitelist e roles passa pela UI Admin (Sprint 03).

Isso é **deliberado** — o harness rejeita auto-promoção de admin (memory poisoning + escalada). O custo de 1 UPDATE manual no bootstrap é aceito.

## Riscos conhecidos a fechar

- [ ] Mapear erro do trigger em `app/auth/callback/route.ts` para uma mensagem do tipo "E-mail não autorizado. Fale com o Admin." em vez de erro genérico.
- [ ] Adicionar log estruturado (`lib/logger`) quando o trigger barra um signup — é sinal de tentativa de acesso não autorizado.
- [ ] Validar comportamento se o usuário já existir em `auth.users` e tentar atualizar e-mail (trigger atual só cobre INSERT — UPDATE escapa). Ação: adicionar trigger `BEFORE UPDATE OF email`.

## Alternativas rejeitadas

- **(2) Cleanup pós-login**: descartado — perfil pode ter sido criado em `profiles` via outro trigger antes do cleanup, deixando lixo.
- **(4) Só Server Action**: descartado — bypass via REST direto ao Supabase Auth.
