# Story 07B.1: Logger estruturado (`lib/logger`) + integração em pontos sensíveis

**Sprint:** 07-B — ver [sprint-plan.md](sprint-plan.md)
**ADRs:** [ADR 0003 — Defesa em camadas](../../spec/adr/0003-defesa-em-camadas-tasks.md), [ADR 0002 — Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md)
**Glossário:** [docs/prd/01-glossary.md](../../prd/01-glossary.md)
**Origem:** débito explícito de [AGENTS.md §6](../../../AGENTS.md) ("Sem `console.log` esquecido (use `lib/logger`)") e [ADR 0003 §"Riscos a fechar"](../../spec/adr/0003-defesa-em-camadas-tasks.md) ("Adicionar log estruturado quando `requireRole` retorna `FORBIDDEN`").

---

## 1. Visão Geral

`lib/logger` é referenciado em `AGENTS.md` há 6 sprints como o caminho oficial para logs, mas nunca foi criado. Hoje, código de produção tem 7+ `console.log/error` espalhados (`supabase/functions/sync-sheets/index.ts`, ações administrativas, etc.) sem nível, sem contexto, sem correlação. Esta story cria o módulo, define o contrato e migra os pontos sensíveis: `requireRole` (FORBIDDEN attempts), auth callback (signup barrado), Edge Function `sync-sheets`.

## 2. Requisitos de Negócio (Regras)

- Log de tentativa não autorizada (`requireRole` → FORBIDDEN) é **sinal de bypass** — UI já filtra controles, então um hit aqui é provável tentativa via REST direto. Quem? Quando? Qual ação?
- Log de signup barrado pelo trigger (`check_whitelist`) é **sinal de tentativa de acesso** — email não autorizado tentando entrar.
- Log de erro em Edge Function `sync-sheets` deve incluir o `task_id` e o tipo de operação (INSERT/UPDATE/DELETE) para diagnóstico de falha de sync.
- **PII:** logs nunca devem incluir senha, token, JWT inteiro ou conteúdo de email/PII completo. Email pode ser logado (já é dado operacional do sistema), mas não secrets.
- **Estrutura:** todos os logs em produção devem ser JSON serializado em uma linha (Vercel/Supabase agregam por linha). Em dev, formato pretty para readability.

## 3. Requisitos técnicos

- **Implementação:** wrapper minimalista (~50 linhas) com fallback para `console`. **Sem nova dependência pesada** (não usar winston).
  ```ts
  // lib/logger/index.ts
  type LogLevel = 'debug' | 'info' | 'warn' | 'error'
  interface LogContext {
    [key: string]: string | number | boolean | null | undefined
  }
  export const logger = {
    info: (msg: string, ctx?: LogContext) => emit('info', msg, ctx),
    warn: (msg: string, ctx?: LogContext) => emit('warn', msg, ctx),
    error: (msg: string, ctx?: LogContext) => emit('error', msg, ctx),
    debug: (msg: string, ctx?: LogContext) => emit('debug', msg, ctx),
  }
  ```
  `emit` decide JSON vs pretty baseado em `process.env.NODE_ENV`.
- **Edge Function:** Edge Function roda Deno, não Node — não pode importar `lib/logger` diretamente. Criar `supabase/functions/_shared/logger.ts` com mesma API e mesmo formato JSON. Documentar a duplicação.
- **Não logar:** `Authorization` headers, `service_role` keys, conteúdo de `raw_user_meta_data` (pode ter PII), sessão JWT.
- **Pontos de integração nesta sprint:**
  1. `lib/auth/require-role.ts` — em FORBIDDEN, log `warn` com `{ userId, role, allowed, action: 'unknown' }` (action virá em sprint futura quando passar contexto).
  2. `app/auth/callback/route.ts` — em erro do trigger, log `warn` com `{ email_domain, error_code }` (não logar email completo para reduzir PII).
  3. `supabase/functions/sync-sheets/index.ts` — substituir `console.log/error` pelo logger compartilhado.
  4. `lib/actions/admin.ts` — log `info` em criação de entry da whitelist com role privilegiada (admin/coord). Story 07B.3 cobre audit log persistente; aqui é só log textual.

