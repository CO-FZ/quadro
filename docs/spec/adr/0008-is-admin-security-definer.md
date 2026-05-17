# ADR 0008: Uso de SECURITY DEFINER na função `is_admin()`

**Data:** 2026-05-17
**Status:** Aceito

## Contexto
O controle de acesso baseado em role (RBAC) do sistema foi inicialmente desenhado para usar as roles gravadas na tabela `profiles`. No entanto, como as políticas RLS da tabela `profiles` dependiam da verificação da role do próprio usuário (ex.: *admins podem editar profiles*), criar uma política RLS que consulta a tabela `profiles` gerava um loop de recursão infinito (*infinite recursion*).

Para resolver isso durante a **Sprint 05**, introduzimos a função `is_admin()` através da migration `20260507000004_fix_admin_rls.sql`. Esta função realiza um lookup direto na tabela `profiles` para verificar se o usuário autenticado possui a role `admin`.

## Decisão
Decidimos formalizar que a função `is_admin()` deve ser declarada como `SECURITY DEFINER`.

Ao utilizar `SECURITY DEFINER`, a função executa com os privilégios do usuário que a criou (geralmente o dono do banco de dados/postgres), o que a permite "bypassar" as regras normais do RLS da tabela `profiles` e ler o perfil do usuário sem desencadear uma verificação RLS que causaria a recursão infinita.

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
```

## Consequências

**Positivas:**
- Resolve definitivamente o loop de recursão ao criar políticas RLS dependentes de roles customizadas guardadas em uma tabela de escopo do próprio RLS.
- O código das RLS nas outras tabelas fica mais limpo (ex: `is_admin() OR user_id = auth.uid()`).

**Negativas / Riscos:**
- Qualquer alteração na função precisa ser rigorosamente revisada, pois `SECURITY DEFINER` concede acesso de super-usuário dentro do escopo da função.
- Odiamos ter que bypassar RLS, mas neste caso é estritamente necessário para o lookup de RBAC. Como mitigação, forçamos o `SET search_path = public` para evitar vulnerabilidades de injeção de schema.

## Referências
- Supabase Docs: "Bypassing Row Level Security" / "Security Definer Functions"
- Migration associada: `20260507000004_fix_admin_rls.sql`
