---
phase: 2
slug: painel-admin-e-crud
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 2 — Validation Strategy

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
| 02-01-01 | 01 | 1 | ADMIN-02 | T-02-01 | Read/write data from Supabase | lint | npm run typecheck | ✓ | pending |
| 02-01-02 | 01 | 1 | ADMIN-07 | T-02-02 | Toggles and order update actions | lint | npm run typecheck | ✓ | pending |
| 02-01-03 | 01 | 1 | ADMIN-03 | T-02-03 | Validate form inputs and upload | lint | npm run typecheck | ✓ | pending |
| 02-01-04 | 01 | 1 | ADMIN-04 | T-02-04 | Layout pages render forms correctly | lint | npm run typecheck | ✓ | pending |

*Status: pending*

---

## Wave 0 Requirements

*Existing infrastructure (TypeScript and Next.js compiler) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Listagem e Busca | ADMIN-02 | Exige interação do roteamento e digitação | Acessar `/admin/vinhos`. Pesquisar por um termo existente e inesistente. Confirmar filtros rápidos funcionando em tela. |
| Toggles Ativo e Destaque | ADMIN-07 | Interações assíncronas do Supabase em tela | Clicar no toggle de ativo de um vinho. Checar no catálogo público se ele sumiu/reapareceu. Clicar no destaque e verificar se a ordem de exibição mudou. |
| Reordenação de Vinhos | ADMIN-08 | Interação de botões Up/Down e inputs | Modificar o input numérico ou clicar nos botões Up/Down para alterar a ordenação de um vinho. Dar refresh na página e garantir que a nova ordem persiste. |
| Upload de Imagem | ADMIN-06 | Integração com Storage do Supabase | Cadastrar um vinho anexando uma imagem. Após cadastrado, verificar se o arquivo correspondente foi gerado com um nome UUID no bucket `wine-images` do Supabase. |
| Exclusão com Confirmação | ADMIN-05 | Ação destrutiva com aviso do navegador | Clicar em excluir e confirmar que a janela de confirmação exibe a mensagem exata do copywriting contract. Clicar em "Cancelar" e depois "OK" para testar ambos os fluxos. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
