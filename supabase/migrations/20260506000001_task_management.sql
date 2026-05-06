-- Criação do Enum para os setores
CREATE TYPE public.task_sector AS ENUM ('DT', 'DA');

-- Criação do Enum para os status do Kanban
CREATE TYPE public.task_status AS ENUM ('backlog', 'alocada', 'em_desenvolvimento', 'finalizada');

-- Criação da tabela de Tarefas (Tasks)
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sector public.task_sector NOT NULL,
    status public.task_status DEFAULT 'backlog'::public.task_status NOT NULL,
    drive_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS em tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar o updated_at da tabela tasks
CREATE TRIGGER handle_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Criação da tabela de relacionamento entre Tarefas e Usuários (Assignees)
CREATE TABLE public.task_assignees (
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

-- Habilitar RLS em task_assignees
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- ====================================================================================
-- RLS POLICIES - TASKS
-- ====================================================================================

-- 1. Qualquer usuário autenticado pode ver as tarefas
CREATE POLICY "Usuários podem ver todas as tarefas"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Coordenadores e Admins podem criar tarefas
CREATE POLICY "Admins e Coordenadores podem criar tarefas"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- 3. Coordenadores e Admins podem atualizar QUALQUER tarefa
--    Usuários 'efetivos' podem atualizar APENAS as tarefas nas quais estão alocados
CREATE POLICY "Atualização de tarefas baseada na role e alocação"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.task_assignees
            WHERE task_id = tasks.id AND user_id = auth.uid()
        )
    );

-- 4. Somente Admins e Coordenadores podem deletar tarefas
CREATE POLICY "Admins e Coordenadores podem deletar tarefas"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );


-- ====================================================================================
-- RLS POLICIES - TASK ASSIGNEES
-- ====================================================================================

-- 1. Qualquer usuário autenticado pode ver os alocados
CREATE POLICY "Usuários podem ver alocações"
    ON public.task_assignees
    FOR SELECT
    TO authenticated
    USING (true);

-- 2. Apenas Admins e Coordenadores podem alocar/remover usuários das tarefas
CREATE POLICY "Admins e Coordenadores gerenciam alocações"
    ON public.task_assignees
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- (Opção extra de UX): Se quisermos permitir que a própria pessoa "puxe" uma tarefa do backlog pra si
-- CREATE POLICY "Efetivos podem se alocar"
--    ON public.task_assignees FOR INSERT TO authenticated
--    WITH CHECK (user_id = auth.uid());
-- *Mantido comentado, seguindo o padrão de que o coordenador aloca.*

-- ====================================================================================
-- VIEWS OU FUNÇÕES DE DASHBOARD (Opcional, mas útil para contagens rápidas)
-- ====================================================================================

-- Criando uma View que simplifica o Dashboard (atividades por usuário e status)
CREATE OR REPLACE VIEW public.user_task_stats AS
SELECT 
    p.id AS user_id,
    p.email,
    p.role,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'finalizada') AS finished_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'em_desenvolvimento') AS in_progress_tasks
FROM 
    public.profiles p
LEFT JOIN 
    public.task_assignees ta ON ta.user_id = p.id
LEFT JOIN 
    public.tasks t ON t.id = ta.task_id
GROUP BY 
    p.id, p.email, p.role;
