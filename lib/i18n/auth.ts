/**
 * Mensagens de auth — pt-BR. Story 07B.2 CA-08.
 *
 * Não importar daqui em código de UI: use `t('auth.errors.<key>')` via `lib/i18n`.
 * Esta separação por namespace existe para crescer sem virar um mega-arquivo.
 */

export const auth = {
  errors: {
    not_authorized:
      'Este e-mail não está autorizado a acessar o Quadro. Fale com o administrador da equipe.',
    auth_failed: 'Não foi possível autenticar. Tente novamente.',
  },
} as const
