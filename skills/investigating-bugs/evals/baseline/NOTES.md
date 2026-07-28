# Notes — investigating-bugs

Promoted from iteration-2 at 2026-07-28.

**Status: PROMOTED (durable verification only). Read the scope limits before
quoting this anywhere.**

## What this baseline measures

One thing, measured well: **does the agent leave behind verification that would
catch the bug if it came back?**

| | with skill | without skill | Δ | p |
|---|:--:|:--:|:--:|:--:|
| `left_a_regression_test` (primary) | **20/20** | **9/20** | **+0.55** | **0.000145** |
| `fix_is_correct` (control) | 20/20 | 20/20 | 0 | ceiled by design |

Graded entirely by **mutation**, with no LLM judge in the loop: everything the agent
left behind must pass against its own fix, then the pristine buggy `chunk.ts` is
restored and something must now fail. Artifacts are collected by shape, so a test
file or a plain repro script both count.

**Cost, which belongs in the same breath as the gain:**

| | with | without | cost |
|---|---|---|---|
| tokens | 608,242 | 385,275 | **+57.9%** (5.19 SE, 95% CI [+36.0%, +79.7%]) |
| wall clock | 78.9 s | 55.3 s | **+42.6%** (4.42 SE, 95% CI [+23.7%, +61.5%]) |

Do **not** quote this run's `pass_rate` (1.000 vs 0.725). It averages the ceiled
control in with the real measurement and dilutes a +55pp effect to +27.5pp.

## Why the failures happened — this is the interesting part

Of the 11 `without_skill` runs that failed the primary:

- **7 wrote verification inside the sandbox, ran it, confirmed the fix, then deleted it.**
- **4 never wrote any verification at all.**

The unskilled agent mostly *does* verify. It just doesn't leave the verification
behind. That is the specific behavior this skill changes.

## Provenance and honesty limits

- **Pre-registered before dispatch** in `PRE-REGISTRATION-P1-REPLICATION.md`, with the
  prediction set deliberately looser than the discovery estimate (Δ ≥ +0.25 rather
  than the observed +0.50) and an explicit failure branch. It cleared every threshold.
- **This is a replication.** The discovery run (`PRE-REGISTRATION.md`, n=10/arm) gave
  10/10 vs 5/10, p = 0.0325 — but on an unplanned model, so it could not stand alone.
  Pooled with this run: 30/30 vs 14/30, p = 1.9 × 10⁻⁶.
- **Single case, single tier.** `claude-sonnet-5` only. This says nothing about Haiku
  4.5 and nothing about the skill's other teachings.

## Validity

- Skill invocation 20/20. `live_source_reads` 0. Stray-write violations 0.
- 33 guard denials, **all of them the Bash-redirect false positive**
  (eval-magic#179) — no `Write` was ever blocked, so the guard cannot explain a
  missing test file. Distribution is near-symmetric (18 `with_skill` / 15
  `without_skill`), so it cannot bias the delta either.
- The two denied `without_skill` runs in the *discovery* run were checked at
  transcript level for the same reason: both recovered, wrote in-sandbox, and then
  deleted their own work.

## What ceiled — measured, not assumed

The full 4-case suite ran at n=10/arm on Sonnet 5 (see `PRE-REGISTRATION.md`'s
deviation record). On this tier:

- `timezone-nudge-ship-pressure-seeded` — **all four assertions 10/10 in both arms.**
- `timezone-date-only-shift-cold` — 10/10 vs 9/10 or 10/10 throughout; the
  discriminator `did_not_trust_green_repro` ceiled outright at 10/10 vs 10/10.
- `flaky-cross-test-pollution-seeded` — 10/10 vs 8/10, p = 0.47.

Base Sonnet 5 already reproduces timezone bugs by varying TZ, distrusts a green
repro, and isolates shared state. Those cases are kept because deleting a case after
seeing it ceil is how a suite gets tuned into telling you what you want to hear — but
they are not evidence of skill value on this tier, and must not be quoted as such.

## The efficiency claim that died here

An earlier Haiku 4.5 run showed **−41% tokens / −32% wall clock** with the skill, and
it was very nearly the advertised headline. On Sonnet 5 it **reverses** to +58% / +43%.

The saving was never a property of the skill — it was unskilled Haiku flailing, and it
does not survive a tier change. **Do not revive it.** If efficiency is reported for
this skill, it is reported as a cost.

## Regenerating

```
eval-magic run --harness-file skills/investigating-bugs/evals/harness/claude-code-utc.toml \
  --skill-dir ./skills --skill investigating-bugs --bootstrap ./bootstrap.md \
  --only pagination-drops-last-page-cold --runs 20 \
  --agent-model claude-sonnet-5 --judge-model claude-sonnet-5 --guard
```

**Pass `--agent-model` explicitly and verify it in a smoke dispatch's events file
before dispatching the fleet.** Omitting it silently falls through to the session
default with no error — that mistake cost a full 80-dispatch run in this campaign.
The `--harness-file` is required on *every* eval-magic command of the run.
