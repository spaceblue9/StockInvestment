# Think2 Beta Release Runbook

Last updated: 2026-07-06 08:04:32 +07:00

## Purpose

Think2 Beta is a controlled release of the new safety-first decision layer. It adds beginner-friendly warnings, score matrix fields, technical/fundamental RRR separation, Action Matrix v2 shadow output, comparison reporting, and a feature flag for future rollout.

This beta must not silently replace the legacy `Target_Action`.

## Current Release Status

- Branch: `codex/think2-safety-layer-planning`
- Stable rollback tag: `think-md-v1.0.0`
- Stable rollback commit: `b8a6cb5`
- Default decision mode: `shadow`
- Default effective action source: `legacy`
- Think2 live decision engine: disabled by default

## Feature Flag

Use `THINK2_DECISION_ENGINE` to control rollout.

| Value | Meaning | Production use |
| --- | --- | --- |
| `off` | Hide/disable Think2 effective decision replacement and keep legacy action | Safe rollback mode |
| `shadow` | Show Think2 shadow fields, but keep legacy action as effective action | Default beta mode |
| `enabled` | Use `Action_v2_Shadow` as `Effective_Target_Action` | Owner-approved beta only |

Important behavior:

- `Target_Action` is never mutated by the flag.
- `Effective_Target_Action` is the action selected by the flag.
- In `off` and `shadow`, `Effective_Target_Action` equals legacy `Target_Action`.
- In `enabled`, `Effective_Target_Action` comes from `Action_v2_Shadow`.

## What Beta Includes

- `Data_Status` and `Data_Warnings`
- `Conflict_Severity` and `Conflict_Alerts`
- `Quality_Score`, `Valuation_Score`, `Setup_Score`, `Balance_Risk_Score`, `Liquidity_Score`
- `Composite_Score_v2`
- `Technical_RRR`
- `Fundamental_RRR_Status` and related placeholder fields
- `Action_v2_Shadow`, `Action_v2_Confidence`, `Action_v2_Risk_Block`, `Action_v2_Change`, `Action_v2_Rationale`
- `Decision_Engine_Mode`, `Effective_Target_Action`, `Effective_Action_Source`
- CLI reports:
  - `npm run fundamental:readiness -- --format text`
  - `npm run action:compare -- --format text`

## Latest Comparison Snapshot

Source: `data/outputs/portfolio_regression_compare_analysis_report.xlsx`

- Rows: 5 holdings
- Changed action family: 2 rows (40.00%)
- Risk blocked: 0
- RED blocked legacy buy: 0
- DATA_ERROR blocked: 0
- Changed samples:
  - `SISB`: `Buy Now (Good RRR)` -> `REVIEW_BALANCE_RISK_SHADOW`
  - `MTC`: `Buy Now (Good RRR)` -> `REVIEW_BALANCE_RISK_SHADOW`

Decision: keep Think2 in `shadow` mode until owner review accepts changed action behavior.

## Release Gate

Run these commands before any beta deployment:

```powershell
npm run test:decision-engine-flag
npm run test:think2-data-validation
npm run test:action-matrix-comparison
npm run test:frontend-viewport
npm run test:web-smoke
npm run test:analysis-portfolio-flow
npm run compare:python
npm run check
```

Optional full gate:

```powershell
npm run test-regression
```

## Beta Enablement Steps

1. Deploy with the default config first.
2. Confirm `/api/health` shows:
   - `decisionEngine.mode = "shadow"`
   - `decisionEngine.think2DecisionEnabled = false`
3. Run portfolio analysis and review:
   - `Target_Action`
   - `Action_v2_Shadow`
   - `Action_v2_Change`
   - `Effective_Target_Action`
4. Run:

```powershell
npm run action:compare -- --format text
```

5. Keep `THINK2_DECISION_ENGINE=shadow` unless owner signs off on changed action behavior.
6. For a limited beta only, set:

```powershell
THINK2_DECISION_ENGINE=enabled
```

7. After enabling, confirm `/api/health` shows `think2DecisionEnabled = true`.

## Rollback

Fast rollback without code change:

```powershell
THINK2_DECISION_ENGINE=off
```

or:

```powershell
THINK2_DECISION_ENGINE=shadow
```

Code rollback baseline:

```powershell
git checkout think-md-v1.0.0
```

Do not use `git reset --hard` unless the owner explicitly approves and private/runtime files have been checked.

## Not Ready For Full Production

Do not enable Think2 as the default production engine until:

- Fundamental data source is available for fair value, normalized EPS, growth, payout, and analyst target.
- `npm run fundamental:readiness -- --format text` no longer reports all key fields missing.
- Action comparison report is reviewed on real customer portfolios.
- RED/DATA_ERROR blocked cases are understood.
- Owner/admin sign-off is recorded.
- A fresh rollback tag exists after committing the beta branch.

## AI Handoff Prompt

Read `plan.md`, `Task.md`, `think.md`, `Think2.md`, and this file before continuing. Think2 Beta is safe by default because `Target_Action` remains legacy and `Effective_Target_Action` only uses Think2 when `THINK2_DECISION_ENGINE=enabled`. Before enabling Think2, run the release gate, generate `npm run action:compare -- --format text`, review changed action samples with the owner, and keep rollback to `THINK2_DECISION_ENGINE=off` or tag `think-md-v1.0.0` ready.
