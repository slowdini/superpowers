# Pre-registration — B1 ablation pilot (attribution of durable verification)

Written **before** any dispatch, 2026-07-28. Frozen on commit. **Not yet dispatched** —
the run happens only after the operator confirms a pre-flight summary (cases, mode,
models, cost, guard).

## What this run is

The first **ablation run** under the behavior-decomposition process (see
`slow-powers:evaluating-skills`, *Pricing a behavior — ablation runs*, and this suite's
`../COVERAGE.md`). It tests one claim directly:

> The promoted baseline's confirmed effect — the agent leaves durable verification
> behind (30/30 vs 14/30 pooled, p = 1.9e-06) — is **attributable to behavior B1's
> explicit text**, not to the skill's diffuse verification ethos.

Mechanically a Mode B (revision) run with the expectation inverted: `old_skill` = the
full `investigating-bugs` SKILL.md, `new_skill` = the same skill with **B1's entire
functional unit deleted**. We are hoping the ablated arm gets *worse*. Either outcome is
informative; neither outcome changes the promoted baseline.

## The ablated variant — exact scope, frozen

B1 (*leave durable verification behind*) is a functional unit, not a lexical section.
The ablation deletes every expression of it, and only it — the neighboring behavior
B-verify (*run the verification before claiming fixed*, Phase 4.3) must survive, so one
sentence is rewritten rather than deleted to remove its dangling reference to the new
test. Exact diff against `SKILL.md` (unchanged since commit `67dcfdc`):

```diff
@@ REQUIRED BACKGROUND (B1: test-first bug capture) — delete the whole line
-> **REQUIRED BACKGROUND:** You must understand `slow-powers:test-driven-development` — Phase 4 captures the bug with a failing test before fixing it.
@@ Phase 4 — delete step 1, renumber; rewrite step 3's B1 reference
-1. **Write a Failing Test Case:** Create an automated test or simple script that consistently triggers the bug. Verify it fails.
-2. **Implement the Fix:** Make a single, targeted change that directly addresses the root cause. Do not bundle unrelated refactoring.
-3. **Verify the Fix:** Run the test suite. Ensure the new test passes and no regressions are introduced.
-4. **The Three-Fix Limit (Architectural Check):**
+1. **Implement the Fix:** Make a single, targeted change that directly addresses the root cause. Do not bundle unrelated refactoring.
+2. **Verify the Fix:** Run the test suite. Ensure the reported symptom is gone and no regressions are introduced.
+3. **The Three-Fix Limit (Architectural Check):**
@@ Red Flags — delete the B1 bullet
-- Claiming a bug is fixed without running the verification test suite
```

Scoping notes, decided now so they cannot drift under the result:

- The Phase 4.3 rewrite ("the new test passes" → "the reported symptom is gone") is the
  minimal edit that keeps B-verify intact without a dangling reference. It introduces no
  new instruction.
- The deleted red-flag bullet is shared between B1 and B-verify; B-verify retains its
  Phase 4.3 step, so deleting the bullet removes only redundancy for B-verify while
  removing B1's last restatement. Deliberate redundancy is why the whole unit must go
  together — a surviving restatement compensates.
- Nothing else changes. The Iron Law, all of Phases 1–3, and every other table row stay
  verbatim.

## Declared parameters — no defaults, no inference

- **Mode:** revision (Mode B). `old_skill` = full SKILL.md; `new_skill` = ablated
  variant above.
- **Case:** `--only pagination-drops-last-page-cold`. Primary endpoint
  `left_a_regression_test`; control `fix_is_correct`.
- **n = 10 per condition** (20 agent dispatches). Discovery-sized: the effect being
  probed cleared p = 0.0325 at this n in the discovery run.
- **Agent model:** `claude-sonnet-5`, passed explicitly via `--agent-model`.
  **Judge model:** `claude-sonnet-5`, via `--judge-model`. The model id recorded in a
  smoke dispatch's events file must read `claude-sonnet-5` before the fleet goes out.
- **Harness descriptor:** `harness/claude-code-utc.toml` passed to **every** command.
- **Sandbox:** guard armed, allowlist unchanged from the replication run.
- **Fixture frozen** (unchanged since `67dcfdc`). Not touched, whatever the outcome.

## Prediction

Under the attribution hypothesis, the ablated arm loses what `without_skill` lacked —
the pooled baseline rates are full-skill 30/30 (1.00) and no-skill 14/30 (0.47):

