# ADR 0002 — Whitelist de e-mails via trigger Postgres

**Status:** aceito (retroativo) · **revisado 2026-05-07** (adiciona `default_role`)
**Data:** 2026-05-06
**Decisores:** Eng Carlos Eduardo
**Substitui:** —
**Substituído por:** —

> ADR retroativo. Decisão original em [supabase/migrations/20260506000000_user_management.sql:24-51](../../../supabase/migrations/20260506000000_user_management.sql). Revisão de 2026-05-07 (Sprint 04) em [supabase/migrations/20260507000002_whitelist_default_role.sql](../../../supabase/migrations/20260507000002_whitelist_default_role.sql).

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

---

## Revisão 2026-05-07 — `default_role` na whitelist

**Contexto.** O fluxo original cria todo profile com `role='efetivo'` (default da coluna). Para incluir um coordenador ou outro admin, o admin precisa: (1) adicionar email à whitelist, (2) esperar o usuário logar, (3) abrir `/admin` e mudar a role manualmente. Dois passos manuais para cada convite.

**Decisão complementar.** Adicionar coluna `default_role app_role NOT NULL DEFAULT 'efetivo'` à tabela `whitelist`. Reescrever a função `handle_new_user` para:

1. Buscar match exato em `whitelist.identifier = NEW.email`. Se achar, usar `default_role` dessa entry.
2. Caso não, buscar match por domínio em `whitelist.identifier = '@' || split_part(NEW.email, '@', 2)`. Usar `default_role`.
3. Fallback: `'efetivo'` (mesma constante que era hard-coded antes).

A precedência email > domínio garante que entries específicas sobrescrevem regras de domínio (ex.: `@cofz.gov.br` é `efetivo`, mas `chefe@cofz.gov.br` pode ser cadastrado individualmente como `admin`).

**Backward compatibility.** A coluna tem `NOT NULL DEFAULT 'efetivo'`. Entries criadas antes da migration recebem `'efetivo'` automaticamente — comportamento idêntico ao anterior.

**Por que não criar tabela de "convites" separada.**

- Whitelist já tem o campo `identifier` que é a entidade de convite. Adicionar uma tabela `invitations` paralela duplicaria estado.
- Trigger já roda no INSERT de `auth.users` — adicionar lookup adicional é zero custo de infraestrutura.

**Consequência negativa.** A whitelist ganha uma "regra de role" embutida. Domínios com role `coordenador` ou `admin` viram automação perigosa: qualquer email novo desse domínio entra com privilégio. Mitigação: política operacional — domínios sempre `efetivo`; roles privilegiadas via entry individual de email.

**Riscos a fechar (Sprint 05+):**

- [ ] UI deve avisar quando admin tentar criar entry de domínio com role `admin`/`coordenador` (warning, não bloqueio).
- [ ] Considerar audit log: registrar em `auth.audit_log_entries` (ou tabela própria) quando um profile é criado com role ≠ `efetivo` via whitelist — para auditoria de privilégios automáticos.

**Implementação.** Sprint 04 — ver [docs/sprints/04/story-04-whitelist-roles.md](../../sprints/04/story-04-whitelist-roles.md).
