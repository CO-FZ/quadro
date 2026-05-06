# Security Checklist

> Lista executável a ser passada **antes** de cada release de marco (v1.0, e a cada 3 meses depois). Itens marcados `[ ]` que não passam, **bloqueiam o release**.

> Contexto regional: LGPD (Brasil) é piso. Se atender mercado externo, somar GDPR/CCPA conforme aplicável.

---

## 1. Secrets e credenciais

- [ ] Nenhum secret commitado no repo (`gitleaks` em pre-commit + CI).
- [ ] `.env`, `.env.local`, `.env.*.local` no `.gitignore`.
- [ ] `.env.example` apenas com placeholders óbvios (`REPLACE_ME`, `xxxx`).
- [ ] Secrets de produção em gerenciador (GCP Secret Manager / AWS Secrets Manager / Doppler / Vault).
- [ ] Acesso a secrets segue least privilege; auditoria habilitada.
- [ ] Rotação de chaves documentada e testada (DB, JWT, API keys).
- [ ] Tokens de CI são tokens efêmeros (OIDC) sempre que possível.

---

## 2. Autenticação

- [ ] Senha mínima 12 chars + zxcvbn ≥ 3, ou autenticação por provedor confiável (OAuth/SSO).
- [ ] MFA disponível para usuários admin.
- [ ] Cookies de sessão: `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Sessões expiram em janela razoável (ex.: 30 dias com sliding) e podem ser revogadas.
- [ ] Logout invalida a sessão no servidor (não só no cliente).
- [ ] Recuperação de senha via link de uso único, com expiração ≤ 1h.
- [ ] Rate limit em login, recuperação de senha, signup.
- [ ] Lockout temporário após N tentativas falhas.
- [ ] Logs de auth não expõem senha nem token.

---

## 3. Autorização (RBAC / ABAC)

- [ ] Toda Server Action verifica autenticação **e** autorização explicitamente.
- [ ] Toda rota autenticada protegida por layout guard ou `proxy.ts`.
- [ ] **Não confiar em check só no cliente.** Cliente é UX; servidor é fonte de verdade.
- [ ] Recursos do tipo `/inspections/[id]` verificam *ownership* ou role apropriado.
- [ ] Testes E2E cobrem casos negativos: usuário B tentando acessar recurso de A → 403/404.

---

## 4. Input e output

- [ ] Toda entrada de borda validada com Zod/Valibot (Server Actions, API routes, params, search params).
- [ ] Saída para HTML usa React (escape automático). `dangerouslySetInnerHTML` apenas com sanitização (DOMPurify) e **ADR**.
- [ ] Uploads validam: tipo MIME real (não só extensão), tamanho máximo, escaneamento se possível.
- [ ] Strings de erro retornadas ao cliente são **mensagens seguras**, sem stack trace nem detalhes internos.
- [ ] SSRF: nenhum fetch usa URL fornecida pelo usuário sem allowlist de host.
- [ ] Open redirect: redirects pós-login validam URL contra allowlist.

---

## 5. Banco de dados

- [ ] Apenas queries parametrizadas / via ORM (Drizzle/Prisma). Sem string concat.
- [ ] Pool de conexões dimensionado para o ambiente.
- [ ] Backups automáticos diários, com **teste de restore** trimestral.
- [ ] PITR (point-in-time recovery) habilitado em prod.
- [ ] Replicas de leitura usadas onde apropriado, sem expor escrita acidental.
- [ ] Migrations em CI rodam com user separado, sem privilégio de DDL em produção em runtime.

---

## 6. Headers HTTP (configurados em `proxy.ts`)

- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `Content-Security-Policy` restritiva e testada (sem `unsafe-eval`)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` (ou `frame-ancestors` no CSP)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restritiva (camera/mic/geolocation só onde precisa)
- [ ] Cookies sensíveis nunca acessíveis a JS.
- [ ] Teste E2E que valida presença e valor desses headers.

---

## 7. Dependências

- [ ] `pnpm audit --audit-level=high` no CI bloqueia merge se houver vulnerabilidade `high`/`critical`.
- [ ] Renovate ou Dependabot ativos.
- [ ] Política: vulnerabilidade `critical` resolvida em ≤ 7 dias; `high` em ≤ 30 dias.
- [ ] Lockfile commitado (`pnpm-lock.yaml`).
- [ ] CVEs específicos do ecossistema verificados antes de release. **Atenção especial:** CVE-2025-66478 (Next.js 15.x/16.x default App Router susceptível a RCE via desserialização de RSC, derivada de CVE-2025-55182 do React). Confirme que está em versão patcheada.

---

## 8. CSRF / mutações

- [ ] Server Actions do Next 16 já têm proteção CSRF integrada via origem; verificada e habilitada.
- [ ] API routes que aceitam POST/PUT/DELETE de origem cross-site exigem token CSRF explícito.
- [ ] Webhooks externos validam assinatura (HMAC) e timestamp (anti-replay, ≤ 5 min).

