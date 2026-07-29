# Notes — running the investigating-bugs suite

Durable run guidance for `evals.json`. (Per-baseline observations live in
`baseline/NOTES.md`; this file is about how the suite must be invoked and how the
fixtures are meant to behave. Which case detects which part of the skill — the
behavior-level decomposition — is `COVERAGE.md`.)

## The dispatch environment MUST be pinned to a non-negative UTC offset

Both timezone cases depend on the agent's own environment being `TZ=UTC` (or any
non-negative offset). The trap is that the naive reproduction comes back **green**:

- `fixtures/tz-date-only/repro.ts` PASSES under `TZ=UTC` and only FAILS under a
  negative offset such as `TZ=America/Los_Angeles`. The agent must think to vary TZ.
  On a host whose local zone is already negative (e.g. `America/New_York`) the bug
  reproduces for free, "works fine for me" stops being misleading, and the cold case
  measures nothing.
- `fixtures/tz-nudged/repro.ts` is the inverse: with the seeded `+1 day` nudge in
  place it FAILS under `TZ=UTC` (renders `March 11`) and PASSES under
  `America/Los_Angeles`. Pinning UTC is what makes "one account looked right" and
  "the code is actually correct" come apart.

eval-magic has no UTC default — the agent process inherits the operator's
environment (`env`/`matrix` on a `command_check` affect only the runner-owned check,
not the dispatch). Pin it at the dispatch recipe by passing the tracked descriptor
override to **every** command of the run:

```
eval-magic <cmd> --harness-file skills/investigating-bugs/evals/harness/claude-code-utc.toml …
```

That descriptor also adds `--setting-sources project,local`, which unloads installed
plugins so the `without_skill` arm is genuinely skill-free, and raises the dispatch
permission mode (see below). See the comments in the file itself.

## The agent must actually be able to RUN things

eval-magic's built-in Claude Code recipe dispatches with `--permission-mode
acceptEdits`. That auto-approves file edits but **not** Bash, and because the recipe
detaches stdin (`</dev/null`) there is nobody to approve, so every command that isn't
trivially safe is auto-denied. Measured on a pilot dispatch: `ls`, `grep` and `find`
ran; `bun run repro.ts`, `node -e …` and `bun --version` all came back "This command
requires approval", and the agent finished by saying it could not execute the
reproduction and had reasoned statically instead.

For this suite that is fatal rather than inconvenient — the discipline under
measurement *is* "reproduce it by varying the timezone before you fix it". With
execution blocked, no arm can reproduce anything, `did_not_trust_green_repro` has no
green run to be fooled by, and the `reproduced_by_varying_tz` transcript check
**passes on an attempt that never ran**. Any delta measured that way is noise.

The descriptor therefore dispatches with a relaxed permission mode. The write guard,
not the permission mode, is the sandbox boundary, and it still enforces: in the same
probe where `bun run` executed normally, the guard blocked a `2>/dev/null` redirect.
If you re-derive these recipes, keep that property — check that a dispatch can run
`bun` and that an out-of-env write is still refused.

**Known noise:** the guard classifies `2>/dev/null` as an out-of-sandbox redirect and
blocks it. Agents use that idiom habitually, so expect a few benign entries in
`guard-denials.json` and the matching `validity_warnings`; they cost the agent a
retry, not correctness.

Verify the fixtures before a run:

```
cd skills/investigating-bugs/evals/fixtures
(cd tz-date-only && TZ=UTC bun repro.ts)                  # -> PASS (exit 0)
(cd tz-date-only && TZ=America/Los_Angeles bun repro.ts)  # -> FAIL (exit 1)
(cd tz-nudged   && TZ=UTC bun repro.ts)                   # -> FAIL (exit 1, "March 11")
(cd tz-nudged   && TZ=America/Los_Angeles bun repro.ts)   # -> PASS (exit 0)
```

## Two fixture variants, one bug

`tz-date-only/` and `tz-nudged/` are identical except for two lines: the nudged copy
already contains `d.setDate(d.getDate() + 1)` in `formatDueDate`. The seeded case's
premise is that a previous turn applied that nudge, so the code the agent opens has
to actually contain it — otherwise there is no nudge to refuse to ship and none to
remove, which is exactly what its two judges grade. Keep the two directories in sync
apart from that nudge (and keep each one's `holdout/` copy identical; a shared copy
cannot resolve `../display` from both).

**Do not reintroduce hints into the fixture comments.** An earlier draft of
`repro.ts` carried a `NOTE:` explaining that the script only fails under a negative
offset and that "reproducing the reported bug means varying TZ", and printed the
active `TZ` in its output. That hands the agent both TZ-related assertions and would
ceil them in *both* arms — the same "the case does the skill's work" failure that
ceiled the previous two suites. Fixture comments should describe what the code is
for, never how to find the bug.

## The held-out matrix is the objective decoy-catcher

`holdout/tz-matrix.holdout.ts` is **held out** — it is NOT in any case's `files`
array, and it is named `.holdout.ts` so the repo's own `bun test` never collects it.
It asserts display correctness, the `serializeForSave` round-trip, and `isDueToday`
across a timezone matrix.

It is wired as the `all_consumers_correct_in_every_tz` `command_check` on both
timezone cases: eval-magic injects the file after the agent finishes (never during
staging, so the agent cannot see or satisfy it) and runs it once per cell of
`TZ ∈ { UTC, America/Los_Angeles, Pacific/Kiritimati, Europe/Berlin }`. The
assertion passes only if every cell passes.

Every tempting wrong fix fails at least one cell — verified:

| Final state | UTC | America/Los_Angeles | Pacific/Kiritimati | Europe/Berlin |
|---|:--:|:--:|:--:|:--:|
| unfixed (`tz-date-only` as staged) | pass | **fail** | pass | pass |
| `+1 day` nudge (`tz-nudged` as staged) | **fail** | **fail** | **fail** | **fail** |
| "force local parse" (`new Date(ymd + "T00:00:00")`) | pass | pass | **fail** (save) | **fail** (save) |
| calendar-date handling (string, or consistent UTC) | pass | pass | pass | pass |

The "force local parse" row is the important one: it is the fix a model reaches for
first, it makes display correct in every zone, and it still corrupts the `save`
round-trip for positive offsets because `toISOString()` rolls the day back.

Run it by hand across cells with:

```
cd skills/investigating-bugs/evals/fixtures/tz-date-only
for tz in UTC America/Los_Angeles Pacific/Kiritimati Europe/Berlin; do
  TZ=$tz bun test ./holdout/tz-matrix.holdout.ts
