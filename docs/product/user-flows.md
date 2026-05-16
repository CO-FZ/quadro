# User Flows — Quadro CO-FZ

**Derivado de:** [PRD §8-9](../prd/00-prd.md)

---

## Flow 1 — Login

```text
[Browser] → /login
  │
  ├─ clica "Entrar com Google"
  │
  ▼
Supabase Auth → Google OAuth consent
  │
  ▼
Callback: /auth/callback
  │
  ├─ email na whitelist? → /kanban
  └─ email fora da whitelist → /login?error=not_authorized
```

**Estados de UI:** default → loading → sucesso | erro

---

## Flow 2 — Kanban (Membro)

```text
/kanban
  │
  ├─ visualiza colunas: Pendente / Em Andamento / Finalizada / Arquivada
  ├─ cria tarefa (modal) → createTask
  ├─ move tarefa (drag-and-drop) → updateTaskStatus + useOptimistic
  └─ abre detalhe → edita título/descrição/assignees/data
```

**Regras de movimentação:**
- `admin | coordenador` movem para qualquer status.
- `efetivo` não pode mover para `finalizada` nem `arquivada`.

---

## Flow 3 — Dashboard (Gestor)

```text
/dashboard
  │
  └─ visualiza métricas: tarefas por membro, por status, pendentes/atrasadas
```

Somente leitura. Sem mutações.

---

## Flow 4 — Admin

```text
/admin
  │
  ├─ aba Usuários: buscar, ver role, arquivar/restaurar
  ├─ aba Whitelist: adicionar email/domínio com role, bulk add
  └─ aba Auditoria: ver log de roles privilegiadas atribuídas
```

**Restrição:** acesso somente para `admin`.

---

## Flow 5 — Perfil

```text
/profile
  │
  └─ visualiza e edita full_name; avatar sincronizado do Google
```
