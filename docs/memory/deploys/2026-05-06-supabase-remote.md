# Deploy/Setup — Supabase Remoto

**Data:** 2026-05-06
**Ambiente:** Supabase remoto
**Status:** link CLI concluído; migrations ainda não aplicadas.

---

## Estado atual

- Projeto linkado na CLI: `yanveevgpfjopcjnosqq` (`quadro2`).
- Migrations pendentes no remoto:
  - `20260506000000_user_management`
  - `20260506000001_task_management`
- Push remoto bloqueado por falta de `SUPABASE_DB_PASSWORD`.
- Docker local indisponível, então ambiente Supabase local não foi iniciado.

## Retomada rápida

Antes de aplicar migrations, confirmar se o alvo correto é mesmo `quadro2`.

Se for trocar para o projeto `quadro`:

```bash
supabase unlink
supabase link --project-ref hbkupohadqjazbiehskf
```

Se `quadro2` for o alvo correto:

```bash
export SUPABASE_DB_PASSWORD='SUA_SENHA_DO_BANCO'
supabase db push --dry-run
supabase db push
```

## Pós-push esperado

1. Configurar Google provider no dashboard Supabase.
2. Confirmar redirect URLs:
   - `http://localhost:3000/auth/callback`
   - URL de produção quando existir.
3. Fazer primeiro login com e-mail autorizado pela whitelist.
4. Promover o primeiro admin manualmente no SQL Editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'SEU_EMAIL_AUTORIZADO';
   ```

## Segurança

- `.env.local` não foi lido e não deve ser commitado.
- `.env.local.example` deve conter apenas placeholders.
- Não usar `service_role` em variável `NEXT_PUBLIC_*`.
