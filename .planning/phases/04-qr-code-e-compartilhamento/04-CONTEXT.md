# Phase 4: QR Code & Compartilhamento - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar a geração e exibição local de QR Code exclusivo na ficha técnica de cada vinho (`/vinho/[id]`) usando a biblioteca `qrcode`, permitindo que usuários de dispositivos móveis acessem a página de forma ágil. A fase também inclui a substituição dos botões de compartilhamento por um botão de Compartilhamento Inteligente utilizando a Web Share API (para dispositivos móveis/suportados) com fallback automático de cópia de link para a área de transferência.

</domain>

<decisions>
## Implementation Decisions

### Geração de QR Code
- **D-01:** O QR Code será gerado localmente usando a biblioteca npm `qrcode`, garantindo funcionamento offline e independência de APIs de terceiros.
- **D-02:** O código gerado será exibido diretamente na página de detalhes como um SVG inline, otimizando o tempo de carregamento e escalabilidade da imagem.

### Posicionamento e Visualização
- **D-03:** O QR Code ficará fixado na lateral da ficha técnica do vinho (lado direito, abaixo do bloco de preços e botões de compartilhamento).
- **D-04:** Incluirá uma moldura elegante e uma instrução em texto curto: "Aponte a câmera para abrir no celular".

### Compartilhamento Inteligente
- **D-05:** Criar um componente de compartilhamento unificado que tenta utilizar a Web Share API nativa do dispositivo (se suportada, abrindo a gaveta nativa com opções de WhatsApp, Telegram, e-mail, etc.).
- **D-06:** Se a Web Share API não for suportada (ex: navegadores desktop antigos), o componente copiará automaticamente a URL absoluta do vinho para a área de transferência e exibirá uma confirmação suave ("Link copiado!").

### Discreção do Desenvolvedor (Discretion)
- **D-07:** Design e espaçamento exatos do bloco do QR Code e do botão de compartilhamento inteligente.
- **D-08:** Cores e textos específicos dos toasts/banners de cópia para garantir a harmonia visual.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ficha Técnica e Compartilhamento
- [page.tsx](file:///C:/Users/User/.minimax/sessions/mvs_c8abfd00ed5d4ce280bfc56e75729211/workspace/wine-catalog/src/app/vinho/[id]/page.tsx) — Página do vinho onde o QR Code e o botão de compartilhamento inteligente serão acoplados.
- [WhatsAppShareButton.tsx](file:///C:/Users/User/.minimax/sessions/mvs_c8abfd00ed5d4ce280bfc56e75729211/workspace/wine-catalog/src/components/catalog/WhatsAppShareButton.tsx) — Componente de compartilhamento a ser adaptado ou substituído para usar o compartilhamento inteligente.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- A URL absoluta `productUrl` já é gerada em `src/app/vinho/[id]/page.tsx` usando cabeçalhos do host para garantir o acesso externo.

### Established Patterns
- Uso de componentes Client e Server integrados com o Tailwind CSS e ícones de Lucide-React.

</code_context>

<deferred>
## Deferred Ideas

- Nenhuma ideia adiada para esta fase.

</deferred>

---

*Phase: 04-qr-code-e-compartilhamento*
*Context gathered: 2026-06-04*
