---
phase: 4
slug: qr-code-e-compartilhamento
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | npm scripts (lint, typecheck, next build) |
| **Config file** | tsconfig.json, package.json, eslint-config-next |
| **Quick run command** | npm run typecheck |
| **Full suite command** | npm run build |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Build must succeed with zero errors
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | - | - | Instalar dependências | lint | npm run typecheck | ✓ | verified |
| 04-01-02 | 01 | 1 | SHARE-01 | T-04-01 | Geração segura de SVG client-side | lint | npm run typecheck | ✓ | verified |
| 04-01-03 | 01 | 1 | SHARE-02 | T-04-02 | Compartilhamento seguro Web Share | lint | npm run typecheck | ✓ | verified |
| 04-01-04 | 01 | 1 | SHARE-01, SHARE-02 | T-04-03 | Renderização da ficha técnica | lint | npm run typecheck | ✓ | verified |

*Status: verified*

---

## Wave 0 Requirements

*Existing infrastructure (TypeScript and Next.js compiler) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Exibição do QR Code | SHARE-01 | Visualização gráfica de SVG | Acessar `/vinho/[id]`. Confirmar que o QR Code renderiza com visual elegante na coluna lateral. Scannear o código usando a câmera do celular e confirmar se ele abre a URL absoluta correta do vinho. |
| Compartilhamento Inteligente | SHARE-02 | Suporte da API Web Share e área de transferência | No mobile: Clicar no botão 'Compartilhar' e confirmar se abre a gaveta nativa de compartilhamento. No desktop: Clicar no mesmo botão e verificar se o link é copiado e o toast exibe a confirmação 'Link copiado!'. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
