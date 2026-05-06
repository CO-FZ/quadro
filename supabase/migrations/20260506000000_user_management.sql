-- Create an ENUM for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordenador', 'efetivo');

-- Create a table for the Whitelist
CREATE TABLE public.whitelist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE, -- Pode ser email exato ou domínio ex: '@dominio.com'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

COMMENT ON COLUMN public.whitelist.identifier IS 'E-mail (joao@email.com) ou domínio (@cofz.gov.br)';

-- Create a table for User Profiles/Roles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role public.app_role DEFAULT 'efetivo'::public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Função e Trigger para validar a Whitelist ANTES da criação do usuário
CREATE OR REPLACE FUNCTION public.check_whitelist()
RETURNS TRIGGER AS $$
DECLARE
    is_whitelisted BOOLEAN;
    domain_part TEXT;
BEGIN
    domain_part := '@' || split_part(NEW.email, '@', 2);
    
    -- Verifica se existe uma regra na whitelist que bata com o email exato ou com o domínio
    SELECT EXISTS (
        SELECT 1 FROM public.whitelist 
        WHERE identifier = NEW.email OR identifier = domain_part
    ) INTO is_whitelisted;
    
    -- Se a tabela de whitelist estiver completamente vazia, podemos permitir o primeiro usuário (admin)?
    -- Para maior segurança, vamos exigir que a whitelist seja populada manualmente primeiro.
    IF NOT is_whitelisted THEN
        RAISE EXCEPTION 'Acesso negado: Seu e-mail não consta na Whitelist.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_whitelist_check
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.check_whitelist();

-- Função e Trigger para criar automaticamente o profile do usuário após cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'avatar_url',
        'efetivo'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS (Row Level Security)
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Função utilitária global para atualizar timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- RLS Policies for Profiles
-- ==========================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- Admins podem alterar perfis (atualizar a role de outros)
CREATE POLICY "Admins can update profiles" 
ON public.profiles FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- ==========================================
-- RLS Policies for Whitelist
-- ==========================================

-- Admins podem gerenciar (ver, inserir, deletar) a whitelist
CREATE POLICY "Admins can manage whitelist" 
ON public.whitelist FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
));

-- DICA PARA O PRIMEIRO ACESSO:
-- Para registrar o primeiro usuário admin, você deverá rodar o seguinte comando via SQL Editor no Supabase:
-- E após se cadastrar, rode:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'eduardolimacesl@gmail.com';

-- Seed inicial da Whitelist conforme solicitado:
INSERT INTO public.whitelist (identifier) VALUES ('eduardolimacesl@gmail.com');
