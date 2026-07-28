# Pre-registration — investigating-bugs Mode A, Haiku 4.5, n=10

Written **before** dispatch on 2026-07-28. Predictions, analysis plan, and decision
rules are fixed here so the run measures the skill rather than our willingness to
keep tuning until a number looks good. Nothing below may be revised after results
are read; a revision that happens anyway must be recorded as such, with its date.

## Why this run exists

Run B (Haiku 4.5, n=3/cell, 4 cases) produced an aggregate pass-rate delta of
**+11.9pp** (0.688 vs 0.569) that does not clear noise — stddev ≈ 0.383 in both
arms gives SE(Δ) ≈ 15.6pp, so the interval spans zero. It also produced an
efficiency delta that *does* clear noise even at n=3 (≈2.9 SE), and three
assertion-level movers whose evidence is 3 runs per cell — too thin to advertise.

This run buys three things and, importantly, does not buy a fourth:

1. Tightens the efficiency estimate from a ±28pp interval to a ±15pp one.
2. Powers two of the three assertion-level discriminators to individual significance.
3. Answers the pagination-v2 question, which is currently unmeasured.
4. **Does not** make the aggregate pass-rate delta significant. See below.

## Observed baseline (Run B, n=3/cell) — the numbers being tested

Per-assertion pass counts, `with_skill` vs `without_skill`:

| Case | Assertion | with | without | Status |
|---|---|:--:|:--:|---|
| tz-cold | `did_not_trust_green_repro` | 2/3 | 0/3 | **mover** |
| tz-cold | `reproduced_by_varying_tz` | 2/3 | 1/3 | **mover (underpowered)** |
| tz-cold | `all_consumers_correct_in_every_tz` | 1/3 | 1/3 | flat |
| tz-cold | `fixed_as_calendar_date` | 1/3 | 1/3 | flat |
| tz-seeded | `refused_to_ship_the_nudge` | 3/3 | 3/3 | ceiled |
| tz-seeded | `replaced_nudge_with_source_fix` | 0/3 | 0/3 | floored |
| tz-seeded | `all_consumers_correct_in_every_tz` | 0/3 | 0/3 | floored |
| tz-seeded | `reproduced_by_varying_tz` | 0/3 | 0/3 | floored |
| pagination | `fix_is_correct` | 3/3 | 3/3 | ceiled (control, by design) |
| pagination | `left_a_regression_test` | 3/3 | 3/3 | ceiled — **v1 fixture, since replaced** |
| flaky | `fix_isolates_shared_state` | 3/3 | 1/3 | **mover** |
| flaky | `inspected_before_patching` | 3/3 | 3/3 | ceiled |
| flaky | `reproduced_by_varying_context` | 3/3 | 3/3 | ceiled |

Efficiency: **406,059 ± 206,643** tokens and **72.0 ± 22.7 s** with the skill, vs
**691,719 ± 268,399** tokens and **105.4 ± 30.9 s** without.

## Predictions

Stated in advance. A miss is a finding, not a reason to re-tune the suite.

**P1 — pagination v2 discriminates.** `left_a_regression_test`: `with_skill` ≥ 0.8,
`without_skill` ≤ 0.5, Δ ≥ +0.3. The v1 fixture shipped `chunk.fixture.ts` and gave
the answer away; v2 ships `formatBytes` with tests and `chunk` with none, so writing
verification is now a choice rather than a fill-in-the-blank. *If this ceils again,
record the null and stop — do not build a third fixture variant.*

**P2 — `did_not_trust_green_repro` holds up.** Δ ≥ +0.4, Fisher exact p < 0.05.

**P3 — `fix_isolates_shared_state` holds up.** Δ ≥ +0.4, Fisher exact p < 0.05.

**P4 — `reproduced_by_varying_tz` moves but stays inconclusive.** Δ ≈ +0.33; at
n=10 a 7/10-vs-3/10 split gives p ≈ 0.18. **Declared underpowered in advance** — a
non-significant result here is expected and is not evidence against the skill.

**P5 — efficiency is the robust result.** Δ tokens ≈ −41% and Δ wall clock ≈ −32%,
both p < 0.001 at n=40/condition (≈5.3 and ≈5.5 SE respectively).

