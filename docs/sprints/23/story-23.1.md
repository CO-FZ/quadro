# Story 23.1 — DB: tabela `leaves` + enum + RLS

**Sprint:** 23
**Prioridade:** P0
**Depende de:** —
**Arquivos afetados:** 1 migration nova (+ opcional seed)

## Contexto

Não existe persistência para afastamentos. Criar a tabela base seguindo o padrão de `supabase/migrations/20260506000001_task_management.sql` (enum + tabela + RLS + trigger `handle_updated_at`).

## O que fazer

### 1. Migration

Arquivo: `supabase/migrations/20260528000002_member_leaves.sql`

```sql
-- Enum de tipos de afastamento
CREATE TYPE public.leave_type AS ENUM ('ferias', 'instalacao', 'dispensa');

-- Tabela de afastamentos do efetivo
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.leave_type NOT NULL DEFAULT 'ferias',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT leaves_end_after_start CHECK (end_date >= start_date)
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER handle_updated_at_leaves
    BEFORE UPDATE ON public.leaves
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Índices de consulta (Gantt por membro; janela de datas na Matriz)
CREATE INDEX idx_leaves_profile_id ON public.leaves (profile_id);
CREATE INDEX idx_leaves_date_range ON public.leaves (start_date, end_date);

-- ====================================================================
-- RLS POLICIES — LEAVES
-- ====================================================================

-- 1. Qualquer autenticado pode VER afastamentos (refletir na Matriz)
CREATE POLICY "Usuários podem ver afastamentos"
    ON public.leaves
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Apenas Admin e Coordenador gerenciam afastamentos
CREATE POLICY "Admins e Coordenadores gerenciam afastamentos"
    ON public.leaves
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'coordenador')
        )
    );
```

> **Nota RLS:** `FOR ALL` cobre INSERT/UPDATE/DELETE. A política SELECT permissiva (`true`) coexiste — o Postgres aplica a mais permissiva por comando. Usar `(SELECT auth.uid())` (subquery) para o initplan otimizar, conforme `20260519125842_security_performance_hardening.sql`.

### 2. Seed (opcional, ajuda dev/e2e)

Em `supabase/seed.sql`, após a criação de profiles, inserir 2–3 afastamentos de exemplo (Férias e Instalação) para membros existentes. Manter idempotente / condicional ao ambiente local.

## Critérios de aceite

- [ ] `supabase db reset` aplica a migration sem erro
- [ ] `CHECK (end_date >= start_date)` rejeita período invertido
- [ ] SELECT em `leaves` retorna linhas para conta efetivo (somente leitura)
- [ ] INSERT em `leaves` por conta efetivo é **negado** pela RLS
- [ ] INSERT/UPDATE/DELETE por admin e por coordenador é **permitido**
- [ ] `ON DELETE CASCADE`: arquivar/excluir profile remove seus afastamentos
