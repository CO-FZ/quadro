# Story 07B.2: Mapeamento de erro na auth callback + UI de aviso para domínio privilegiado

**Sprint:** 07-B — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0002 — Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md), [ADR 0001 — RBAC via RLS](../../spec/adr/0001-rbac-via-supabase-rls.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito explícito de [ADR 0002 §"Riscos conhecidos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md): "Mapear erro do trigger em `app/auth/callback/route.ts` para uma mensagem do tipo 'E-mail não autorizado. Fale com o Admin.' em vez de erro genérico." E [ADR 0002 rev §"Riscos a fechar"](../../spec/adr/0002-whitelist-emails-trigger.md): "UI deve avisar quando admin tentar criar entry de domínio com role admin/coordenador (warning, não bloqueio)."

---

## 1. Visão Geral

Hoje, `app/auth/callback/route.ts` ([código atual](../../../app/auth/callback/route.ts)) trata erro do trigger `check_whitelist` como erro genérico do Supabase Auth. Usuário vê mensagem opaca tipo "Authentication failed" sem entender que o problema é estar fora da whitelist. Esta story traduz isso para UI amigável.

Na mesma sprint, fechamos o débito espelhado da Sprint 04: avisar admin que está cadastrando domínio com role privilegiada (vetor de risco — qualquer email novo do domínio entra como admin).

## 2. Requisitos de Negócio (Regras)

- **Erro de whitelist no signup:**
  - Trigger lança `RAISE EXCEPTION 'Acesso negado: ...'`. Erro propaga para Supabase Auth como `signup_disabled` ou `unexpected_failure`.
  - Callback (`app/auth/callback/route.ts`) deve detectar esse padrão de erro e redirecionar para `/login?error=not_authorized`.
  - Tela de login lê o query param e mostra: "**Este e-mail não está autorizado a acessar o Quadro.** Fale com o administrador da equipe."
  - Manter comportamento atual para outros erros (genéricos): `/login?error=auth_failed`.
- **Trigger `BEFORE UPDATE OF email`:** ADR 0002 §"Riscos a fechar" item 3 — hoje só INSERT é coberto; UPDATE de email burla a whitelist. Adicionar trigger ou registrar como débito formal **se** a investigação mostrar que o gap é real (talvez Supabase Auth não permita UPDATE de email pelo cliente sem re-verificação).
- **Aviso de domínio privilegiado:**
  - Quando admin abre o form de Whitelist em `/admin` e seleciona role `admin` ou `coordenador` **com** identifier começando com `@`, mostrar warning inline: "⚠️ **Atenção:** todos os usuários novos do domínio `@xyz.com` entrarão automaticamente como **admin**. Considere usar e-mails individuais para roles privilegiadas."
  - Warning **não bloqueia** — é informacional. Admin confirma mesmo assim se quiser.

## 3. Requisitos técnicos

- `app/auth/callback/route.ts`: parsear `error_description` retornado pelo Supabase ou consultar diretamente o erro para detectar substring `'Acesso negado'` (texto da exceção do trigger). Robustez: usar matching ampliado para tolerar mudanças minor na mensagem.
- `app/(marketing)/login/page.tsx`: ler `searchParams.error` e renderizar componente `<LoginAlert variant="...">` com mensagem mapeada.
- `components/features/AdminView.tsx`: hook `useEffect` ou derivado puro detecta `identifier.startsWith('@')` && `defaultRole !== 'efetivo'`, mostra `<DomainWarning>`. Refactor leve.
- Mensagens centralizadas em `lib/i18n/auth.ts` e `lib/i18n/admin.ts` (entrega base do `lib/i18n` previsto em AGENTS.md §4).

## 4. Critérios de Aceite

### CA-01 — Erro de whitelist é detectado e redirecionado

- **Given** email `intruso@evil.com` não está na whitelist
- **When** usuário tenta logar com Google e o trigger barra
- **Then** callback detecta o erro, redireciona para `/login?error=not_authorized`. Logger emite `warn` com `{ event: 'signup_blocked', email_domain: 'evil.com' }`.

### CA-02 — Login mostra mensagem amigável

- **Given** URL `/login?error=not_authorized`
- **When** página renderiza
- **Then** componente de alerta exibe: "Este e-mail não está autorizado a acessar o Quadro. Fale com o administrador da equipe." Em pt-BR. Visual consistente com design system (cor `error/destructive`).

### CA-03 — E2E teste passa

- **Given** Story 07A.3 CA-11 estava bloqueada pendente desta entrega
- **When** roda `pnpm test:e2e auth.spec.ts`
- **Then** spec verifica fluxo: tentativa de signup com email não-whitelisted → URL final `/login?error=not_authorized` → texto da mensagem amigável visível. Verde.

### CA-04 — Outros erros mantêm comportamento

- **Given** erro genérico (ex.: token inválido, OAuth abortado)
- **When** callback processa
- **Then** redireciona para `/login?error=auth_failed` com mensagem genérica "Não foi possível autenticar. Tente novamente." (PRD US-01 §6).

### CA-05 — Trigger `BEFORE UPDATE OF email` — investigação documentada

- **Given** débito de ADR 0002 §"Riscos a fechar" item 3
- **When** agente investiga: pode usuário fazer UPDATE de `auth.users.email` pelo cliente?
- **Then** documenta no `_summary.md` da Sprint 07-B: (a) sim, e a story adiciona o trigger; ou (b) não, e o gap não é explorável — registra como `[resolvido por design]` com referência ao Supabase docs. Decisão é binária e documentada — não fica em débito open-ended.

### CA-06 — Aviso de domínio privilegiado

- **Given** admin abre form de Whitelist em `/admin`
- **When** preenche `@cofz.gov.br` no input e seleciona `admin` no role select
- **Then** abaixo do form aparece warning: "⚠️ Atenção: todos os usuários novos do domínio `@cofz.gov.br` entrarão automaticamente como admin. Considere usar e-mails individuais para roles privilegiadas." Botão "Adicionar" continua habilitado (não bloqueia).

### CA-07 — Aviso desaparece quando role muda

- **Given** identifier `@cofz.gov.br` com role `admin` (warning visível)
- **When** admin muda role para `efetivo`
- **Then** warning some imediatamente. Mesma lógica para identifier individual (não-domínio): warning nunca aparece.

### CA-08 — `lib/i18n` base

- **Given** mensagens hard-coded espalhadas
- **When** agente cria `lib/i18n/auth.ts`, `lib/i18n/admin.ts`, `lib/i18n/index.ts`
- **Then** mensagens das CAs acima vêm dessas chaves (`t('auth.errors.not_authorized')`, `t('admin.whitelist.privileged_domain_warning')`). Outras mensagens do app **não** são migradas nesta sprint (escopo cirúrgico).

### CA-09 — Tests de integration cobrem callback

- **Given** Story 07A.2 fixture de auth (signUp por admin SDK)
- **When** integration test `auth.callback.test.ts` é adicionado
- **Then** cobre: (a) email whitelisted → callback retorna 302 para `/kanban`; (b) email não-whitelisted → 302 para `/login?error=not_authorized`; (c) erro genérico → 302 para `/login?error=auth_failed`.

## 5. Modelagem de Dados

Possivelmente migration nova **se** investigação CA-05 indicar que `BEFORE UPDATE OF email` é necessário:

```sql
-- supabase/migrations/<timestamp>_check_whitelist_on_email_update.sql
DROP TRIGGER IF EXISTS check_whitelist_on_update ON auth.users;
CREATE TRIGGER check_whitelist_on_update
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.check_whitelist();
```

Se decisão for "não necessário", documentar e pular.

## 6. Escopo negativo

- ❌ Migrar todas as mensagens do app para `lib/i18n` — só as 5 mensagens críticas dessa story.
- ❌ Suporte a múltiplos idiomas — só pt-BR.
- ❌ Lazy loading de chaves i18n — overkill para volume atual.
- ❌ Sistema de "request access" para emails não-whitelisted (botão "Pedir acesso ao admin"). Funcionalidade futura.

## 7. Dependências

- Story 07B.1 (logger).
- Story 07A.3 (E2E test infra; CA-11 dessa story é o gate de aceitação desta).
- `lib/i18n` é introduzido aqui — Story 07B.4 pode estender.
