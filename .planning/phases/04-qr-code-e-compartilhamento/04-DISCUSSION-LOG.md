# Phase 4: QR Code & Compartilhamento - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04
**Phase:** 4-QR Code & Compartilhamento
**Areas discussed:** Geração de QR Code, Posicionamento e Visualização, Compartilhamento Inteligente

---

## Geração de QR Code

| Option | Description | Selected |
|--------|-------------|----------|
| Biblioteca Local | Instalar a biblioteca padrão 'qrcode' e gerar o QR Code localmente via SVG no servidor/cliente, sem dependências de APIs externas. | ✓ |
| API Externa | Renderizar o QR Code usando uma URL de imagem de serviço gratuito (como api.qrserver.com). Peso zero no bundle. | |

**User's choice:** Biblioteca Local
**Notes:** O usuário optou por gerar o QR Code 100% de forma local para resiliência offline e independência técnica.

---

## Posicionamento e Visualização

| Option | Description | Selected |
|--------|-------------|----------|
| Exibição Direta na Página | Mostrar o QR Code fixado na lateral da ficha técnica do vinho com a instrução 'Aponte a câmera para abrir no celular'. | ✓ |
| Modal Pop-up | Exibir apenas um botão 'Gerar QR Code' que abre o código em um modal suspenso. | |

**User's choice:** Exibição Direta na Página
**Notes:** O QR Code será impresso diretamente na lateral direita da ficha de detalhes do vinho.

---

## Compartilhamento Inteligente

| Option | Description | Selected |
|--------|-------------|----------|
| Compartilhamento Inteligente | Um botão unificado que abre o compartilhamento nativo do dispositivo (se disponível) ou copia o link automaticamente. | ✓ |
| Botões Fixos Dedicados | Botões separados fixos (um para WhatsApp direct link e outro para copiar link). | |

**User's choice:** Compartilhamento Inteligente
**Notes:** Uso dinâmico de Web Share API com fallback automático de cópia de link.

---

## the agent's Discretion

- Estilo e design específico do botão e moldura do QR Code.
- Copywriting exato da mensagem de sucesso do link copiado.
