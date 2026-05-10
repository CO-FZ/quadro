/**
 * Mensagens do painel admin — pt-BR. Story 07B.2 CA-08.
 */

export const admin = {
  whitelist: {
    privileged_domain_warning: (domain: string, role: string) =>
      `⚠️ Atenção: todos os usuários novos do domínio ${domain} entrarão automaticamente como ${role}. Considere usar e-mails individuais para roles privilegiadas.`,
  },
} as const
