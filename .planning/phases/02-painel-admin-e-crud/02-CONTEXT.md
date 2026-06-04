# Phase 2: Painel Admin & CRUD - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar o gerenciamento completo de vinhos (CRUD) na área administrativa, incluindo listagem paginada com buscas, formulários dedicados de criação e edição, upload de imagens de rótulo para o Supabase Storage, toggles de ação rápida para status ativo/destaque e ordenação manual de exibição do catálogo.

</domain>

<decisions>
## Implementation Decisions

### Páginas e Navegação do CRUD
- A listagem de vinhos será exibida em `/admin/vinhos`.
- A criação de novos vinhos será em `/admin/vinhos/novo`.
- A edição de vinhos existentes será em `/admin/vinhos/[id]`.
- Links de navegação rápidos devem ligar a Home `/admin` com a listagem de vinhos `/admin/vinhos`.

### Upload de Imagens (Supabase Storage)
- No formulário de cadastro/edição, o usuário poderá selecionar um arquivo de imagem.
- A imagem será enviada para o bucket `wine-images` do Supabase Storage.
- Regra de nomenclatura: o arquivo será salvo renomeado com um UUID (ex: `d3b07384-d113-40e1-bbbb-03e5c9b7fae2.png`) preservando a extensão original do upload para evitar colisões de nome e caching do navegador.
- O campo `imagem_url` do vinho no banco de dados armazenará a URL pública gerada pelo Supabase.

### Ordenação Manual dos Vinhos
- A tabela de listagem de vinhos exibirá botões/inputs numéricos para controlar a ordenação (`ordem`).
- Botões de incremento/decremento simples ou alteração direta do input numérico acionarão uma Server Action para salvar a nova ordem no banco de dados e atualizar o catálogo.

### Toggles de Ação Rápida na Tabela
- A tabela em `/admin/vinhos` exibirá botões rápidos/toggles de clique único para os campos `ativo` e `destaque`.
- Clicar neles disparará uma Server Action para inverter o status no banco instantaneamente, atualizando a visualização do usuário com feedback suave (desabilitando temporariamente enquanto processa).

### Validações de Formulário
- Validações obrigatórias no servidor: `nome`, `produtor`, `pais`, `preco_atacado` (deve ser maior ou igual a zero), e `caixa_fechada_qnt` (deve ser maior que zero).
- O campo `tipo` deve pertencer ao enum `wine_type`.
- O ano de `safra` deve estar entre 1900 e o ano atual + 1, caso seja informado.

### Decisão do Desenvolvedor (Discretion)
- Design exato da tabela de listagem (headers, alinhamentos, paginação).
- Layout interno dos formulários de cadastro e edição.
- Detalhes de feedback de sucesso (banners de confirmação, toasts).

</decisions>

<canonical_refs>
## Canonical References

### Database Schema
- `supabase/migrations/001_initial_schema.sql` — Contém a definição das colunas de `wines`, checks de preço/safra, tipos ENUM e a declaração de políticas de Storage para o bucket `wine-images`.

### Conexão Supabase
- `src/lib/supabase.ts` — Inicializadores do Supabase Client para operações seguras de upload e mutação.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/actions/wines.ts` — Contém `fetchWinesServer` que serve de modelo para queries do Supabase, embora precise de adaptações para a listagem admin (que deve listar vinhos ativos e inativos).
- `src/components/catalog/FilterBar.tsx` — Padrões de filtros que podem inspirar a barra de pesquisa e filtros do Admin.

</code_context>

<deferred>
## Deferred Ideas

- Customização de PDF avançado — Fase 3.
- Exibição e geração de QR Codes nas fichas de vinhos — Fase 4.

</deferred>

---

*Phase: 02-painel-admin-e-crud*
*Context gathered: 2026-06-04*
