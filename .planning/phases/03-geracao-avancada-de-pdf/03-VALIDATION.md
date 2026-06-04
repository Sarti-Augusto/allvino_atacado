---
phase: 3
slug: geracao-avancada-de-pdf
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | PDF-02, PDF-04 | T-03-01 | Geração e design de PDF client-side | lint | npm run typecheck | ✓ | pending |
| 03-01-02 | 01 | 1 | PDF-01, PDF-03 | T-03-02 | Persistência de formulário e controle de loading | lint | npm run typecheck | ✓ | pending |

*Status: pending*

---

## Wave 0 Requirements

*Existing infrastructure (TypeScript and Next.js compiler) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Capa Premium e Sumário | PDF-02 | Exige visualização do PDF gerado | Selecionar vinhos no catálogo. Clicar no botão para baixar o PDF. Confirmar se a primeira página contém a capa dedicada com título e metadados, e se a segunda página agrupa os vinhos por tipo com o sumário. |
| Formulário Comercial e LocalStorage | PDF-03 | Requer inputs e verificação de storage | Abrir o modal de PDF. Preencher todos os campos do formulário (Representante, WhatsApp, etc.). Fechar o modal, dar refresh na página e reabrir. Verificar se os campos mantêm os valores digitados. |
| Cache e Spinner de Loading | PDF-04 | Requer análise de rede e tempo de carregamento | Clicar em baixar PDF no catálogo. Garantir que o botão mostre o spinner e mude para "Gerando PDF..." ou similar, desativando inputs. Checar se o PDF final renderiza as fotos reais dos vinhos. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
