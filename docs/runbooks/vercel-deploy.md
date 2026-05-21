# Runbook — Deploy na Vercel

> Documento operacional. Cobre setup inicial, variáveis de ambiente, CD via GitHub Actions e procedimento de rollback.

---

## Pré-requisitos

- Conta na Vercel com acesso à org `CO-FZ`
- Vercel CLI instalado localmente: `pnpm add -g vercel`
- Acesso de admin ao repositório `CO-FZ/quadro` no GitHub
- Projeto Supabase de produção já provisionado (`supabase db push` aplicado)

---

## 1. Setup inicial do projeto na Vercel

### 1.1 Vincular o repositório

```bash
# Na raiz do repositório
vercel link
```

Responder:
- **Set up and deploy?** → `Y`
- **Which scope?** → selecionar a org `CO-FZ`
- **Link to existing project?** → `N` (primeiro deploy) ou `Y` + nome do projeto existente
- **Project name?** → `quadro`
- **In which directory?** → `.` (raiz)

Isso cria `.vercel/project.json` — **não commitar este arquivo** (já no `.gitignore`).

### 1.2 Obter IDs do projeto

```bash
cat .vercel/project.json
```

Saída:
```json
{
  "orgId": "team_XXXXXXXXXXXXXXXX",
  "projectId": "prj_XXXXXXXXXXXXXXXX"
}
```

Guardar `orgId` e `projectId` — serão usados como secrets no GitHub.

---

## 2. Variáveis de ambiente na Vercel

Configurar no dashboard: **Vercel → quadro → Settings → Environment Variables**

| Nome | Ambiente | Descrição |
|------|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | URL da API Supabase (ex: `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Chave pública anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Chave service_role (server-side, nunca exposta no client) |

> **Segurança**: `SUPABASE_SERVICE_ROLE_KEY` deve ser marcada como **Sensitive** na Vercel e **nunca** commitada no repositório.

---

## 3. Secrets no GitHub Actions

Configurar em: **GitHub → CO-FZ/quadro → Settings → Secrets and variables → Actions**

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Token gerado em Vercel → Account Settings → Tokens (scope: Full Account) |
| `VERCEL_ORG_ID` | Valor de `orgId` do `project.json` |
| `VERCEL_PROJECT_ID` | Valor de `projectId` do `project.json` |

---

## 4. Fluxo de deploy automático (CD)

O workflow `.github/workflows/cd.yml` opera em dois modos:

```
push → main
  └─ CI (typecheck + lint + unit) passa
      └─ CD: deploy-production → Vercel Production
             URL: https://quadro.vercel.app (ou domínio customizado)

pull_request → main
  └─ CD: deploy-preview → Vercel Preview
         URL: https://quadro-<hash>.vercel.app
         Comentário automático no PR com URL
```

---

## 5. Deploy manual (emergência)

```bash
# Preview
vercel --yes

# Production (requer aprovação explícita)
vercel --prod --yes
```

---

## 6. Verificar deploy

```bash
vercel ls           # lista deployments recentes
vercel inspect <url>  # inspeciona um deployment específico
```

Ou via dashboard: **Vercel → quadro → Deployments**

Checks pós-deploy:
- [ ] `/dashboard` carrega sem erro 500
- [ ] `/kanban` carrega e exibe colunas
- [ ] Auth (login) funciona
- [ ] Supabase RLS não bloqueou queries esperadas

---

## 7. Rollback

### Via Vercel CLI
```bash
vercel rollback [deployment-url]
```

### Via Dashboard
1. Vercel → quadro → Deployments
2. Localizar deployment anterior (status: `Ready`)
3. Menu `···` → **Promote to Production**

> O rollback troca o alias de produção instantaneamente — sem rebuild.

---

## 8. Domínio customizado (opcional)

```bash
vercel domains add quadro.cofz.mil.br
vercel alias set <deployment-url> quadro.cofz.mil.br
```

Ou via dashboard: **Settings → Domains → Add**.

---

## 9. Variáveis de ambiente por ambiente

| Ambiente | Branch | URL padrão |
|----------|--------|-----------|
| Production | `main` | `https://quadro.vercel.app` |
| Preview | qualquer PR | `https://quadro-<hash>-cofz.vercel.app` |
| Development | local | `http://localhost:3000` |

Para ambientes `preview` que precisam de Supabase separado, configurar variáveis específicas de Preview no dashboard da Vercel apontando para projeto Supabase de staging.

---

## Troubleshooting

| Erro | Causa provável | Solução |
|------|---------------|---------|
| Build falha com `Error: Cannot find module` | pnpm install não rodou | verificar `installCommand` no `vercel.json` |
| 500 em rotas autenticadas | `SUPABASE_SERVICE_ROLE_KEY` ausente | adicionar nas env vars da Vercel |
| `Invalid API key` no cliente | `NEXT_PUBLIC_SUPABASE_ANON_KEY` errada | checar Vercel → Settings → Env Vars |
| Deploy não disparou após merge | CI falhou ou secret ausente | checar aba Actions no GitHub |
