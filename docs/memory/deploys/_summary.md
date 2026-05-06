# Deploys — Summary

**Última atualização:** 2026-05-06

---

## Supabase remoto

**Registro:** [2026-05-06-supabase-remote.md](2026-05-06-supabase-remote.md)

Estado:
- CLI Supabase autenticada.
- Projeto atualmente linkado: `yanveevgpfjopcjnosqq` (`quadro2`).
- Migrations locais ainda não aplicadas no remoto.
- Próximo passo bloqueado por `SUPABASE_DB_PASSWORD` e bloqueio temporário do pooler após tentativas falhas.

Retomada:

```bash
export SUPABASE_DB_PASSWORD='SUA_SENHA_DO_BANCO'
supabase db push --dry-run
supabase db push
```

Antes de rodar `db push`, confirmar se o alvo correto é `quadro2` (`yanveevgpfjopcjnosqq`) ou `quadro` (`hbkupohadqjazbiehskf`).

## Pendências operacionais

- Configurar Google provider no dashboard Supabase.
- Confirmar redirect URLs no dashboard.
- Fazer primeiro login autorizado.
- Promover primeiro admin via SQL Editor.