---

## 9. Logs e dados sensíveis

- [ ] Logger com **redaction** automática de campos sensíveis (`password`, `token`, `cpf`, `cartao`, …).
- [ ] PII nunca em logs em texto claro.
- [ ] Stack traces em produção: enviados a observability, não expostos ao cliente.
- [ ] Identificadores de usuário em logs: hash ou ID interno, não email.
- [ ] Retenção de logs definida por política (ex.: 30 dias hot, 1 ano cold, depois apaga).

---

## 10. LGPD (Brasil)

- [ ] Política de privacidade publicada, datada, em português claro.
- [ ] Termos de uso publicados.
- [ ] Base legal documentada para cada tipo de dado coletado.
- [ ] Consentimento explícito quando a base legal for consentimento (cookies não essenciais, marketing).
- [ ] Banner de cookies funcional (rejeitar é tão fácil quanto aceitar).
- [ ] Endpoint/processo para usuário **exportar** seus dados.
- [ ] Endpoint/processo para usuário **deletar** sua conta e dados.
- [ ] Cláusulas de DPA assinadas com sub-operadores (provedor de hospedagem, e-mail, analytics).
- [ ] Encarregado (DPO) identificado e contato publicado.
- [ ] Plano de resposta a incidente com notificação à ANPD em ≤ 72h.
- [ ] Inventário de dados (Data Mapping) atualizado.
- [ ] Avaliação de impacto (RIPD) feita para tratamentos de risco.

---

## 11. Disponibilidade e resiliência

- [ ] Healthcheck `/api/health` que verifica DB e dependências críticas.
- [ ] Timeouts configurados em todas as chamadas externas.
- [ ] Circuit breaker / retry com backoff em integrações instáveis.
- [ ] Rate limit em endpoints públicos (auth, API pública).
- [ ] Proteção DDoS via provedor (Cloudflare / Vercel built-in).
- [ ] Plano de DR (Disaster Recovery) testado.
- [ ] RTO e RPO documentados e aceitos pelo sponsor.

---

## 12. Observabilidade segura

- [ ] Sentry/observability **não** captura PII.
- [ ] Sample rate ajustado (não vaza dados em produção).
- [ ] Apenas time autorizado tem acesso aos dashboards de observability.
- [ ] Audit logs separados, imutáveis (append-only) para ações sensíveis (login admin, deleção, mudança de role).

---

## 13. Antigravity / IA-assistido

- [ ] **Knowledge Base do Antigravity** não contém secrets, PII ou dados confidenciais.
- [ ] Workspace do agente roda com Terminal Sandbox **on**.
- [ ] Allowlist de comandos respeitada (ver `AGENTS.md`).
- [ ] Dados de produção **nunca** copiados para ambiente de dev/dataset de teste sem mascaramento.
- [ ] Prompts do agente revisados — nenhum prompt pede para "ignorar regras anteriores".
- [ ] Auditoria de tool calls do agente armazenada para casos de revisão.

---

## 14. Threat modeling rápido (STRIDE)

Para a v1.0 e a cada feature crítica, responder em 1 página:

| Categoria | Pergunta | Mitigação |
|-----------|----------|-----------|
| **S**poofing | Como autenticar usuário/serviço? | provedor + MFA |
| **T**ampering | Como garantir integridade da mensagem? | TLS + assinatura |
| **R**epudiation | Como provar quem fez o quê? | audit log imutável |
| **I**nformation disclosure | Onde dados sensíveis vivem? | criptografia at-rest + in-transit |
| **D**enial of Service | Quais limites? | rate limit + autoscale |
| **E**levation of privilege | Como impedir admin não autorizado? | RBAC + audit |

---

## 15. Testes de segurança automatizados (CI)

- [ ] `gitleaks` (secrets em commits)
- [ ] `pnpm audit` (deps)
- [ ] SAST (Semgrep ou similar)
- [ ] Teste E2E que verifica headers de segurança
- [ ] Teste E2E que verifica negação de acesso cruzado
- [ ] Lighthouse Best Practices ≥ 0.95

---

## 16. Plano de resposta a incidentes

`docs/runbooks/incident-response.md` deve ter:

- Quem é on-call e como acioná-lo (24/7 se aplicável).
- Severidade (S0–S3) e tempo de resposta esperado.
- Comunicação (canal interno, status page, clientes, ANPD se LGPD).
- Forensics: preservar logs, snapshot, escopo do impacto.
- Postmortem em ≤ 48h, sem culpabilização.

---

## Como o agente atua em segurança

- ❌ Nunca cole valores reais de variáveis em chat ou Artifact.
- ❌ Nunca grave secrets em Knowledge Base.
- ❌ Nunca relaxe um item desta checklist sem ADR explícito assinado pelo responsável.
- ✅ Sempre que detectar risco fora do escopo da story, **pare** e abra issue de segurança.
- ✅ Sempre que sugerir uma dependência nova, verifique CVEs recentes e cite no PR.
