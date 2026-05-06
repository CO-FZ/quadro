# Convenções de Frontend — Next.js 16.x + Tailwind v4

> Este documento codifica os padrões obrigatórios para qualquer código frontend deste harness.
> Em conflito com chat, **prevalece este documento**. Se estiver desatualizado, abra ADR para alterar.

---

## 1. Versões mínimas

| Item | Versão |
|------|--------|
| Node.js | LTS atual |
| Next.js | 16.2+ |
| React | 19+ |
| Tailwind CSS | 4.0+ |
| TypeScript | 5.4+ |
| pnpm | 9+ |

---

## 2. Setup novo projeto

```bash
pnpm create next-app@latest <nome> \
  --typescript --tailwind --app --eslint --use-pnpm
cd <nome>
```

O `create-next-app` 16.2 já gera um `AGENTS.md` inicial. **Substitua-o** pelo `AGENTS.md` deste harness na raiz do repositório.

---

## 3. Estrutura de pastas

```
app/
  layout.tsx                  ← root layout
  globals.css                 ← Tailwind + tokens
  (marketing)/                ← rotas públicas
    page.tsx
  (app)/                      ← rotas autenticadas
    layout.tsx                ← guard de auth
    dashboard/page.tsx
  api/                        ← apenas webhooks/endpoints externos
proxy.ts                      ← edge proxy (substitui middleware.ts)
components/
  ui/                         ← primitives (button, input, dialog…)
  features/                   ← agrupados por domínio
    inspections/
      list.tsx
      form.tsx
lib/
  auth/
  db/
    schema.ts
    client.ts
  i18n/
  logger.ts
  utils.ts
hooks/
  use-toast.ts
  use-mounted.ts
tests/
  unit/
  integration/
  e2e/
```

**Nomenclatura:**

- Arquivos `kebab-case.tsx`.
- Componentes em PascalCase (export nomeado).
- Hooks `useXxx`.
- Variáveis de ambiente `SCREAMING_SNAKE_CASE`.

---

## 4. Server Components por padrão

**Server Component** (default — sem diretiva):

```tsx
// app/(app)/inspections/page.tsx
import { listInspections } from '@/lib/db/inspections';
import { InspectionsList } from '@/components/features/inspections/list';

export default async function Page() {
  const inspections = await listInspections();
  return <InspectionsList items={inspections} />;
}
```

**Client Component** (apenas onde precisar):

```tsx
// components/features/inspections/list.tsx
'use client';

import { useState } from 'react';

export function InspectionsList({ items }: { items: Inspection[] }) {
  const [filter, setFilter] = useState('');
  // ...
}
```

**Regra:** se não há `useState`, `useEffect`, listener, ou hook de browser, **não use** `"use client"`.

---

## 5. Server Actions (mutações)

```ts
// app/(app)/inspections/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';

const Input = z.object({
  buildingId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
});

export async function createInspection(formData: FormData) {
  const user = await auth(); // 401 se não autenticado
  if (!user) throw new Error('UNAUTHORIZED');

  const parsed = Input.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false as const, errors: parsed.error.flatten() };
  }

  await db.inspections.create({ ...parsed.data, userId: user.id });
  revalidatePath('/inspections');
  return { ok: true as const };
}
```

**Obrigatório em toda Server Action:**

1. ✅ Auth check explícito.
2. ✅ Validação de input com Zod (ou Valibot).
3. ✅ Tratamento de erro → mensagem segura para o cliente.
4. ✅ `revalidatePath`/`revalidateTag` quando muda estado.
5. ✅ Tipagem de retorno (`{ ok: true, ... } | { ok: false, ... }`).

---

## 6. Cache Components (`"use cache"`)

Por padrão, no Next 16, **tudo é dinâmico**. Cache é opt-in.

```tsx
// app/(marketing)/blog/[slug]/page.tsx
import { getPost } from '@/lib/cms';

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <Article post={post} />;
}

// função cacheada — invalidada por tag
export async function getPost(slug: string) {
  'use cache';
  const post = await fetchFromCMS(slug);
  return post;
}
```

**Quando cachear:**

- ✅ Conteúdo público estável (blog, marketing, docs)
- ✅ Listas que mudam pouco (catálogos)

**Quando NÃO cachear:**

- ❌ Dados específicos de usuário autenticado
- ❌ Dados financeiros / billing em tempo real

**Invalidação:** `revalidateTag('posts')` em Server Actions.

---

## 7. `proxy.ts` (substituiu `middleware.ts`)

