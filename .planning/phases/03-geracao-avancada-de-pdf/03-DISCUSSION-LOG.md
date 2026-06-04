# Phase 3: Geração Avançada de PDF - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 3-Geração Avançada de PDF
**Areas discussed:** Estilo da Capa do PDF, Termos Comerciais e Dados do Representante no Modal, Pré-carregamento e Cache de Imagens, Agrupamento e Ordenação de Produtos no PDF

---

## Estilo da Capa do PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Capa Dedicada Premium | Uma página inteira de capa com a marca Allvino, título do catálogo, data e dados do representante, seguida pelas páginas de vinhos. | ✓ |
| Cabeçalho Compacto | Sem página de capa dedicada; a primeira página já começa com a lista de vinhos e traz um cabeçalho estilizado no topo. | |
| Decida você | Antigravity define o melhor layout premium | |

**User's choice:** Capa Dedicada Premium
**Notes:** O usuário optou pela capa inteira dedicada no estilo visual premium da Allvino.

---

## Termos Comerciais e Dados do Representante no Modal

| Option | Description | Selected |
|--------|-------------|----------|
| Formulário Estruturado | Campos dedicados (Representante, WhatsApp, Pedido Mínimo, Prazo, Frete) com salvamento automático no localStorage para não precisar redigitar. | ✓ |
| Campo de Texto Livre | Apenas uma caixa de texto grande onde o usuário digita todas as observações comerciais e contatos livremente. | |
| Decida você | Antigravity define a melhor estrutura de campos | |

**User's choice:** Formulário Estruturado
**Notes:** O formulário salvará os dados comerciais estruturados localmente para reuso.

---

## Pré-carregamento e Cache de Imagens

| Option | Description | Selected |
|--------|-------------|----------|
| Cache com Loading no Modal | Ao clicar em 'Baixar PDF', o modal exibe um spinner e realiza o download/conversão de todas as imagens pendentes com fallback visual se houver falha. | ✓ |
| Pré-carregamento em Background | Carregar e converter as imagens em segundo plano de forma assíncrona assim que cada vinho for selecionado no catálogo B2B. | |
| Decida você | Antigravity define o melhor fluxo técnico | |

**User's choice:** Cache com Loading no Modal
**Notes:** Spinner visível durante a conversão e download das imagens dos vinhos selecionados com tratamento de erro resiliente.

---

## Agrupamento e Ordenação de Produtos no PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Agrupados por Tipo com Sumário | Vinhos organizados por seções (Tintos, Brancos, Rosés, Espumantes) com um índice/sumário resumido na página inicial do PDF. | ✓ |
| Lista Direta | Exibidos em ordem simples contínua conforme a ordenação ativa ou ordem de seleção do catálogo, sem divisão por tipo. | |
| Decida você | Antigravity define o agrupamento e ordenação | |

**User's choice:** Agrupados por Tipo com Sumário
**Notes:** Geração estruturada com divisões de tipo para uma experiência premium de folheto/catálogo comercial.

---

## the agent's Discretion

- Estilo e design específico das páginas internas do PDF.
- Design exato do layout de inputs e toasts do modal.

## Deferred Ideas

- Integração direta com APIs de mensageria WhatsApp Business para disparo automático.
