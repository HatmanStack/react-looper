# Audit Remediation Plan: react-looper

## Overview

This plan addresses findings from three concurrent audits of the react-looper codebase: a tech debt health audit (24 findings across critical/high/medium/low), a 12-pillar evaluation (0 of 12 pillars at target score of 9), and a documentation drift audit (5 drift, 5 gaps, 3 config drift, 3 structure issues).

The remediation is sequenced in four stages: (1) subtractive cleanup to remove dead code and unused dependencies, (2) code fixes for critical bugs, architecture improvements, test quality, and performance, (3) additive guardrails for CI, linting, and type safety, and (4) documentation corrections and prevention tooling. This ordering ensures that structural cleanup happens before new code is added, preventing wasted effort on code that will be removed.

The plan targets the most impactful improvements while respecting YAGNI -- high-complexity items like LoopEngine integration and state persistence are scoped but deferred from this remediation cycle to keep phases focused and deliverable.

## Prerequisites

- Node.js 24+ (matches CI)
- `npm ci` from repo root (npm workspaces)
- All existing checks pass: `npm run check` (lint + typecheck + tests)

## Phase Summary

| Phase | Tag | Goal | Est. Tokens |
|-------|-----|------|-------------|
| 0 | -- | Foundation: conventions, patterns, testing strategy | ~5k |
| 1 | [HYGIENIST] | Dead code removal, unused deps, scaleVolume extraction, uuid cleanup, console.* migration | ~15k |
| 2 | [IMPLEMENTER] | Critical bug fixes (AudioContext leak, onerror throw, platform-safe export), shared AudioContext, fetch timeouts, mixer cancel, blob URL leak | ~25k |
| 3 | [IMPLEMENTER] | Test quality (placeholders, skips, fixtures), MainScreen hook extraction | ~25k |
| 4 | [FORTIFIER] | no-console lint rule, lamejs type declarations, ErrorBoundary theme, remaining console.* cleanup | ~15k |
| 5 | [DOC-ENGINEER] | Documentation drift fixes, .env.example, version alignment | ~15k |

## Navigation

- [Phase 0: Foundation](./Phase-0.md)
- [Phase 1: Hygienist — Cleanup](./Phase-1.md)
- [Phase 2: Implementer — Critical Fixes](./Phase-2.md)
- [Phase 3: Implementer — Test Quality & Architecture](./Phase-3.md)
- [Phase 4: Fortifier — Guardrails](./Phase-4.md)
- [Phase 5: Doc-Engineer — Documentation](./Phase-5.md)
- [Feedback](./feedback.md)

## Audit Source Documents

- [Health Audit](./health-audit.md) — 24 tech debt findings
- [12-Pillar Evaluation](./eval.md) — Scorecard and remediation targets
- [Documentation Audit](./doc-audit.md) — Drift, gaps, and config issues