**P6 — aggregate pass-rate stays inconclusive.** Δ ≈ +0.10 to +0.15, roughly 1.4 SE.
**Declared underpowered in advance.** See the next section — this is the single most
important line in this document.

**P7 — the ceiled and floored assertions stay flat.** Both tz-seeded arms remain at
0/n on `all_consumers_correct_in_every_tz`; `refused_to_ship_the_nudge`,
`inspected_before_patching`, `reproduced_by_varying_context` and `fix_is_correct`
remain at or near 1.0 in both arms.

## The aggregate pass-rate cannot be rescued by this run

At n=10/case (40 runs/condition) and the observed stddev of 0.383:

- SE(Δ) = 0.383·√(2/40) = **8.6pp**. Against an observed Δ of 11.9pp that is
  **1.39 SE** — p ≈ 0.16. Not significant.
- A by-case stratified estimate (the pre-specified secondary analysis) improves SE
  to roughly **7.9pp** → 1.51 SE, p ≈ 0.13. Still not significant.
- Reaching 80% power for a true Δ of 11.9pp would need ≈160 runs per condition —
  **40 per case, 320 agent dispatches.** That is not a defensible spend for one
  README cell.

This is a property of the suite, not of the run size: two of four cases contribute
structurally zero signal on Haiku (one floored, one a ceiled control), which halves
any delta while contributing full variance. **The aggregate pass-rate is therefore
demoted to a secondary endpoint and will not be the advertised headline regardless
of which side of the line it lands on.** Promoting it after the fact because it
happened to clear would be exactly the post-hoc selection this document exists to
prevent.

## Analysis plan

- **Primary endpoints:** token delta and wall-clock delta, reported as point
  estimate with a 95% CI. Welch, unpaired.
- **Co-primary:** P2 and P3 by Fisher's exact test, two-sided, no multiplicity
  correction — both are pre-registered single hypotheses.
- **Secondary:** aggregate pass-rate delta (naive and by-case stratified), reported
  with its interval and its non-significance stated plainly.
- **Exploratory:** every other assertion. Thirteen assertions are graded, so at
  α=0.05 roughly one false positive is expected by chance; any mover not named in
  P1–P3 is reported as exploratory and is **not** advertisable on this run alone.
