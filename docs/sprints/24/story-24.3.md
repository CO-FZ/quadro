# Story 24.3 — Rota `/mapa` + `MapaView` + nav

**Sprint:** 24
**Prioridade:** P0
**Depende de:** 24.2
**Arquivos afetados:** `app/(app)/mapa/page.tsx`, `app/(app)/mapa/loading.tsx`, `components/features/MapaView.tsx`, `components/features/AppShell.tsx`

## O que fazer

### 1. `app/(app)/mapa/page.tsx`

Server Component. Guarda sessão (`redirect('/login')` se não autenticado, mesmo padrão de `matriz`/`admin`). Não restringe visualização por role — `/mapa` é aberta a todo autenticado, só os controles de gestão são condicionados a `canManage = role === 'admin' || role === 'coordenador'`. Busca `getBuildings()` + `profiles` em paralelo.

### 2. `MapaView` (client component)

- `useJsApiLoader` (`@react-google-maps/api`) para carregar o script do Maps; estado vazio amigável se `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` não estiver configurada.
- `GoogleMap` com um `OverlayView` por obra: pin + avatares dos fiscais alocados (até 4 visíveis + contador), nome da obra como label.
- Modo "+ Nova obra" (só `canManage`): arma clique único no mapa → modal pede apenas o nome → `createBuilding({ name, lat, lng })`.
- Clique no marcador de uma obra abre modal de detalhe: lista de todo o efetivo com toggle Alocar/Remover (só `canManage`; leitura simples para os demais), renomear e excluir obra.
- Erros de Server Action exibidos via `useToast()` (`components/ui/ToastProvider.tsx`).

### 3. Nav

Item "Mapa" em `NAV_ITEMS` (`components/features/AppShell.tsx`), entre Dashboard e Kanban, ícone de pin, sem gating por role.

## Critérios de aceite

- [ ] Efetivo (role padrão) vê o mapa e os avatares, mas não vê botões de gestão
- [ ] Admin/coordenador criam obra por clique, atribuem/removem membros, renomeiam e excluem
- [ ] Um mesmo fiscal aparece corretamente em mais de uma obra quando alocado em ambas
- [ ] Estado vazio amigável quando a API key não está configurada
