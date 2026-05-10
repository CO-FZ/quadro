/**
 * Mensagens do painel admin — pt-BR. Story 07B.2 CA-08.
 */

export const admin = {
  whitelist: {
    privileged_domain_warning: (domain: string, role: string) =>
      `⚠️ Atenção: todos os usuários novos do domínio ${domain} entrarão automaticamente como ${role}. Considere usar e-mails individuais para roles privilegiadas.`,
  },
  audit: {
    tab_label: 'Auditoria',
    badge_new: 'novo',
    title: 'Criação automática com role privilegiada',
    description:
      'Eventos registrados quando o trigger cria um profile com role admin/coordenador via whitelist.',
    empty: 'Nenhum evento registrado.',
    column_date: 'Data',
    column_email: 'E-mail',
    column_role: 'Role',
    column_source: 'Origem',
    column_whitelist_entry: 'Entrada whitelist',
    source_whitelist_email: 'E-mail',
    source_whitelist_domain: 'Domínio',
    source_manual: 'Manual',
    whitelist_entry_removed: 'removida',
    fetch_error: 'Falha ao carregar audit log.',
    backfill_notice:
      'Audit log começa a partir desta migration; eventos anteriores não foram auditados.',
  },
} as const