> `old_skill` (full) ≥ 0.85; `new_skill` (ablated) ≤ 0.65; Δ(full − ablated) ≥ +0.25;
> Fisher exact two-sided p < 0.05.

Control, expected to ceil: `fix_is_correct` at or near 1.00 in both arms. If it fails
in either arm, the run is compromised and the primary must not be read.

## Decision rule — one run, accepted either way

Validity gate first: skill invocation 1.0 in **both** arms (both arms carry a skill);
`live_source_reads` 0; guard denials symmetric and none shown at transcript level to
have caused a primary failure.

- **Prediction holds → attribution confirmed.** B1's text is what buys the effect.
  Record in `../COVERAGE.md` (B1 status gains "ablation-confirmed"); the coverage
  process gets its first validated case→behavior link.
- **Prediction fails (ablated arm holds ≥ 0.85, or Δ < +0.25, or p ≥ 0.05) → the
  effect is not attributable to B1's explicit text at this n.** Record it as *diffuse*:
  the skill's remaining text (Iron Law framing, investigation ethos) carries the
  behavior. Revise `../COVERAGE.md`'s B1 attribution note accordingly. Do **not**
  widen the deletion to chase a collapse, do **not** raise n and retry, do **not**
  touch the fixture or the live skill.
- An intermediate result is a **failed prediction** under this rule, not a partial
  success to be argued upward.

## What may not be claimed from this run

- Anything about the skill's overall value — the promoted baseline already carries
  that, and this run cannot strengthen or weaken it.
- Any change to the live `SKILL.md`. A confirmed attribution does not license trimming
  other behaviors ("the rest didn't matter" is exactly the sub-additivity error);
  a diffuse result does not license adding text.
- Anything about other tiers or harnesses. `claude-sonnet-5` only.

---

## OUTCOME RECORD — 2026-07-28 (appended after the run; the text above is frozen)

**Prediction HELD on every threshold. Attribution CONFIRMED.**

| | full (`old_skill`) | ablated (`new_skill`) | rule | met |
|---|:--:|:--:|:--:|:--:|
| `left_a_regression_test` (primary) | **10/10** | **5/10** | full ≥ 0.85, ablated ≤ 0.65 | ✓ |
| Δ (full − ablated) | **+0.50** | | ≥ +0.25 | ✓ |
| Fisher exact two-sided | **p = 0.0325** | | < 0.05 | ✓ |
| `fix_is_correct` (control) | 10/10 | 10/10 | ~1.00 both arms | ✓ |

The ablated arm landed exactly on the discovery run's `without_skill` rate (5/10) —
deleting B1's three lexical expressions reverted the measured behavior to the no-skill
baseline while the skill was still loaded and invoked (invocation 10/10 in both arms).

**Validity (gate passed):** invocation 1.0/1.0; `live_source_reads` 0; model id
`claude-sonnet-5` verified in a pre-fleet smoke dispatch and across all 20 event files.
Guard denials 7 (full) vs 15 (ablated) — not symmetric in count, but checked causally
per the rule: failing runs 1 and 3 had zero denials; runs 5 and 10 were each the
`/dev/null` redirect false positive (eval-magic#179); run 2's was a `/tmp/repro.ts`
scratch block after which the agent wrote the repro in-env, ran it, and deleted it by
choice. No denial caused a primary failure. One stray-write violation (`/tmp/repro.ts`,
ablated run 8) was in a *passing* run and outside grading scope.

**Failure texture (n=5, observation not claim):** ablated failures split 1
wrote-in-env-then-`rm`'d / 4 never-wrote-a-file (all 4 verified via 3–5 inline
`bun`/`node` executions instead). The final diffs of the five failures are all
1 file / ±1 line; all ten full-skill diffs are 2 files / ~20 lines.

**Cost texture (observation not claim):** full arm 508k ± 54k tokens; ablated arm
849k ± 359k, with its five *passing* runs occupying the top five token counts
(881k–1.48M). With B1's text present, durable verification was reliable and cheap;
without it, it was a coin flip that cost 2–3× when it happened.

**Disposition per the decision rule:** recorded in `../COVERAGE.md` (B1 →
ablation-confirmed). Baseline untouched. Fixture untouched. Live SKILL.md untouched —
this result does not license trimming anything else (sub-additivity), and the working
tree ablation was reverted after workspace staging (verified: tree clean, staged arms
differed by exactly the frozen diff).
