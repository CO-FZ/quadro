# Story 23.3 — UI: aba Férias (Gantt anual + modal de período)

**Sprint:** 23
**Prioridade:** P1
**Depende de:** 23.2 (tipos + actions)
**Arquivos afetados:** `components/features/FeriasView.tsx` (novo), `components/features/AdminView.tsx`, `app/(app)/admin/page.tsx`, `lib/i18n/leaves.ts` (novo) + `lib/i18n/index.ts`

## Contexto

A aba `Férias` é a 4ª aba do painel `/admin`, após `Auditoria`. Reproduz o Gantt da imagem de referência: **linha = colaborador**, **colunas = meses do ano**, **barras = períodos de afastamento**. Clicar no nome do colaborador abre um modal para incluir/editar períodos.

`AdminView.tsx` já tem o padrão de tabs (`AdminTab` union em `:34`, render em `:391`) e o padrão de modal (`EditModal` no próprio arquivo, `:74`). Reusar.

## O que fazer

### 1. Relaxar guard da página — `app/(app)/admin/page.tsx`

```ts
// ANTES (:17): if (currentProfile?.role !== 'admin') redirect('/kanban')
// DEPOIS:
const role = currentProfile?.role
if (role !== 'admin' && role !== 'coordenador') redirect('/kanban')
```

- Carregar afastamentos do ano corrente: `getLeaves({ year })` e profiles (já carregados).
- Passar `currentUserRole={role}` real (não hardcode `"admin"`) e `leaves` para `AdminView`.
- Whitelist/Auditoria só precisam ser buscadas se `role === 'admin'` (evitar query desnecessária/negada ao coordenador).

### 2. `AdminView.tsx` — registrar a aba e gatear por role

- `type AdminTab = 'usuarios' | 'whitelist' | 'auditoria' | 'ferias'`
- Computar abas visíveis por role:
  - admin: `['usuarios','whitelist','auditoria','ferias']`
  - coordenador: `['ferias']`
- `activeTab` default: `role === 'admin' ? 'usuarios' : 'ferias'`.
- Rótulo da aba: `Férias (${leaves.length})`.
- Título/subtítulo do header condicional: coordenador vê "Gestão de Férias".
- Renderizar `<FeriasView profiles={profiles} leaves={leaves} year={year} canManage />` quando `activeTab === 'ferias'`.
- Novas props em `AdminViewProps`: `leaves: Leave[]`, `currentYear: number`.

### 3. `components/features/FeriasView.tsx` (novo)

Componente client. Estrutura:

- **Header**: título + navegação de ano `‹ 2026 ›` (links `?leaveYear=YYYY` ou estado local com `getLeaves` via action — preferir navegação por searchParam para manter SSR, espelhando `matriz/page.tsx` `?ref=`).
- **Grade Gantt**:
  - Coluna esquerda fixa (sticky) = nome do colaborador (`formatNomeCompleto(p.patente, p.nome_guerra ?? p.full_name)`), ordenado por `sortByPatente`.
  - 12 colunas = meses (`jan`…`dez`), largura igual.
  - Para cada membro, renderizar suas barras posicionadas por `start_date`/`end_date`:
    - `leftPct = (offsetDiasNoAno / diasNoAno) * 100`, `widthPct = (duraçãoDias / diasNoAno) * 100` (clampar à borda do ano).
    - Cor por tipo: `ferias` verde, `instalacao` laranja/âmbar, `dispensa` cinza/azul (reusar paleta de `MatrizView` `STATUS_BADGE`).
    - Tooltip/título: `{LABEL} • {dd mmm} – {dd mmm}`.
  - Clicar no **nome** do colaborador → abre `LeaveModal` daquele membro.
- Helper de posicionamento em util testável (ver 23.5): `leaveBarGeometry(start, end, year) → { leftPct, widthPct } | null` (null se fora do ano).

### 4. `LeaveModal` (em `FeriasView.tsx` ou arquivo próprio)

Espelhar `EditModal` de `AdminView.tsx` (overlay, Escape fecha, `useTransition`):

- Lista os períodos existentes do membro (editar/excluir cada um → `updateLeave`/`deleteLeave`).
- Formulário "novo período": `data início`, `data fim` (inputs `type="date"`), `tipo` (select: Férias/Instalação/Dispensa), `descrição` (texto opcional).
- Submit → `createLeave({ profile_id, type, start_date, end_date, description })`.
- Feedback de erro/sucesso no mesmo padrão de `withFeedback`.
- Ao salvar, `router.refresh()` para refletir as barras (server revalida `/admin`).

### 5. i18n — `lib/i18n/leaves.ts` + registro

```ts
export const leaves = {
  tab_label: 'Férias',
  type: { ferias: 'Férias', instalacao: 'Instalação', dispensa: 'Dispensa' },
  modal: { title: 'Afastamentos', new_period: 'Novo período', /* ... */ },
}
```
Registrar em `lib/i18n/index.ts` (`const dict = { auth, admin, leaves }`).

## Critérios de aceite

- [ ] Admin vê 4 abas; `Férias` aparece após `Auditoria`
- [ ] Coordenador acessa `/admin` e vê **apenas** a aba `Férias` (não vê Usuários/Whitelist/Auditoria)
- [ ] Efetivo continua redirecionado para `/kanban`
- [ ] Gantt: linha por membro, 12 colunas de mês, barras posicionadas corretamente por data
- [ ] Clicar no nome abre o modal; salvar período renderiza a barra sem reload manual
- [ ] Tipos exibidos em pt-BR via `lib/i18n`
- [ ] Navegação de ano funciona (`‹ 2026 ›`)
- [ ] `pnpm lint` e `pnpm typecheck` passam; acessibilidade (foco, aria nas abas/modal)
