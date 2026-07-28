# Coverage map — investigating-bugs

The behavior-level decomposition of `SKILL.md`, per *Decompose the skill into behaviors
first* in `slow-powers:evaluating-skills`. One entry per **functional unit** — a discrete
behavior the skill is supposed to change, together with **every lexical expression** of it
in the skill text (steps, rationalization-table rows, red-flag bullets that restate it).
An ablation of a behavior deletes all of its expressions together.

Expressions are cited by anchor (phase/step numbers, quoted row text), not line numbers —
the text drifts, the anchors don't. Statuses come from the promoted baseline
(`baseline/NOTES.md`, Sonnet 5, 2026-07-28); every number here is traceable to that file.
All verdicts are **tier-scoped**: "ceiled" means base Sonnet 5 already does it, not that
the behavior is dead on weaker models or other harnesses.

## Covered behaviors

### B1. Leave durable verification behind — **CONFIRMED, carries the baseline**

Fix the bug *and* leave an artifact (test or failing-on-regression script) that would catch
it coming back — don't verify in passing and discard the evidence.

- Expressions: Phase 4.1 ("Write a Failing Test Case … Verify it fails"); Phase 4.3's "Ensure
  the new test passes" (references the artifact); the REQUIRED BACKGROUND line (TDD "Phase 4
  captures the bug with a failing test before fixing it"); red flag "Claiming a bug is fixed
  without running the verification test suite" (shared with B-verify below).
- Case: `pagination-drops-last-page-cold`, assertion `left_a_regression_test`
  (mutation-graded, no LLM judge).
- Status: **+55pp** (20/20 vs 9/20, p = 0.000145; pooled 30/30 vs 14/30, p = 1.9e-06).
  Cost +58% tokens / +43% wall clock. The dominant unskilled failure is *writing* the
  verification, running it, then **deleting it** (7 of 11 failures) — the behavior is
  durability, not diligence.

### B2. Reproduce environment-dependent bugs by varying the context — **CEILED (Sonnet 5)**

A green run in the default environment doesn't clear a bug that only manifests elsewhere
(timezone, locale, scale); vary the environment until the failure reproduces on demand.

- Expressions: Phase 1.2 ("Reproduce Consistently … identify the exact steps, inputs, or
  environment"; "gather more logs instead of guessing"); red flag "Writing a fix before
  reproducing the bug or reading the full stack trace" (shared with B5).
- Case: `timezone-date-only-shift-cold` (`reproduced_by_varying_tz`,
  `did_not_trust_green_repro`, plus the held-out TZ matrix).
- Status: 10/10 vs 9–10/10 across assertions; the discriminator
  `did_not_trust_green_repro` ceiled outright at 10/10 both arms.

### B3. Fix at the source under ship pressure; refuse the locally-green symptom patch — **CEILED (Sonnet 5)**

- Expressions: the Iron Law banner ("NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST");
  Phase 1.5 ("Fix the bug at the source, not the symptom"); rationalization rows "This is an
  emergency, we don't have time", "I can see the symptom fix is obvious", "We need to ship
  now, investigate later", "The senior engineer says this is the fix" (authority — the seeded
  case's finance sign-off exercises exactly this row).
- Case: `timezone-nudge-ship-pressure-seeded` (`refused_to_ship_the_nudge`,
  `replaced_nudge_with_source_fix`, plus the held-out TZ matrix).
- Status: all four assertions 10/10 in **both** arms.

### B4. Find the non-determinism in a flaky test before changing anything — **NOT SIGNIFICANT (Sonnet 5)**

Don't rerun until green, don't add retries; make the failure deterministic by varying
execution context, then isolate the shared state.

- Expressions: the Phase 1.2 flaky bullet (condition-based waiting, non-deterministic
  dependency ordering) and its two references, `references/diagnosing-flaky-tests.md` and
  `references/condition-based-waiting.md`.
- Case: `flaky-cross-test-pollution-seeded` (`reproduced_by_varying_context`,
  `fix_isolates_shared_state`).
- Status: 10/10 vs 8/10, p = 0.47. Suggestive direction, no evidence at this n; the case
  stays as a diagnostic.

## Uncovered contingent behaviors — coverage gaps

Each of these is contingent (an agent under pressure plausibly skips it), has no case that
would detect its removal, and is a candidate for a future case:

- **B5. Read the full error and stack trace first** — Phase 1.1; shares the "writing a fix
  before … reading the full stack trace" red flag with B2.
- **B6. Check recent changes** — Phase 1.3 (git diff, recent commits, dependency/config
  changes).
- **B7. Instrument component boundaries / capture-stack tracing** — Phase 1.4 and the
  Phase 1.5 instrumentation sub-bullet (log inputs at boundaries, `new Error().stack`
  before the suspect operation, stderr in tests).
- **B8. Compare against working examples** — Phase 2 entire (find working examples, diff
  implementations, "don't assume that difference doesn't matter", verify deps/configs).
- **B9. Single hypothesis, minimal test, revert on disproof** — Phase 3 entire; red flags
  "Let's just try changing X to see if it works" and "Stacking multiple speculative fixes";
  rationalization row "This case is different because…".
- **B10. Three-fix limit — stop and reassess architecture** — Phase 4.4; rationalization
  row "We tried three things, just add one more"; red flag "Each 'fix' only shifts the bug
  to a new location".
- **B11. Targeted fix, no bundled refactoring** — Phase 4.2.
- **B-verify. Run the verification before claiming fixed** — Phase 4.3; red flag "Claiming
  a bug is fixed without running the verification test suite" (shared with B1). Distinct
  from B1: B1 is *leaving the artifact behind*, B-verify is *running it at all*. The
  baseline shows unskilled Sonnet 5 mostly does B-verify (7 of 11 failures verified, then
  deleted) — so B-verify is likely ceiled on this tier, but that has not been measured in
  isolation.

## Structural / shared content — not separately testable

- The frontmatter description (trigger) — measured by the runner's invocation meta-check,
  not by a case.
- The REQUIRED PREREQUISITE link to `slow-powers:working-in-isolation` — structural
  cross-link, owned by that skill's own suite.
- "Violating the letter of the rules is violating the spirit of the rules", the
  rationalization table and red-flags list *as scaffolding* — deliberate redundancy whose
  rows attach to the behaviors above. Whether any single restatement earns its keep is a
  Mode B revision question, not an ablation unit.

## Planned attribution check

`baseline/PRE-REGISTRATION-ABLATION-PHASE-4-1.md` pre-registers the pilot ablation of B1
(full skill vs skill minus B1's functional unit, `pagination-drops-last-page-cold` only) —
the direct test that the confirmed effect is attributable to B1 rather than to the skill's
general verification ethos.
