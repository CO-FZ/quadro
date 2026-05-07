# Sprint 04 — Whitelist com role + last-admin guard + pendentes

**Sprint goal (1 frase):** acelerar onboarding de usuários para teste — admin atribui role na whitelist, sistema impede admin único de se rebaixar, lista de pendentes torna visível quem foi convidado mas não logou.

**Data de início:** 2026-05-07
**Capacidade:** 1 dev humano + 1 agente Antigravity (Opus 4.7)
**Status:** ⬜ aguardando Gate 1 (Plan Artifact)

---

## 1. Backlog selecionado

| ID | Story / Task | Tipo | Estimativa | Owner | Prioridade | Status |
|----|--------------|------|-----------|-------|------------|--------|
| ADR-0002 (rev) | Atualização do ADR 0002 — Whitelist com `default_role` | tech-doc | XS | agente | P0 | ⬜ |
| Story 04 | Whitelist com role pré-atribuída + last-admin guard + indicador de pendentes | story | M | agente | P0 | ⬜ |

> Sprint coesa em uma story. Se durante o Plan Artifact a complexidade subir para L, dividir em 04.1 (schema + role) / 04.2 (last-admin) / 04.3 (pendentes).

---

## 2. Definition of Ready (DoR)

- [x] Story tem critérios de aceite Given/When/Then ([story-04-whitelist-roles.md](story-04-whitelist-roles.md)).
- [x] Persona definida: admin gerenciando time de testes; novo usuário convidado.
- [x] Referenciada nos gaps 1/2/3 levantados em 2026-05-07.
- [x] Dependências mapeadas: ADR 0002 revisado é bloqueante para schema. Sprint 03 fechada.
- [x] Cabe em M (≤3 dias-agente).

---

## 3. Definition of Done (DoD)

- [ ] Critérios de aceite com evidência manual (testes com 2+ personas).
- [ ] `pnpm exec tsc --noEmit && pnpm lint` passam.
- [ ] PR/diff revisado pelo humano (Gate 2).
- [ ] ADR 0002 atualizado e marcado como `aceito (revisado 2026-05-07)`.
- [ ] Migration aplicada em remoto via `pnpm supabase db push` (sem reset).
- [ ] Final Artifact + `_summary` da Sprint 04 escritos.

---

## 4. Compromissos & não-compromissos

**Vamos entregar:**

- Whitelist com coluna `default_role` (DEFAULT 'efetivo' para back-compat).
- Trigger `handle_new_user` lê role da whitelist no primeiro signup.
- Form de adição na UI inclui select de role.
- Guard "último admin" em `updateUserRole` (rejeita se rebaixar/remover o único admin).
- Indicador visual de "pendentes" na tab Whitelist (entries que ainda não viraram profile).

**NÃO vamos entregar:**

- ❌ Soft-delete / archived_at em profiles (gap 5) — Sprint 05.
- ❌ Bulk add de emails (gap 6) — Sprint 05.
- ❌ Busca/filtro na lista de usuários (gap 4) — Sprint 05.
- ❌ Sincronização Google Sheets — exige ADR próprio.
- ❌ Logger estruturado para FORBIDDEN — débito do ADR 0003.

---

## 5. Riscos da sprint

| Risco | Mitigação |
|-------|-----------|
| Migration alterar `handle_new_user` quebra signup existente | Migration idempotente; teste manual com whitelist nova + antiga (sem `default_role` preenchido) confirma fallback para `efetivo` |
| Guard "último admin" introduz race condition (2 admins se rebaixando ao mesmo tempo) | Fazer o check + UPDATE em transação; aceitar como improvável em v1 e documentar |
| `default_role` na whitelist não cobre o caso de domínio inteiro com roles diferentes | Documentar: se identifier é `@dominio`, `default_role` se aplica a todos os primeiros logins desse domínio. Para nuance, usar entries individuais |

---

## 6. Cerimônias

| Evento | Quando | Output |
|--------|--------|--------|
| Planning | 2026-05-07 | sprint-plan + story + Plan Artifact |
| Gate 1 | antes do código | aprovação humana em chat |
| Gate 2 | depois do código | revisão do diff |
| Retro | ao fechar | seção 8 |

---

## 7. Workspace

| Workspace | Agente | Story | Modo |
|-----------|--------|-------|------|
| `quadro` (cwd) | Opus 4.7 | Story 04 + ADR 0002 rev | agent-assisted |

> Sequencial.

---

## 8. Retrospectiva (preencher ao final)

**O que funcionou:**
- `[...]`

**O que não funcionou:**
- `[...]`

**Métrica:**

| Métrica | Valor |
|---------|-------|
| Stories planejadas | 1 |
| Stories concluídas | — |
