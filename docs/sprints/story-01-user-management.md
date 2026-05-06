# Epic: Gestão de Usuários, Roles e Whitelist

**Contexto:** O acesso ao aplicativo precisa ser restrito apenas a membros da comissão, utilizando uma lista de e-mails/domínios pré-aprovados (Whitelist). Além disso, há uma hierarquia de acesso bem definida para criação e execução de tarefas.

## Perfis de Usuário (Roles)
1.  **Admin:** Acesso total. Possui funcionalidades do Coordenador, pode alterar perfis e cadastrar novos usuários na Whitelist.
2.  **Coordenador:** Gestor. Cria atividades e as delega para os usuários comuns.
3.  **Efetivo:** Usuário comum (campo/escritório). Acessa o sistema para visualizar e atualizar/executar as atividades designadas.

---

## User Stories

### US01: Painel de Controle de Usuários (Admin)
**Como** Administrador
**Quero** acessar uma aba de "Controle de Usuários"
**Para que** eu possa gerenciar a lista de e-mails/domínios autorizados (Whitelist) e ver os usuários cadastrados.
**Critérios de Aceite:**
*   A aba só deve ser visível e acessível para o papel `Admin`.
*   A interface deve listar os usuários registrados na plataforma.
*   A interface deve listar as regras da Whitelist (e-mails individuais ou domínios).

### US02: Cadastro de E-mails na Whitelist (Admin)
**Como** Administrador
**Quero** inserir novos e-mails ou domínios na Whitelist
**Para que** novos membros da equipe tenham permissão para se autenticar no aplicativo.
**Critérios de Aceite:**
*   Deve existir um formulário no painel para inserir e-mails (ex: `joao@email.com`) ou domínios (ex: `@cofz.gov.br`).
*   Deve ser possível remover regras da Whitelist.
*   Uma tentativa de login/cadastro de um usuário fora da Whitelist deve ser bloqueada.

### US03: Alteração de Perfil de Acesso (Admin)
**Como** Administrador
**Quero** alterar o perfil (role) de qualquer usuário cadastrado
**Para que** eu possa promover alguém a Coordenador ou rebaixar acessos conforme a necessidade da equipe.
**Critérios de Aceite:**
*   Na listagem de usuários, o Admin deve poder alterar o perfil do usuário (Admin / Coordenador / Efetivo) através de um Dropdown/Select.
*   Ao alterar, a mudança deve refletir instantaneamente nas permissões do usuário (ou no seu próximo acesso).
*   *Regra de Segurança:* O sistema deve impedir que o próprio usuário Admin remova o seu perfil de Admin caso ele seja o único Administrador ativo no sistema.

### US04: Criação de Atividades (Coordenador / Admin)
**Como** Coordenador ou Administrador
**Quero** visualizar e interagir com o botão/formulário de criação de atividades
**Para que** eu possa delegar o trabalho para os usuários Efetivos.
**Critérios de Aceite:**
*   O botão Flutuante (FAB) ou painel de "Nova Tarefa" só é visível se a role do usuário for `Admin` ou `Coordenador`.
*   Usuários `Efetivo` não devem ver o botão de criar nem acessar a rota de criação.
*   As Server Actions de criação de tarefas devem ser protegidas (verificando a role no servidor) para impedir acessos diretos.

### US05: Atribuição Automática de Perfil Padrão
**Como** Sistema
**Quero** que ao registrar um novo usuário com base na Whitelist, ele receba um perfil padrão
**Para que** não ocorra escalação indevida de privilégios e ele já possa usar o sistema.
**Critérios de Aceite:**
*   Quando o usuário passar pelo Supabase Auth e o cadastro for confirmado, um *Trigger* no banco ou uma *Server Action* no primeiro login define a role dele como `Efetivo`.
*   O Administrador criador do sistema será definido manualmente via banco na primeira configuração.

---
> **Próximos Passos:** 
> Precisamos criar o esquema do banco de dados (Tabelas: `users_roles`, `whitelist`, e os triggers de autenticação) utilizando Supabase.
> Validando estas User Stories, já podemos começar as queries do Supabase para montar esse ambiente.
