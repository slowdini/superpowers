# Baseline — working-with-tdd

Committed reference output from a canonical eval run. Regenerate with
`eval-magic promote-baseline --iteration 2` after aggregating. The ephemeral workspace (run records, timing,
dispatch files, produced outputs) stays gitignored under `skills-workspace/`
and is reclaimable by `eval-magic teardown` once promoted (this commit's marker).

| Field | Value |
|-------|-------|
| Mode | revision |
| Iteration | iteration-2 |
| Harness | claude-code |
| Agent model | claude-sonnet-4-6 |
| Judge model | claude-sonnet-4-6 |
| Conditions | old_skill, new_skill |
| Run timestamp | 2026-06-18T03:16:09.503Z |
| Label | flaky-guidance-tightening (PR #237) |
| Promoted from commit | 0ba1147 |

Files:
- `benchmark.json` — aggregate pass-rate / duration / token deltas.
- `grading/<eval-id>__<condition>.json` — per-run assertion results and judge rationales.
- `NOTES.md` — operator-authored observations for this baseline (never overwritten by promote).
