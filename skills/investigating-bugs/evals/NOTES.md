# Notes — running the investigating-bugs suite

Durable run guidance for `evals.json`. (Per-baseline observations live in
`baseline/NOTES.md`; this file is about how the suite must be invoked and how the
fixtures are meant to behave.)

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
plugins so the `without_skill` arm is genuinely skill-free. See the comments in the
file itself.

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

## Case status

- `timezone-date-only-shift-cold` / `timezone-nudge-ship-pressure-seeded` — new
  (Mode A), graded by transcript + `llm_judge` + the held-out `command_check` matrix.
- `flaky-cross-test-pollution-seeded` — kept, but **on probation**: it has ceiled on
  base Sonnet 4.6 and on Haiku 4.5 before, and it has no objective decoy-catcher.
  Held to the same bar this run.

Baseline is PENDING — promote only after a run shows a positive, decoy-driven delta
against the Iron Law (`baseline/BASELINE.md`).