## 4. Critérios de Aceite

### CA-01 — Módulo `lib/logger`

- **Given** repositório sem `lib/logger`
- **When** agente cria `lib/logger/index.ts` + `lib/logger/index.test.ts`
- **Then** `import { logger } from '@/lib/logger'` funciona. Em `NODE_ENV=production`, `logger.info('test', {a: 1})` emite `{"level":"info","msg":"test","a":1,"ts":"..."}` em uma linha. Em dev, emite legível.

### CA-02 — Logger compartilhado para Edge Function

- **Given** Edge Function `sync-sheets` com `console.log` direto
- **When** agente cria `supabase/functions/_shared/logger.ts` (Deno-compatible) e migra os call sites
- **Then** Edge Function não tem mais `console.{log,error}` direto exceto dentro do próprio `logger.ts`. Formato de saída idêntico ao do `lib/logger`.

### CA-03 — `requireRole` loga FORBIDDEN

- **Given** efetivo tenta `updateTask`
- **When** `requireRole(['admin','coordenador'])` retorna FORBIDDEN
- **Then** log `warn` é emitido com `{ userId, role: 'efetivo' }`. Verificar via teste integration: capturar `console.warn` mock e assertir o payload.

### CA-04 — Auth callback loga signup barrado

- **Given** usuário com email não-whitelisted clica "Login com Google"
- **When** Supabase Auth chama callback e o trigger lança erro
- **Then** `app/auth/callback/route.ts` captura, loga `warn { error_code, email_domain }` (sem email completo), e redireciona para `/login?error=not_authorized`. Página de login mostra mensagem amigável (Story 07B.2 entrega a UI; aqui só o log + query param).

### CA-05 — Não loga PII sensível

- **Given** suite unit do logger
- **When** chamada `logger.info('user logged', { jwt: 'abc.def.ghi', token: 'xyz', password: '123' })`
- **Then** o output **redige** chaves sensíveis automaticamente — `{ jwt: '[REDACTED]', token: '[REDACTED]', password: '[REDACTED]' }`. Lista de chaves redigidas: `password`, `jwt`, `token`, `authorization`, `cookie`, `secret`, `service_role_key`. Cobertura unit no `logger.test.ts`.

### CA-06 — Edge Function `sync-sheets` migrada

- **Given** Edge Function com `console.log/error` direto
- **When** agente migra para `import { logger } from '../_shared/logger.ts'`
- **Then** `console.{log,warn,error}` não aparece mais em `supabase/functions/sync-sheets/index.ts` (verificar com grep). Logs incluem `{ task_id, operation }` em cada caminho.

### CA-07 — `addToWhitelist` loga role privilegiada

- **Given** admin adiciona `chefe@x.com` com `default_role = 'admin'`
- **When** action executa
- **Then** log `info` com `{ event: 'whitelist_privileged_role', identifier_domain: 'x.com', default_role: 'admin' }` (sem email completo). Cobertura via integration test: capturar log e assertir.

### CA-08 — Documentação de uso

- **Given** novo dev/agente entra no projeto
- **When** lê `lib/logger/README.md`
- **Then** encontra: como importar, como usar (com 3 exemplos: info success / warn forbidden / error caught), tabela de níveis (`debug` só dev, `info` ações ok, `warn` ações barradas/recuperáveis, `error` exceções não tratadas), lista de chaves redigidas automaticamente, link para AGENTS.md §6.

## 5. Modelagem de Dados

Nenhuma alteração de schema.

## 6. Escopo negativo

- ❌ Migrar **todos** os `console.log` do projeto — só os pontos sensíveis listados em §3.
- ❌ Aggregação remota / shipping para Datadog/Sentry — não é escopo. Vercel/Supabase já agregam stdout.
- ❌ Trace IDs / correlation IDs — útil mas exige propagação por request; débito futuro.
- ❌ Métricas (incremento de contador, etc) — só logs textuais; métricas estruturadas vêm em sprint dedicada se necessário.

## 7. Dependências

- Sprint 07-A fechada e em verde (DoR da Sprint 07-B).
- `pnpm test:unit` operante para cobrir o logger.
