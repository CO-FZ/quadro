# `lib/logger` — Logger estruturado

Wrapper minimalista sobre `console.*` que padroniza saída, redige PII e separa formato dev/prod. Caminho oficial referenciado em [AGENTS.md §6](../../AGENTS.md) ("Sem `console.log` esquecido (use `lib/logger`)"). Story de origem: [07B.1](../../docs/sprints/07B/story-07B.1-logger.md).

## Como importar

```ts
import { logger } from '@/lib/logger'
```

Para Edge Functions (Deno), use o módulo gêmeo `supabase/functions/_shared/logger.ts` — mesma API, mesmo formato, sincronizado manualmente.

## Como usar

```ts
// Sucesso operacional — não polua dev com isso, mas em prod ajuda auditoria.
logger.info('whitelist_added', { identifier_domain: 'x.com', default_role: 'efetivo' })

// Ação barrada / recuperável — sinal de bypass ou input ruim.
logger.warn('role_forbidden', { userId, role: 'efetivo', allowed: 'admin,coordenador' })

// Exceção não-tratada / erro de infra.
logger.error('sync_sheets_failed', { operation: 'INSERT', task_id, message: err.message })
```

## Níveis

| Nível   | Quando usar                                          | Visível em prod? |
| ------- | ---------------------------------------------------- | ---------------- |
| `debug` | Diagnóstico fino durante desenvolvimento             | sim (Vercel/Supabase agregam tudo) |
| `info`  | Ação executada com sucesso, eventos de auditoria     | sim |
| `warn`  | Ação barrada por regra, fallback, entrada inválida   | sim |
| `error` | Exceção não tratada, falha de dependência externa    | sim |

## Formato de saída

- **`NODE_ENV=production`** — uma linha JSON por evento:
  ```json
  {"level":"warn","msg":"role_forbidden","ts":"2026-05-10T12:00:00.000Z","userId":"u1","role":"efetivo","allowed":"admin,coordenador"}
  ```
- **`NODE_ENV=development`** — pretty, com tag de nível:
  ```
  [WARN] role_forbidden { userId: 'u1', role: 'efetivo', allowed: 'admin,coordenador' }
  ```

Roteamento por sink: `info` → `console.info`, `warn` → `console.warn`, `error` → `console.error`, `debug` → `console.debug`.

## PII redaction

Chaves abaixo são automaticamente substituídas por `[REDACTED]` (case-insensitive), recursivamente em objetos aninhados e arrays:

- `password`
- `jwt`
- `token`
- `authorization`
- `cookie`
- `secret`
- `service_role_key`

```ts
logger.info('user', { jwt: 'abc.def.ghi', userId: 'u1' })
// prod: {"level":"info","msg":"user","ts":"...","jwt":"[REDACTED]","userId":"u1"}
```

**Não envie email completo, raw_user_meta_data ou conteúdo livre de usuário** — prefira derivados (domínio, hash, contagem).

## O que NÃO está aqui

- **Trace IDs / correlation IDs** — útil quando houver múltiplos pontos por request; débito futuro.
- **Shipping remoto** (Datadog, Sentry, Logtail) — Vercel/Supabase já agregam stdout, não há ROI hoje.
- **Métricas estruturadas** (counters, histograms) — sprint dedicada quando necessário.
- **Aggregação por janela / rate limit** — cada chamada vira uma linha.

## Pontos integrados (Sprint 07-B.1)

- `lib/auth/require-role.ts` — `warn role_forbidden` quando o gate retorna FORBIDDEN.
- `app/auth/callback/route.ts` — `warn auth_callback_error` quando o trigger barra signup; redireciona para `/login?error=not_authorized`.
- `lib/actions/admin.ts` — `info whitelist_privileged_role` quando entry com role `admin`/`coordenador` é criada.
- `supabase/functions/sync-sheets/index.ts` — toda a função migrada para o logger Deno.

## Adicionando novos pontos

1. `import { logger } from '@/lib/logger'` (ou `'../_shared/logger.ts'` em Edge Function).
2. Escolha o nível pela tabela acima.
3. Use snake_case curto para `msg` (vira chave de busca no agregador). Exemplos: `task_archived`, `whitelist_privileged_role`, `sync_sheets_failed`.
4. Inclua identificadores estáveis (`userId`, `task_id`, `operation`); evite enviar payload livre.
5. Para PII além das chaves padrão, derive (domínio, hash) antes de logar.
