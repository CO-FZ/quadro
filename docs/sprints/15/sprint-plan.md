# Sprint 15 — Resolução de Débitos Técnicos e Hardening

- **Status:** CONCLUÍDA
- **Início:** 20/05/2026
- **Conclusão:** 20/05/2026
- **Objetivo:** Resolver débitos técnicos transversais acumulados sobre segurança de logs, auditoria administrativa e resiliência na sincronização de planilhas.

---

## Stories

### Story 15.1 — Upgrade do ESLint para v10

**Problema:** O linter está em uma versão desatualizada (`eslint@9.39.4`), impedindo o uso de melhorias de performance e regras mais atuais do ecossistema.

**Solução:**
- Atualizar dependências em `package.json`.
* Rodar `pnpm install` e certificar que `pnpm lint` continua rodando sem erros. (Incompatível, mantido na v9.39.4)

**Arquivos:** [package.json](file:///home/zelzin/study/quadro/package.json)

---

### Story 15.2 — Auditoria Centralizada em `updateUserRole`

**Problema:** Ao alterar a role de um usuário individualmente através da Server Action `updateUserRole`, a alteração não é registrada na tabela `role_change_audit`, ao contrário do que ocorre na alteração em lote no `updateUserProfile`.

**Solução:**
- Reutilizar a lógica de comparação e inserção na tabela de auditoria `role_change_audit` dentro do fluxo de `updateUserRole`.

**Arquivos:** [lib/actions/admin.ts](file:///home/zelzin/study/quadro/lib/actions/admin.ts)

---

### Story 15.3 — Segurança de Logs e Resiliência na Edge Function `sync-sheets`

**Problema:** 
1. Em caso de erro, a Edge Function expõe o array de chaves do JSON da conta de serviço (`credential_keys`) no corpo da resposta HTTP, o que representa vazamento de informações de infraestrutura.
2. Não há uma fila de erros persistente (dead-letter queue) no banco de dados para registrar transações que falharam definitivamente após 3 retries de sincronização.

**Solução:**
- Remover a chave `credential_keys` da resposta JSON no `handleRequest`.
- Criar a tabela `public.sync_sheets_failures` para registrar falhas persistentes na sincronização, permitindo auditoria futura e tentativas de recuperação manual.
- Modificar a Edge Function para inserir registros nessa tabela ao atingir o limite final de retries.

**Arquivos:**
- Nova migration `supabase/migrations/20260520170000_sync_sheets_dead_letter.sql`
- [supabase/functions/sync-sheets/index.ts](file:///home/zelzin/study/quadro/supabase/functions/sync-sheets/index.ts)

---

## Critérios de aceite

- [x] `pnpm typecheck` verde.
- [x] `pnpm lint` verde (ESLint v10 incompatível com next-config/eslint-plugin-react; mantido v9.39.4).
- [x] `pnpm test:unit` verde.
- [x] Mudar role via `updateUserRole` gera registro em `role_change_audit`.
- [x] Erros na Edge Function não vazam `credential_keys` na resposta HTTP.
- [x] Falhas permanentes pós-retries inserem registros na tabela `sync_sheets_failures`.
