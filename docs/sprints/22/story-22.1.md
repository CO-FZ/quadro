# Story 22.1 — RLS: Perfis visíveis para todos os autenticados

**Sprint:** 22  
**Prioridade:** P0 — desbloqueia todas as demais stories

## Contexto

Política atual `"Users can view own profile"` usa `USING (auth.uid() = id)`, impedindo efetivo de ver perfis de outros membros. Isso bloqueia em cascata: avatars em TaskCard, lista de profiles no kanban, view `user_task_stats` no dashboard e o ranking da equipe.

O `avatar_url` é corretamente populado pelo trigger `on_auth_user_login_sync` a cada login Google. O problema é exclusivamente no SELECT.

## O que fazer

### 1. Criar migration

Arquivo: `supabase/migrations/<timestamp>_relax_profiles_select_policy.sql`

```sql
-- Permite todos os autenticados ver perfis ativos.
-- Membro arquivado ainda visível para si próprio (para logout/profile page).
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view active profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        archived_at IS NULL
        OR id = (SELECT auth.uid())
    );
```

### 2. Verificar AdminView

`AdminView.tsx` busca perfis arquivados para listagem. Confirmar que a query do admin page usa `createClient()` com sessão de admin (RLS se aplica). Se admin precisar ver perfis arquivados de outros, adicionar política específica:

```sql
-- Se necessário — admin vê todos incluindo arquivados
CREATE POLICY "Admin can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );
```

> Nota: essa política adicional pode causar recursão (`profiles` consultando `profiles`). Testar antes. Alternativa: usar `is_admin()` SECURITY DEFINER function (já existe — ADR 0008).

## Critérios de aceite

- [ ] Efetivo logado: `supabase.from('profiles').select(...)` retorna todos os membros ativos
- [ ] Efetivo logado: dashboard mostra `user_task_stats` com todos os membros e ranking
- [ ] Efetivo logado: kanban mostra filtro de assignee com todos os membros
- [ ] Efetivo logado: avatars dos outros aparecem nas TaskCards
- [ ] Admin logado: página /admin lista perfis arquivados normalmente
- [ ] `pnpm test:unit` passou
- [ ] `pnpm typecheck` passou
