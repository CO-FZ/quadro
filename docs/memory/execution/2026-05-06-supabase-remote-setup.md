# Execução — Configuração Supabase Remoto

**Data:** 2026-05-06
**Escopo:** configuração CLI/remote Supabase para aplicar migrations existentes.
**Stories relacionadas:** [Sprint 01 — usuários](../../sprints/01/story-01-user-management.md), [Sprint 02 — tarefas](../../sprints/02/story-02-task-management.md)
**ADRs aplicáveis:** [0001 RBAC RLS](../../spec/adr/0001-rbac-via-supabase-rls.md), [0002 Whitelist trigger](../../spec/adr/0002-whitelist-emails-trigger.md)

---

## Sumário

O Supabase CLI foi inicializado no projeto com `supabase init`, criando `supabase/config.toml` e `supabase/.gitignore`. O app já possui `.env.local` local preenchido pelo humano; o agente não leu esse arquivo. O projeto remoto foi linkado para `yanveevgpfjopcjnosqq` (`quadro2`). A CLI listou duas migrations locais pendentes no remoto, mas `supabase db push --dry-run` falhou por falta de `SUPABASE_DB_PASSWORD` e o pooler entrou em bloqueio temporário após retries.

## Estado técnico

- CLI Supabase instalada: `2.98.2`.
- Projeto remoto atualmente linkado: `yanveevgpfjopcjnosqq` (`quadro2`).
- Outros projetos vistos na conta:
  - `hbkupohadqjazbiehskf` (`quadro`) — confirmar se este seria o alvo correto antes de push, se houver dúvida.
  - `snovmffrdunvxbogrfsz` (`Eduardolimacesl's Project`).
- Migrations locais pendentes no remoto:
  - `20260506000000_user_management`
  - `20260506000001_task_management`
- `supabase status` local falhou porque o Docker daemon não estava ativo.

## Arquivos preparados

| Arquivo | Estado |
|---|---|
| `.gitignore` | ajustado para permitir versionar `.env*.example` |
| `.env.local.example` | criado/ajustado com placeholders, sem valores reais |
| `supabase/.gitignore` | criado pelo `supabase init` |
| `supabase/config.toml` | criado pelo `supabase init`; redirects locais ajustados para `/auth/callback`; seção Google OAuth local adicionada desativada |
| `supabase/seed.sql` | criado vazio; seed inicial da whitelist segue na migration |

## Checks executados

```bash
pnpm lint
pnpm build
supabase projects list
supabase link --project-ref yanveevgpfjopcjnosqq
supabase migration list --linked
supabase db push --dry-run
```

Resultados:
- `pnpm lint`: passou.
- `pnpm build`: passou.
- `supabase migration list --linked`: confirmou as duas migrations pendentes.
- `supabase db push --dry-run`: não aplicou nada; falhou antes por autenticação do banco remoto (`SUPABASE_DB_PASSWORD` ausente/incorreto).

## Próximos passos

1. Confirmar o projeto alvo antes de push: `quadro2` (`yanveevgpfjopcjnosqq`) ou `quadro` (`hbkupohadqjazbiehskf`).
2. Aguardar o bloqueio temporário do pooler expirar.
3. No terminal do humano, sem expor senha no chat:
   ```bash
   export SUPABASE_DB_PASSWORD='SUA_SENHA_DO_BANCO'
   supabase db push --dry-run
   supabase db push
   ```
4. Após o primeiro login Google autorizado, promover o primeiro admin via SQL Editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'SEU_EMAIL_AUTORIZADO';
   ```

## Riscos / Atenções

- Não insistir em `db push` enquanto o pooler estiver bloqueado por excesso de falhas de autenticação.
- Não commitar `.env.local` nem qualquer senha/chave secreta.
- Revisar antes de commitar os arquivos `.gemini/antigravity/skills/supabase/*`, que apareceram como não rastreados e podem ser artefatos da IDE.
- Há uma modificação pendente em `.gemini/antigravity/skills/agent-product-harness` que não foi feita pelo agente nesta sessão; não mexer sem confirmação humana.
