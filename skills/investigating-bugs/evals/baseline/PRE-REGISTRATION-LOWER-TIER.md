# Pre-registration — investigating-bugs Mode A on Codex Luna

Audience: the operator responsible for the next investigating-bugs eval run.

Prepared on 2026-08-13 **before dispatch**. This document prepares a future run;
no agent or judge tasks were dispatched in the session that created it. Predictions,
analysis boundaries, and decision rules must remain frozen once outputs are read. Any
pre-dispatch change is recorded as a dated amendment; any post-dispatch change is a
deviation.

## Why this run exists

The existing four-case suite largely ceiled on `claude-sonnet-5`: durable
verification (B1) showed and replicated a large effect, environment-sensitive
reproduction (B2) and source-fix pressure (B3) ceiled, and flaky-state isolation
(B4) was directionally positive but not significant. An earlier Haiku 4.5 pilot
showed candidate movement on B2 and B4, but the intended n=10 Haiku run silently
used Sonnet because the agent model flag was omitted.

This run asks whether a lower-tier agent restores diagnostic headroom. It changes
both model family and harness for the practical reason that the next campaign must
run through Codex. Therefore:

- The `with_skill` versus `without_skill` comparison remains internally controlled:
  both arms use the same Luna model, Codex harness, cases, settings, and judge.
- Comparison with the Claude runs is confounded by model family and harness. Those
  runs provide historical context, not a control or direct replication target.
- Any finding is scoped to `gpt-5.6-luna` on the Codex harness. Transfer to Terra,
  Sol, Claude, or another harness remains prospective until measured there.

The cases, fixtures, assertions, and coverage map remain frozen at the branch base,
commit `6aed21a`. Do not edit them in response to this run.

## Declared population and cost

- **Mode:** Mode A (`new-skill`), `with_skill` versus `without_skill`.
- **Harness:** built-in `codex`, layered with
  `evals/harness/codex-utc.toml` on every command.
- **Agent under test:** `gpt-5.6-luna`, passed explicitly with `--agent-model`.
- **Judge:** `gpt-5.6-terra`, passed explicitly with `--judge-model` and calibrated
  against human review during the smoke gate.
- **Flagship policy:** do not use `gpt-5.6-sol` automatically. A human must request
  it before dispatch, and the change must be recorded as a pre-dispatch amendment.
  Never switch judges after reading results.
- **Cases:** all four cases in `evals.json`, `n = 10` per condition: 80 agent
  dispatches, 120 substantive `llm_judge` dispatches, and 40 Codex
  skill-invocation fallback judges (160 judge dispatches total).
- **Reasoning and other harness settings:** pass no reasoning override; use the
  model's Codex default. The descriptor disables live plugins and ambient memories
  for agent dispatches in both arms. Record the Codex CLI version and non-secret
  settings in the run notes, and do not vary them between arms.
- **Sandbox:** staged skills with the built-in Codex write guard. Do not use
  `--no-stage` or `--no-guard`.

OpenAI's [model guidance](https://developers.openai.com/api/docs/guides/latest-model)
describes Luna as the efficient tier, Terra as the balance of intelligence and cost,
and Sol as the frontier tier.

## Predictions and analysis

This is an exploratory new-population run, not a confirmatory continuation of the
Claude campaign.

1. **B1 robustness:** `left_a_regression_test` remains positive, with
   `with_skill >= 0.80`, `without_skill <= 0.60`, and delta at least +0.30.
   Fisher's exact two-sided p-value is reported, but the result is a cross-population
   robustness observation rather than a replication of the Sonnet result.
2. **Recovered headroom:** at least one candidate diagnostic for B2–B4 has delta at
   least +0.30: `did_not_trust_green_repro`,
   `replaced_nudge_with_source_fix`, or `fix_isolates_shared_state`.
   Each assertion is reported separately with counts and Fisher's exact two-sided
   p-value. Because three diagnostics are inspected and no multiplicity adjustment
   is planned, a mover is exploratory evidence and cannot be advertised as confirmed.