- **Validity gates, checked before any number is believed:** skill-invocation rate
  on `with_skill` must be 1.0; `missing_gradings` must be 0; `stray-writes.json`
  must be empty; guard denials are reviewed individually and runs with a denial that
  changed the outcome are reported, not silently kept. The `plugin-shadow.json`
  warnings are known false positives — the descriptor's `--setting-sources
  project,local` isolation was verified empirically (a probe dispatch saw the staged
  siblings and no `slow-powers:` plugin skills), and the preflight cannot see
  descriptor-level isolation (eval-magic#179, item 4).

## Decision rules

**Promote the baseline** only if all three hold:

1. Aggregate pass-rate delta is positive (direction, not significance), **and**
2. at least one of P2/P3 reaches p < 0.05, **and**
3. all validity gates above are clean.

**README headline** is the efficiency result with its confidence interval, framed as
process/cost rather than correctness. The pass-rate column reports the delta *and*
its interval, or reports honestly that it is inconclusive. If the efficiency result
is the only thing that survives, that is what gets advertised — see `README-FRAMING`
below.

**Do not promote** if the aggregate delta is negative, or if both P2 and P3 fail. In
that case the finding is that `investigating-bugs` does not measurably change outcomes
at any tier tested, and it gets written up as such.

**No case may be dropped, and no fixture revised, after results are read.** The suite
is frozen as of commit `67dcfdc`.

## README framing

The current sizzler table implies a single "improvement" number per skill, which
suits a failure-prevention skill and does not suit this one. `investigating-bugs` is
a quality-gradient skill: the unskilled arm also produces something that works, so a
binary pass-rate under-describes it. The honest column for this row is the cost of
getting there — tokens and wall clock — with the process discriminators as
supporting detail, and the table needs a shape that can carry that. Drafting the
reframe is deliberately deferred until the numbers are in, so the frame follows the
result rather than the reverse.

## DEVIATION RECORD — 2026-07-28, added after the run

**The run did not use the pre-registered agent model.** `--agent-model` was omitted
from `eval-magic run`, and the dispatch driver carried no `--model` flag, so all 80
dispatches fell through to the session default and executed on **`claude-sonnet-5`**,
not `claude-haiku-4-5-20251001`. Everything below the "Run parameters" heading was
frozen before dispatch and is unmodified; this section is appended, not edited in.

Consequences, stated plainly:

1. **This run does not fulfil this pre-registration.** The predictions P1–P7 were
   calibrated on Haiku 4.5 observations. Sonnet 5 is a different population, so a hit
   or miss here is not the confirmatory test that was planned.
2. **The pre-registered decision rule returns DO NOT PROMOTE**, on two independent
   grounds: neither co-primary reached p < 0.05 (P2 ceiled outright at 10/10 vs
   10/10; P3 gave 10/10 vs 8/10, p = 0.47), and the validity gate failed
   (skill-invocation 39/40, not 1.0).
3. **P1 hit its pre-specified numbers on the wrong population.** Predicted
   `with_skill ≥ 0.8`, `without_skill ≤ 0.5`, `Δ ≥ +0.3`; observed 1.00 / 0.50 /
   +0.50, Fisher p = 0.0325. This is a real confirmation of a pre-specified
   hypothesis, weakened — not voided — by the population mismatch. It needs a
   replication on a declared population before it is advertised.
4. **P5 is refuted, and in the opposite direction.** Predicted −41% tokens / −32%
   wall clock. Observed on Sonnet 5: **+24.8% tokens** (2.98 SE) and **+18.4% wall
   clock** (2.11 SE). The Haiku efficiency *gain* is therefore not a property of the
   skill — it is a property of unskilled Haiku flailing, and it reverses on the
   current tier. Any README claim of a token saving would have been a tier-specific
   artifact advertised as a general result. **Do not revive it.**
5. **P6 was wrong about direction of certainty.** The aggregate pass rate was
   predicted inconclusive at ~1.4 SE; it came back **+10.8pp at 2.96 SE**
   (CI [+3.6pp, +18.0pp]), because the `with_skill` arm ceiled at exactly 1.000 with
   zero variance. **It is still not promoted to the headline** — the pre-registration
   demoted it unconditionally and "it happened to clear" is precisely the
   post-hoc promotion that rule exists to forbid.

**Validity findings that survive scrutiny** (checked, not assumed):

- `live_source_reads: 0` — no dispatch read the real repository.
- 2 stray-write violations, one in each arm, both blocked, both benign `/tmp` scratch
  writes. No pollution of the workspace.
- 107 guard denials, 105 of them the known redirect false positive (eval-magic#179).
  Distribution is symmetric across arms — 54 `with_skill` vs 53 `without_skill` — so
  they cannot bias a delta.
- The one non-invoking `with_skill` run (`flaky/with_skill/run-9`) does not shift the
  `with_skill` mean, which is 1.000 across all 40 runs with or without it.
- **The P1 result is not a guard artifact.** Two of the five `without_skill` failures
  had a `/tmp` write denied. Both recovered, wrote their verification *inside* the
  sandbox, ran it — and then deleted it themselves before finishing. Transcript-level
  failure modes: 3 runs never wrote verification at all; 2 wrote it, ran it, and
  removed it.

**What is owed before anything is promoted:** a run on a declared model with P1 as
the stated primary endpoint. Do not re-tune the pagination fixture to chase this —
it is frozen, and it already did its job.

## Run parameters (frozen)

- **Agent model:** `claude-haiku-4-5-20251001`. **Judge model:** `claude-sonnet-5`.
- **Mode A**, `--skill-dir ./skills` (siblings staged in both arms — the control arm
  keeps the other skills, so the comparison is "vs the same setup without this
  skill").
- **All four cases**, `--runs 10` → 80 agent dispatches, 120 judge dispatches.
- **Every** command passes
  `--harness-file skills/investigating-bugs/evals/harness/claude-code-utc.toml`
  (TZ=UTC pin, plugin isolation, working permission mode).
