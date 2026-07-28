# Pre-registration — P1 confirmatory replication (durable verification)

Written **before** dispatch on 2026-07-28, after the n=10 discovery run
(see `PRE-REGISTRATION.md` and its DEVIATION RECORD). Frozen on commit.

## What this run is

A **confirmatory replication of a single pre-specified hypothesis**, not a suite run.

P1 was pre-registered before the discovery run and hit its stated numbers — but on an
unplanned population (Sonnet 5 rather than the declared Haiku 4.5), which weakens it.
This run tests the same hypothesis on an **explicitly declared** population, with P1
as the stated primary endpoint rather than one prediction among seven.

**Discovery result being replicated:** `pagination-drops-last-page-cold` /
`left_a_regression_test` — `with_skill` 10/10, `without_skill` 5/10, Δ = +0.50,
Fisher exact two-sided **p = 0.0325**.

## Why only one case

The other three cases are measured, not discarded on a whim:

- `timezone-nudge-ship-pressure-seeded` — all four assertions 10/10 in **both** arms.
  Ceiled; measures nothing on this tier.
- `timezone-date-only-shift-cold` — 10/10 vs 9/10 or 10/10 across its assertions;
  the pre-registered discriminator `did_not_trust_green_repro` ceiled outright at
  10/10 vs 10/10.
- `flaky-cross-test-pollution-seeded` — 10/10 vs 8/10, p = 0.47.

Running one case here is **narrowing to the declared primary**, which is legitimate
for a confirmatory test. It is *not* a claim about the skill's overall pass rate, and
the result may not be reported as one. The full-suite numbers stay on the record in
`PRE-REGISTRATION.md`, including the ceilings.

## Declared parameters — no defaults, no inference

- **Agent model:** `claude-sonnet-5`, passed explicitly via `--agent-model`.
- **Judge model:** `claude-sonnet-5`, passed explicitly via `--judge-model`.
- **Verification before the fleet:** the model id recorded in a smoke dispatch's
  events file must read `claude-sonnet-5`. Omitting these flags silently falls
  through to the session default — that is exactly what corrupted the previous run,
  and it fails without any error.
- **n = 20 per condition** (40 agent dispatches). Both assertions are `command_check`,
  so judge cost is limited to the skill-invocation meta-check.
- **Sandbox unchanged** from the discovery run — same guard, same allowlist. Altering
  it between discovery and replication would introduce a second difference and make a
  disagreement uninterpretable.
- **Fixture frozen** at commit `67dcfdc`. Not touched, whatever the outcome.

## Prediction

Stated in advance, deliberately **looser than the discovery point estimate** so the
test is not a rubber stamp on 10/10-vs-5/10:

> `with_skill` ≥ 0.85, `without_skill` ≤ 0.65, **Δ ≥ +0.25**, Fisher exact
> two-sided **p < 0.05**.

Secondary, expected to ceil (it is the control, not the measurement):
`fix_is_correct` at or near 1.00 in both arms. If `fix_is_correct` *fails* in either
arm, the run is compromised — the bug is a one-line fix and both arms should manage
it — and the primary result must not be read.

## Decision rule

**Replication succeeds** if Δ ≥ +0.25 **and** p < 0.05 **and** validity is clean
(invocation rate 1.0 on `with_skill`; `live_source_reads` 0; guard denials
symmetric across arms; no denial shown to have *caused* a `without_skill` failure —
check the transcripts, do not assume).

- **On success:** the finding is that `investigating-bugs` changes whether an agent
  leaves durable verification behind, on the current tier, with a stated token cost.
  That, and not a pass-rate percentage, is what may be advertised.
- **On failure:** report the discovery result as **unreplicated** and promote nothing.
  Do **not** re-tune the fixture, do **not** raise n and try again, and do **not**
  fall back to quoting the discovery p-value. One replication, accepted either way.

## What may not be claimed from this run

- Any aggregate "improvement vs no skill" pass-rate number.
- Any token or wall-clock *saving*. The discovery run measured **+24.8% tokens** on
  this tier; the earlier −41% was unskilled-Haiku flailing, not a skill property.
  Efficiency is reported here as a **cost**, with its interval, or not at all.
- Anything about Haiku 4.5. This run does not touch that population.