3. **Controls remain healthy:** `fix_is_correct` is at or near 1.0 in both arms.
   The timezone held-out matrix must remain solvable in at least one arm; a floor in
   both arms triggers task/harness review before behavioral interpretation.
4. **No aggregate headline:** aggregate pass rate, tokens, and wall clock are
   secondary descriptive outputs. Do not revive the old efficiency claim or average
   ceiled controls into a headline skill-effect number.

Report every assertion, including ceilings and floors. Do not drop cases, pool Luna
with historical Claude data, or select only favorable endpoints.

## Pre-flight and smoke gate

A fresh session must present the exact mode, four cases, models, 80-agent plus
160-judge cost, UTC descriptor, and armed-guard status, then receive explicit human
confirmation before running `eval-magic run`. The earlier approval to prepare this
document is not dispatch approval.

Use this run command after that confirmation:

```bash
eval-magic run \
  --harness-file skills/investigating-bugs/evals/harness/codex-utc.toml \
  --harness codex \
  --skill-dir ./skills \
  --skill investigating-bugs \
  --bootstrap ./bootstrap.md \
  --mode new-skill \
  --runs 10 \
  --agent-model gpt-5.6-luna \
  --judge-model gpt-5.6-terra \
  --label codex-luna-mode-a \
  --guard
```

`eval-magic run` performs the Codex installed-skill shadow preflight while building
the workspace; there is no separate preflight command. Stop before agent dispatch if
it reports unresolved contamination. Inspect `plugin-shadow.json` even when the
descriptor resolves known plugin findings: every live subject source must be a plugin
covered by `--disable plugins`.

Before the fleet:

1. Confirm `conditions.json` records `gpt-5.6-luna`, `gpt-5.6-terra`, `TZ=UTC`,
   the Codex harness, and the guard.
2. Confirm the generated smoke command in `dispatch.json` contains the explicit
   native `-m gpt-5.6-luna`, `--disable plugins`, and `--disable memories`
   arguments; never infer the model or isolation settings from the operator's
   session default.
3. Dispatch one task only. Require a successful Codex events file and final message,
   verify the agent can run `bun` inside the task environment, and verify an
   out-of-environment write is blocked.
4. Hand-grade every assertion on that output, compare Terra's verdicts, and correct
   a broken grader before scaling. Do not tune a valid case to the observed answer.

Abort the fleet if the explicit model is missing, the shadow preflight is unresolved,
a live subject source falls outside plugin isolation, the guard is not effective, the
agent cannot execute fixture commands, the UTC environment is absent, or Terra
disagrees materially with human grading.

## Validity and decision rules

Before interpreting any delta, require:

- skill invocation 1.0 in `with_skill`;
- no missing gradings or live-source reads;
- every guard denial reviewed for causal asymmetry between arms;
- command-check stderr reviewed for fixture or module-shape false negatives; and
- human review notes for each run, with Terra disagreements reported rather than
  silently overwritten.

If B1 meets its prediction, record it as robustness on the Luna/Codex population. If
a B2–B4 diagnostic moves, record it as a candidate for a dedicated confirmatory run;
do not promote it from this multi-endpoint exploratory suite. If all B2–B4 diagnostics
ceil, report that Luna also lacks headroom and retain the cases. If both arms floor,
audit harness execution and task solvability before concluding the skill has no value.

## Optional Terra robustness suite

A Terra-backed suite is a separate, human-requested run, not an automatic continuation.
Use the same frozen cases, `n = 10`, Codex harness, UTC descriptor, settings, and
`gpt-5.6-terra` judge, changing only the agent-under-test to `gpt-5.6-terra`.
Keeping the GPT-5.6 family and Codex harness fixed makes Luna-to-Terra tier comparison
more interpretable, but the results remain tier-stratified and must not be pooled.
If the problem is imprecision in Luna's own estimate, increase pre-registered Luna
repetitions instead; substituting Terra does not add Luna sample size. Sol still
requires an explicit human request and a pre-dispatch amendment.