done
```

**Reading a failure:** a cell can also fail because the agent restructured the module
(renamed or removed `formatDueDate` / `serializeForSave` / `isDueToday`, or moved
them) rather than because its fix is wrong. That is a false negative — inspect the
per-cell stderr under `command-checks/` before scoring it as a bad fix.

## The durable-verification case grades by mutation

`pagination-drops-last-page-cold` measures something the timezone cases are blind to:
not whether the agent fixes the bug, but whether it leaves behind anything that would
catch the bug if it came back. The bug itself (a dropped trailing page) is a
deliberately trivial one-line fix — `fix_is_correct` is the control, not the
measurement.

`holdout/verify-regression-test.sh` grades it objectively, in two phases:

1. Everything the agent left behind must be **green against the agent's own fix**.
   This rules out a broken or half-written test scoring as a pass.
2. The original buggy `chunk.ts` is restored from the held-out pristine copy and
   everything is re-run. At least one artifact must now **fail**.

Artifacts are collected by shape rather than name, so a `*.test.ts`, a `*.spec.ts`,
or a plain repro script all count — Phase 4 of the skill accepts "an automated test
or simple script that consistently triggers the bug". A script that prints the
symptom without exiting non-zero does not count, and should not.

Verified against five hand-built final states, re-checked after every fixture change:
fixed with no test → fail; fixed with a real regression test → pass; fixed with a
vacuous (`typeof chunk === "function"`) test → fail; never fixed → fail; fixed with a
repro script that exits non-zero → pass.

### Why there is no `chunk` test in the fixture

The first version of this case shipped a `chunk.fixture.ts` covering only exact
multiples — realistic, since that is why the bug would ship. It **ceiled immediately**:
Sonnet 5 scored 3/3 in both arms, and every unskilled run simply appended a correct
regression test to the file that was already sitting there. Handing the agent an
obvious place to put a test removes the decision being measured.

Deleting all tests would overcorrect in the other direction — in a project with no
tests at all, declining to write one is a defensible reading of local convention, so a
failure would not mean what we want it to mean.

So the fixture ships `formatBytes.ts` **with** `formatBytes.fixture.ts`, and `chunk`
with nothing. The project visibly tests its code; the buggy function is visibly
untested. Creating verification where none exists is then unambiguously right, and
unambiguously a choice. The `formatBytes` tests stay green in both phases of the
mutation check, so they can never satisfy it by themselves.

**If this case ceils again, do not reach for a third fixture variant.** It has already
been revised once after seeing results; another data-driven redesign is suite tuning,
not measurement. Pre-register the prediction, run it once, and accept the number.

**Outcome (2026-07-28): it did not ceil — v2 works, and this case now carries the
baseline.** Discovery n=10/arm: 10/10 vs 5/10, p = 0.0325. Confirmatory replication
n=20/arm: **20/20 vs 9/20, p = 0.000145**. Pooled 30/30 vs 14/30, p = 1.9 × 10⁻⁶.
The fixture is frozen — do not touch it to chase a nicer number.

The failure modes are worth knowing, because they are not what you would guess: of
the 11 failing `without_skill` runs in the replication, **7 wrote verification inside
the sandbox, ran it, and then deleted it**; only 4 never wrote one at all. The case
measures *durability*, not diligence.

**Gotcha if you edit the script:** paths must keep their leading `./`.
`bun test chunk.fixture.ts` treats a bare filename as a name *filter*, matches
nothing, and exits non-zero — which fails phase 1 for every run regardless of what
the agent did. `bun test ./chunk.fixture.ts` treats it as a path.

## Deliberately not asserted

- **`diff_scope`.** Captured automatically for every run and worth reading as
  diagnostic context, but not a threshold: the smallest diff is not necessarily the
  best change, and the correct fix here legitimately touches more than one consumer.
- **`must_precede: "first_write"`** on the TZ transcript check. `first_write` counts
  *any* write, including writing a repro script — which Phase 4 of the skill actively
  asks for — so it would penalise the disciplined path.
- **A held-out check for the flaky case.** Its rubric explicitly accepts a test-level
  reset as a valid fix, so a held-out pollution pair (which would not call that reset)
  would contradict the rubric it is supposed to enforce.

## Possible future work

- A multi-turn case using eval-magic's scripted `turns`, to test behaviour on an
  under-specified bug report (does the agent ask what "wrong date" means before
  editing?). The runner supports it; no case uses it yet.
- A second non-timezone case with the same decoy richness. A `float-money-rounding`
  control was considered and deferred: its "correct" answer is policy-ambiguous
  (per-line vs per-total rounding), which makes a noisy judge, and a clean
  deterministic small-bug control with an obvious right answer tends to ceil — the
  exact failure this suite is built to avoid. A locale-dependent parse would ride on
  the same `matrix` support the timezone case uses.

## Case status — measured on Sonnet 5, n=10/arm (2026-07-28)

- `pagination-drops-last-page-cold` — **carries the baseline.** 20/20 vs 9/20,
  p = 0.000145 at n=20/arm. Graded entirely by runner-owned command checks: a
  correctness control plus the mutation check above. Fixture frozen.
- `timezone-nudge-ship-pressure-seeded` — **CEILED.** All four assertions 10/10 in
  *both* arms.
- `timezone-date-only-shift-cold` — **effectively ceiled.** 10/10 vs 9/10 or 10/10
  throughout; `did_not_trust_green_repro` ceiled outright at 10/10 vs 10/10.
- `flaky-cross-test-pollution-seeded` — 10/10 vs 8/10, p = 0.47. Not significant.

Base Sonnet 5 already varies TZ to reproduce, distrusts a green repro, and isolates
shared state. **The ceiled cases are deliberately kept.** Deleting a case because it
stopped flattering the skill is how a suite gets tuned into agreement; they stay so
the next tier's run can show whether the ceiling is real. They are diagnostic, not
evidence of value — never quote them as a delta.

Baseline is **PROMOTED** for durable verification only — see `baseline/NOTES.md` for
the scope limits, and read them before quoting any number from this suite.
