---
phase: 5
slug: analytics-e-historico
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 5 — Validation Strategy

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
| 05-01-01 | 01 | 1 | - | - | Migração de Banco | lint | npm run typecheck | ✓ | verified |
| 05-01-02 | 01 | 1 | ANLT-01, ANLT-02 | T-05-01 | Validação de Ações no Servidor | lint | npm run typecheck | ✓ | verified |
| 05-01-03 | 01 | 1 | ANLT-02 | T-05-02 | Rastreamento seguro de clicks | lint | npm run typecheck | ✓ | verified |
| 05-01-04 | 01 | 1 | ANLT-01, ANLT-02 | T-05-03 | Gravação de histórico autenticado | lint | npm run typecheck | ✓ | verified |
| 05-01-05 | 01 | 1 | ANLT-01, ANLT-02 | T-05-04 | Painel de visualização admin | lint | npm run typecheck | ✓ | verified |

*Status: verified*

---

## Wave 0 Requirements

*Existing infrastructure (TypeScript and Next.js compiler) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Registro de cliques | ANLT-02 | Acionamento assíncrono no cliente | Abrir página de um vinho, verificar se é inserida linha com `'click'` na tabela `wine_analytics` do Supabase. |
| Persistência de Histórico | ANLT-01 | Sessão ativa e inputs no modal | Logar no admin, ir ao catálogo, preencher dados comerciais no modal do PDF e baixar. Checar se o catálogo gerado é listado no painel `/admin` associado ao nome do representante. |
| Dashboard Stats | ANLT-02 | Verificação visual | Abrir o dashboard `/admin` e confirmar o layout do ranking de vinhos mais populares e do histórico. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
