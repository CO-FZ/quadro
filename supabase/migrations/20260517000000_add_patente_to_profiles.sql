-- Adiciona patente militar ao perfil do usuário
CREATE TYPE public.patente_type AS ENUM (
    'Cel', 'TCel', 'Maj', 'Cap', 'Ten', 'SUB',
    '1SGT', '2SGT', '3SGT', 'CB', 'SD'
);

ALTER TABLE public.profiles
    ADD COLUMN patente public.patente_type NULL;