```ts
// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const res = NextResponse.next();

  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // CSP — ajuste conforme suas dependências
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;",
  );

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

> **Não criar `middleware.ts`.** Deprecated no 16.

---

## 8. Tailwind v4 — configuração CSS-first

Em `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-display: "Inter", "sans-serif";
  --color-brand-50:  oklch(0.97 0.02 240);
  --color-brand-500: oklch(0.62 0.18 240);
  --color-brand-900: oklch(0.30 0.10 240);

  --radius-card: 1rem;
  --shadow-card: 0 1px 2px oklch(0 0 0 / 0.05), 0 4px 12px oklch(0 0 0 / 0.06);

  --breakpoint-3xl: 1920px;
}

/* Dark mode tokens */
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.15 0 0);
  }
  .dark {
    --background: oklch(0.12 0 0);
    --foreground: oklch(0.96 0 0);
  }
}
```

**Regras Tailwind v4:**

- ❌ Não criar `tailwind.config.js`. Configuração mora no CSS via `@theme`.
- ✅ Use `@import "tailwindcss"` (não `@tailwind base/components/utilities`).
- ✅ Cores em `oklch()` quando possível (mais previsível em dark mode e ajustes).
- ✅ `@source` no CSS para forçar varredura de arquivos específicos quando necessário.
- ✅ Use `size-*` para `width + height` simultâneos.
- ✅ Use `inline-*`/`block-*` (logical properties) para suporte a RTL.

**Padrão de classes:**

```tsx
// ordem recomendada: layout → box → tipografia → cor → estado
<button
  className="
    inline-flex items-center gap-2
    rounded-lg px-4 py-2
    text-sm font-medium
    bg-brand-500 text-white
    hover:bg-brand-600 active:bg-brand-700
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
```

> Para listas longas de classes, considere `clsx` + `tailwind-merge` em `lib/utils.ts:cn()`.

---

## 9. Acessibilidade

- ✅ Todo botão tem texto ou `aria-label`.
- ✅ Imagens com `alt` (vazio se decorativa).
- ✅ Links com texto descritivo (não "clique aqui").
- ✅ Foco visível obrigatório (`focus-visible:` Tailwind).
- ✅ Componentes interativos custom usam Radix UI ou similar (não reinvente combobox/dialog).
- ✅ `htmlFor` em todo label de input.
- ✅ Cores não são o único portador de informação.
- ✅ Contraste AA mínimo (verificar com `pa11y` ou axe).

---

## 10. Internacionalização

Mesmo lançando só pt-BR no MVP, **prepare a estrutura**:

```ts
// lib/i18n/messages/pt-BR.ts
export const messages = {
  inspection: {
    create: { title: 'Nova inspeção' },
  },
} as const;

// lib/i18n/index.ts
import { messages } from './messages/pt-BR';
export const t = messages;
```

Quando virar realmente multi-idioma, troque para `next-intl` ou similar via ADR.

---

## 11. Imagens e assets

- ✅ Use `next/image` para qualquer imagem.
- ✅ Defina `width` e `height` (ou `fill` + container com tamanho).
- ✅ Use formatos modernos (`avif`, `webp`); `next/image` faz isso por você.
- ✅ Lazy por padrão; `priority` só em LCP.

---

## 12. Performance budgets (CI deve falhar se passar)

| Métrica | Budget |
|---------|--------|
| LCP p75 | < 2.5s |
| INP p75 | < 200ms |
| CLS p75 | < 0.1 |
| JS inicial gzipped | < 150KB |
| Bundle por rota | < 250KB |

Use Lighthouse CI ou `next build --analyze` no pipeline.

---

## 13. Logs e telemetria no client

- ❌ `console.log` em produção. Use `lib/logger.ts`.
- ✅ Capture web vitals via `useReportWebVitals` no root layout.
- ✅ Erros não tratados → Sentry/PostHog (configurado por ADR).

---

## 14. Comandos pnpm padronizados

`package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run --dir tests/unit",
    "test:integration": "vitest run --dir tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## 15. Coisas que o agente **não** deve fazer

- ❌ Criar `tailwind.config.js`
- ❌ Criar `middleware.ts` (use `proxy.ts`)
- ❌ Adicionar dependências sem ADR (especialmente UI libs grandes)
- ❌ Usar `getServerSideProps` / `getStaticProps` (Pages Router)
- ❌ Misturar Pages Router e App Router
- ❌ Hardcodar URLs ou tokens
- ❌ `useEffect` para data fetching de servidor
- ❌ `dangerouslySetInnerHTML` sem ADR e sanitização
- ❌ `any` como tipo
- ❌ Componentes em `default export` sem nome (export nomeado é regra)
