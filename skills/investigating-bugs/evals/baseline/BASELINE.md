# Baseline — investigating-bugs

Committed reference output from a canonical eval run. Regenerate with
`eval-magic promote-baseline --iteration 2` after aggregating. The ephemeral workspace (run records, timing,
dispatch files, produced outputs) stays gitignored under `.eval-magic/`
and is reclaimable by `eval-magic teardown` once promoted (this commit's marker).

| Field | Value |
|-------|-------|
| Mode | new-skill |
| Iteration | iteration-2 |
| Harness | claude-code |
| Agent model | claude-sonnet-5 |
| Judge model | claude-sonnet-5 |
| Conditions | with_skill, without_skill |
| Run timestamp | 2026-07-28T06:42:45.330Z |
| Label | investigating-bugs-durable-verification |
| Promoted from commit | 6fbdb43 |

Files:
- `benchmark.json` — aggregate pass-rate / duration / token deltas.
- `grading/<eval-id>__<condition>.json` (multi-run cells add an `__r<k>` suffix per run) — assertion results and judge rationales.
- `NOTES.md` — operator-authored observations for this baseline (never overwritten by promote).

