# Design System: Quadro

Este documento define as diretrizes visuais e de componentes para o projeto Quadro, focado em uma experiência mobile-first, limpa, moderna e de alta usabilidade para a Comissão de Obras de Fortaleza.

## 1. Princípios de Design

*   **Mobile-First:** A interface primária é desenhada para telas pequenas (smartphones). O uso de touch deve ser fácil e os botões de ação bem dimensionados.
*   **Acessibilidade e Contraste:** Cores e tipografia desenhados para fácil leitura sob luz do sol (uso externo) ou em ambientes fechados.
*   **Foco e Redução de Ruído:** Remover distrações. O usuário deve ver suas tarefas, o status e as ações primárias claramente.
*   **Feedback Imediato:** Micro-interações em botões e arrastar cards (drag-and-drop no Kanban) para confirmar ações.

## 2. Tipografia

*   **Fonte Principal (Sans-serif):** `Inter` (Altamente legível em telas pequenas e grandes, visual moderno e profissional).
*   **Escala:**
    *   H1: 24px (Mobile) / 32px (Desktop) - Bold
    *   H2: 20px (Mobile) / 24px (Desktop) - SemiBold
    *   Body: 16px - Regular
    *   Small/Caption: 14px / 12px - Regular/Medium

## 3. Paleta de Cores (Sugestão Inicial)

Como o sistema é para a Comissão de Obras de Fortaleza, a paleta pode refletir confiança, engenharia e clareza.

### Tema Claro (Padrão)
*   **Background:** `#F8FAFC` (Slate 50) - Um tom de cinza muito claro, menos agressivo que o branco puro.
*   **Surface (Cards/Modais):** `#FFFFFF` (Branco) - Para destacar o Kanban e as tarefas.
*   **Primary (Marca/Ações):** `#2563EB` (Blue 600) - Cor que transmite seriedade e profissionalismo.
    *   *Opção Alternativa (Engenharia):* `#EA580C` (Orange 600) para ações de destaque.
*   **Text (Secundário/Primário):** `#0F172A` (Slate 900) e `#475569` (Slate 600).
*   **Borders/Dividers:** `#E2E8F0` (Slate 200).

### Status das Tarefas (Feedback Visual)
*   **To Do (A Fazer):** `#64748B` (Slate 500) - Neutro.
*   **In Progress (Em Andamento):** `#3B82F6` (Blue 500) ou `#F59E0B` (Amber 500) - Ativo.
*   **Done (Concluída):** `#10B981` (Emerald 500) - Positivo/Concluído.
*   **Blocked/Issue (Bloqueado):** `#EF4444` (Red 500) - Alerta.

## 4. Estilo de Componentes (Shadcn UI + Tailwind v4)

De acordo com as diretrizes do `AGENTS.md`, utilizaremos utilitários do Tailwind v4 (`@theme` em `globals.css`) e componentes no estilo Shadcn UI.

*   **Bordas:** Arredondamento suave (`rounded-lg` / `rounded-xl`).
*   **Sombras (Shadows):** Sombras difusas e sutis para profundidade, especialmente em modais e cards arrastáveis (`shadow-sm` padrão, `shadow-md` para hover/drag).
*   **Botões:**
    *   Primário: Fundo sólido com texto contrastante (ex: `bg-blue-600 text-white`).
    *   Secundário/Fantasma: Fundo transparente com hover (ex: `hover:bg-slate-100 text-slate-900`).
*   **Formulários:** Inputs com bordas suaves, fundo ligeiramente cinza, foco (ring) destacado na cor primária.

## 5. Estrutura do App (Layout)

*   **Mobile:**
    *   **Header:** Fixo no topo, logo à esquerda, avatar do usuário à direita.
    *   **Conteúdo Principal:** Scroll vertical para o Kanban, com scroll horizontal (snap) entre as colunas, ou abas (Tabs) para alternar entre "A Fazer", "Fazendo", "Feito".
    *   **FAB (Floating Action Button):** Botão fixo inferior direito para "Nova Tarefa" (Ação mais comum).
*   **Desktop:**
    *   **Sidebar (opcional):** Menu à esquerda para navegação (Dashboard, Kanban, Configurações).
    *   **Conteúdo Principal:** Colunas do Kanban dispostas lado a lado com Drag and Drop tradicional.

---
> **Próximos Passos:** Validar estas escolhas com o usuário. A partir disso, configuraremos os tokens no `app/globals.css` (Tailwind v4) e começaremos a criar as User Stories baseadas neste visual.
