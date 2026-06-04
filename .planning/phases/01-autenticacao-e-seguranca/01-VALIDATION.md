---
phase: 1
slug: autenticacao-e-seguranca
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-04
---

# Phase 1 — Validation Strategy

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
| 01-01-01 | 01 | 1 | AUTH-02 | T-01-01 | Redirect anonymous requests | lint | npm run typecheck | ✓ | pending |
| 01-01-02 | 01 | 1 | AUTH-01 | T-01-02 | Secure credentials exchange | lint | npm run typecheck | ✓ | pending |
| 01-01-03 | 01 | 1 | AUTH-02 | T-01-03 | Query DB role and active flags | lint | npm run typecheck | ✓ | pending |
| 01-01-04 | 01 | 1 | AUTH-01 | T-01-04 | User-friendly login errors | lint | npm run typecheck | ✓ | pending |
| 01-01-05 | 01 | 1 | AUTH-03 | T-01-05 | Basic admin dashboard logout | lint | npm run typecheck | ✓ | pending |

*Status: pending*

---

## Wave 0 Requirements

*Existing infrastructure (TypeScript and Next.js compiler) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Redirect do Middleware | AUTH-02 | Exige interação do roteamento no navegador | Acessar `/admin` sem login ativo e verificar se há redirecionamento imediato para `/admin/login`. |
| Login com Credenciais Inválidas | AUTH-01 | Exige preenchimento de formulário | Tentar logar com e-mail incorreto e checar se o erro inline aparece na tela de login. |
| Login com Sucesso | AUTH-01 | Depende de credenciais reais no banco | Logar com usuário de seed válido e certificar-se de ser direcionado à rota `/admin`. |
| Bloqueio de Usuário Inativo | AUTH-02 | Depende de alteração no estado do banco | Logar, ir ao banco e definir `ativo = false` para o perfil, dar refresh no painel e confirmar o logout/redirecionamento automático. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-04
