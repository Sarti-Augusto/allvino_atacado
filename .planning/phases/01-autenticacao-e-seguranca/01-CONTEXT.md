# Phase 1: Autenticação & Segurança - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar a autenticação de administradores usando o Supabase Auth com proteção de rotas no Next.js Middleware. A criação de novos administradores será manual e a validação de permissões (ativo e roles) será integrada à sessão.

</domain>

<decisions>
## Implementation Decisions

### Criação de Administradores
- Nenhum formulário público de cadastro (Sign Up) será criado.
- A criação de novos administradores é 100% restrita e manual, realizada diretamente pelo painel do Supabase ou CLI do Supabase.
- A trigger de banco de dados (`trg_on_auth_user_created`) já existente criará o perfil correspondente na tabela `public.admin_users`.

### Middleware e Proteção de Rotas
- Toda rota sob `/admin/*` é privada por padrão e requer uma sessão autenticada.
- Exceção pública: `/admin/login` que exibe a tela de login.
- Usuário sem sessão ativa tentando acessar `/admin/*` (privado) é redirecionado para `/admin/login`.
- Usuário autenticado tentando acessar `/admin/login` é redirecionado automaticamente para o painel principal `/admin`.

### UI de Login & Validação
- Rota: `/admin/login`.
- Estética premium alinhada à Allvino: Dark mode refinado, cantos arredondados, fontes modernas, efeitos sutis de hover e layout minimalista (fundo neutro escuro).
- Processamento do login feito via Server Action no Next.js chamando `signInWithPassword` do Supabase.
- Exibição de erros de autenticação inline no formulário com transição suave, ou via componente Toast.

### Níveis de Permissão (Roles) e Status
- O Middleware e as Server Actions devem validar se o usuário autenticado possui registro na tabela `public.admin_users` e se a flag `ativo` é `true`.
- Se o usuário autenticado estiver inativo (`ativo = false`), o login deve falhar com uma mensagem apropriada ou o acesso deve ser bloqueado na rota privada.
- A coluna `role` (`owner`/`editor`) deve ser extraída no contexto da sessão para futura diferenciação de controle de acesso (por exemplo, na edição de outros administradores).

### Decisão do Desenvolvedor (Discretion)
- Design específico dos campos do formulário (estados de focus, loaders de submissão).
- Nome e estrutura da Server Action de autenticação.
- Mensagens de erro específicas exibidas ao usuário final.

</decisions>

<canonical_refs>
## Canonical References

### Database Schema & Policies
- `supabase/migrations/001_initial_schema.sql` — Tabelas `wines`, `admin_users`, triggers de banco e políticas de Row Level Security (RLS).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase.ts` — Contém `createServerSupabase` para inicialização do cliente Supabase no Middleware e Server Actions, e `createBrowserSupabase` para Client Components.

### Established Patterns
- Next.js 14 App Router estruturando Server Components por padrão.

</code_context>

<deferred>
## Deferred Ideas

- CRUD de vinhos e listagem administrativa — Fase 2.
- Edição de perfis administrativos de terceiros e gerenciamento de permissões pelo painel — Fase 2 ou posterior.

</deferred>

---

*Phase: 01-autenticacao-e-seguranca*
*Context gathered: 2026-06-04*
