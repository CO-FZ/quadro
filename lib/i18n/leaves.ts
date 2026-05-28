/**
 * Mensagens da gestão de férias/afastamentos — pt-BR. Sprint 23 (ADR 0014).
 */

export const leaves = {
  tab_label: 'Férias',
  panel_title: 'Gestão de Férias',
  panel_subtitle: 'Períodos de férias e afastamentos do efetivo',
  type: {
    ferias: 'Férias',
    instalacao: 'Instalação',
    dispensa: 'Dispensa',
  },
  modal: {
    title: 'Afastamentos',
    existing: 'Períodos cadastrados',
    empty: 'Nenhum período cadastrado.',
    new_period: 'Novo período',
    field_start: 'Data de início',
    field_end: 'Data de fim',
    field_type: 'Tipo',
    field_description: 'Descrição (opcional)',
    save: 'Salvar período',
    delete_confirm: 'Excluir este período?',
    created: 'Período adicionado.',
    updated: 'Período atualizado.',
    removed: 'Período removido.',
  },
  empty_year: 'Nenhum afastamento registrado neste ano.',
} as const
