# Phase 3: Geração Avançada de PDF - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Expandir a geração client-side de catálogos em formato PDF (com jsPDF) a partir do estado global de vinhos selecionados (Zustand). A implementação inclui a criação de um formulário modal para coleta de termos comerciais e dados do representante, persistência local de metadados, pré-carregamento assíncrono de imagens no modal com indicador de loading, e organização visual do PDF agrupando vinhos por tipo com sumário inicial e capa estilizada dedicada.

</domain>

<decisions>
## Implementation Decisions

### Capa Dedicada Premium
- **D-01:** O PDF gerado terá uma página inteira de capa dedicada.
- **D-02:** O design da capa usará a identidade premium da Allvino (paleta escura/bordô baseada em `#A61C3C`), exibindo o logotipo da marca, título customizado do catálogo, data de geração e dados de contato do representante comercial.

### Dados Comerciais e do Representante
- **D-03:** O componente `FloatingPdfButton` exibirá um formulário modal estilizado antes de iniciar a geração do PDF.
- **D-04:** O modal coletará os seguintes dados comerciais estruturados: Nome do Representante, Telefone/WhatsApp do Representante, Valor de Pedido Mínimo, Prazo de Entrega e Informações sobre Frete.
- **D-05:** Esses campos serão salvos automaticamente no `localStorage` do navegador para evitar que o usuário precise digitá-los novamente em gerações futuras.

### Cache e Pré-carregamento de Imagens com Loading
- **D-06:** Ao clicar no botão de baixar no modal, o sistema exibirá uma indicação clara de carregamento (spinner/loading) enquanto baixa e converte as imagens remotas dos vinhos selecionados para dataURL.
- **D-07:** Caso ocorra falha ao baixar alguma imagem (CORS, link quebrado), o gerador usará uma imagem de fallback ou um placeholder gráfico ("Sem imagem") de forma a nunca quebrar ou travar a compilação do PDF.

### Agrupamento por Tipo e Sumário
- **D-08:** O índice ou sumário do catálogo (exibido na página 2, após a capa dedicada) agrupará os vinhos por tipo (Tintos, Brancos, Rosés, Espumantes), exibindo um resumo conciso e o valor total estimado da seleção.
- **D-09:** O PDF respeitará o agrupamento por tipo na listagem de vinhos, mas manterá a ordenação interna de acordo com a prioridade cadastrada no catálogo.

### Discreção do Desenvolvedor (Discretion)
- **D-10:** Estilo exato e layout das seções e tabelas do PDF para garantir um visual de alto padrão.
- **D-11:** Tratamento e responsividade do modal de formulário na tela do catálogo.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PDF Generation Library
- [generate-catalog-pdf.ts](file:///C:/Users/User/.minimax/sessions/mvs_c8abfd00ed5d4ce280bfc56e75729211/workspace/wine-catalog/src/lib/pdf/generate-catalog-pdf.ts) — Arquivo que contém a lógica de renderização em jsPDF + jspdf-autotable.
- [FloatingPdfButton.tsx](file:///C:/Users/User/.minimax/sessions/mvs_c8abfd00ed5d4ce280bfc56e75729211/workspace/wine-catalog/src/components/catalog/FloatingPdfButton.tsx) — Componente do modal onde o formulário comercial e o estado de carregamento serão integrados.

### Database and Types
- [wine.ts](file:///C:/Users/User/.minimax/sessions/mvs_c8abfd00ed5d4ce280bfc56e75729211/workspace/wine-catalog/src/types/wine.ts) — Definição dos tipos de vinho e filtros.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- A função `generateCatalogPdfWithImages` em `generate-catalog-pdf.ts` faz o download prévio e cache das URLs de imagens de vinhos de forma paralela via `urlToDataUrl` antes de renderizar as páginas. Isso deve ser expandido para aceitar os dados do representante e termos comerciais nos parâmetros.
- O componente `FloatingPdfButton` gerencia a visualização do modal, contagem de itens do Zustand e chamada de download.

### Established Patterns
- Utilização de classes utilitárias do Tailwind CSS.
- Uso de componentes de UI minimalistas e elegantes com paleta Dark/Vinho.

### Integration Points
- O formulário do modal em `FloatingPdfButton` repassará os metadados do representante e termos comerciais para as opções de `generateCatalogPdfWithImages` na chamada do clique.

</code_context>

<specifics>
## Specific Ideas

- O sumário na página 2 usará o `jspdf-autotable` para listar os itens selecionados, organizados por seções de tipos de vinhos para dar um aspecto de catálogo de distribuidora de vinhos profissional.
- O contato do WhatsApp do representante poderá ser estruturado no rodapé ou na capa com um link direto ou ícone, facilitando o contato posterior do cliente B2B.

</specifics>

<deferred>
## Deferred Ideas

- Integração direta com envio automático do PDF via WhatsApp Business API (ANLT-01/INTG-01 — reservado para marcos futuros/v2).

</deferred>

---

*Phase: 03-geracao-avancada-de-pdf*
*Context gathered: 2026-06-04*
