# Notes — forward-looking observations

Author-maintained companion to the baseline. Not provenance (see `BASELINE.md`)
and not results (see `benchmark.json`). These are observations for whoever
iterates next.

> **Naming note:** This run predates the `test-driven-development` →
> `working-with-tdd` rename. Historical workspace paths below remain verbatim, and
> this baseline does not measure whether the new name changes skill discovery.

## This baseline — iteration-2 (Mode B revision; #234/#236 validation)

Promoted from the **iteration-2** tightening run: a Mode B (revision) measurement of
#234 (Anti-Pattern 6 / order-dependent mocks) and #236 (testing-anti-patterns
refocus). Old arm = `95431b5` (pre-both-PRs), new arm = current content. Sonnet 4.6
agent + judge, full 6-case suite, clean validity (100% skill-invocation per arm, 0
stray writes / live-source reads, 0 validity warnings).

**Headline: revision +0.167** (old 0.833 / new 1.0, n=12, new stddev 0). The entire
gap is `seeded-order-dependent-mock-momentum` (old 0.333/cell → new 1.0/cell, stable
across all 3 runs) — #234's Anti-Pattern 6 earning its keep. The two #236-scope
tautology cases (`testing-mock-behavior-tautology`, `helper-tautology-formatmoney`)
ceiled at 1.0/1.0 (no-regression; base Sonnet already avoids the tautology) — a
measurement ceiling on a capable base model, not a content failure.

**Per-case gradings intentionally omitted (tooling gap).** `benchmark.json` is the
complete aggregate (it reads every one of the 12 cells). The per-case `grading/*.json`
files are NOT committed: `eval-magic promote-baseline` 0.3.0 silently drops gradings
for cases with `runs > 1` (it doesn't walk the nested `run-<k>/grading.json` layout),
so promoting would commit an inconsistent 3-of-6 record missing the headline case.
Tracked as **slowdini/eval-magic#70**. Full per-cell gradings live in the (gitignored)
workspace `skills-workspace/test-driven-development/iteration-2/`; re-promote with
gradings once the tool handles `runs > 1`.

---

_The sections below are carried over from the prior baseline (the bootstrap
capability→gate-wrapping A/B). They predate the eval-runner → `eval-magic` rename and
some specifics are stale, but the forward-looking ideas remain relevant._

## The `seeded-mid-implementation-momentum` case and what it can't yet measure

`seeded-mid-implementation-momentum` was added (per the CLAUDE.md directive that
TDD carry a seeded case) and was also used as the measurement vehicle for the
**bootstrap capability→gate-wrapping reframe** (issue: reframe bootstrap from
capability-invocation toward gate-wrapping). That reframe was measured with a
two-bootstrap A/B: the *same* seeded scenario run under the OLD bootstrap
(capability framing + "Active Skills Directory" enumeration) vs the NEW bootstrap
(gate-wrapping, no enumeration), via the runner's `--bootstrap` flag, `new-skill`
mode, N=3 replicas, Sonnet 4.6 agent + judge.

**Result: null delta.** Invocation rate was **100% (3/3) under BOTH bootstraps**;
tests-first substantive pass rate was identical (~0.83) in both. No
`validity_warnings`.

A null delta here is **not** evidence the reframe failed (the eval-seeding issue
says so explicitly). It is two stacked measurement ceilings:

1. **The runner over-promotes invocation.** `buildDispatchTask` in
   `@slowdini/eval-runner`'s `src/run.ts` puts a *constant* instruction in the
   `with_skill` arm: *"the skill … is staged under the unique slug … — invoke that
   slug … if the skill applies."* That hint is identical across both `--bootstrap`
   variants, so it cancels in the delta but pins the invocation floor near 100%.
   For a broad-trigger skill like TDD ("any feature implementation"), the agent
   invokes regardless of bootstrap framing — the framing never gets to be the
   deciding factor.
2. **A text seed can't inject the real suppression.** The wild failure this
   reframe targets happens mid-session under an *active harness workflow* (e.g.
   plan mode) where loading a skill reads as redundant ceremony. A prompt-string
   seed can *describe* that state but not place the agent *in* it — the documented
   ceiling in `slow-powers:evaluating-skills` ("Seeding conversation context (and
   its ceiling)"). The seed's "no need for tests" pressure was not enough to drop
   OLD-bootstrap invocation below 100%, so there was no gap for the new framing to
   close.

So the acceptance criterion ("positive invocation-rate delta on seeded evals where
a skill should fire but currently doesn't") could not be *exhibited*: the
"currently doesn't fire" precondition never reproduced in-harness.

## Ideas for a future run that could surface a real, failing-then-passing delta

Roughly in increasing order of effort / payoff:

1. **Harder adversarial seed.** Mirror `hardening-plans/evals/`'s adversarial
   case: seed an `Assistant:` turn that *explicitly rationalizes not loading the
   skill* ("I'm already mid-implementation, a TDD skill would just duplicate what
   I'm doing"). May still lose to the runner's slug-invoke hint, but worth a cheap
   try.
2. **Runner option: stage-for-discovery-without-instructing-invocation.** Add a
   flag so the skill is discoverable (so the code-based `__skill_invoked`
   meta-check still works) but the dispatch does **not** tell the agent to invoke
   the staged slug. Then whether the agent invokes becomes a genuine choice the
   bootstrap framing can influence — the single change most likely to make this
   class of eval measurable. This is the high-value framework improvement.
3. **Real harness-mode injection.** Reproduce the plan-mode suppression by running
   the eval subagent *inside* a real plan mode rather than a described one. Tracked
   as a parity goal in the `@slowdini/eval-runner` docs (`docs/harness-parity.md`); the biggest lift.

## Bigger-picture testing strategy (from the maintainer)

For hard-to-test framing changes like this, a zero delta is an acceptable baseline
for now. The durable path to *testable* pressure scenarios is **live-session
audits** (`slow-powers:auditing-slow-powers-usage`): once we reach consistent live
skill compliance, the real-world failures we still see become the focused,
reproducible scenarios these evals currently can't manufacture cold. Until then,
don't expect the harness to manufacture the suppression on its own.

See also the project memory note `bootstrap-ab-invocation-ceiling`.
