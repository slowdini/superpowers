# Baseline — investigating-bugs

**Status: PENDING (no promoted baseline).**

The eval suite was rebuilt from scratch (slim, de-scaffolded, outcome-graded — see
`evals.json`). The previous baseline measured the legacy 6-case suite, which ceiled
(with_skill 1.00 vs without_skill 0.967, +3.3pp on Sonnet 4.6), so its `benchmark.json`
and `grading/` were removed rather than left to mislead.

No baseline is committed for the new suite yet. Per the Iron Law in
`slow-powers:evaluating-skills`, do not promote one until a fresh Mode A run shows a
positive delta. To regenerate:

```
eval-magic run --skill-dir ./skills --skill investigating-bugs --bootstrap ./bootstrap.md --runs 5
# ...read the per-assertion deltas, iterate if needed, then:
eval-magic promote-baseline --skill-dir ./skills --skill investigating-bugs --mode new-skill --overwrite
```

Target model for the headline: **Sonnet 4.6** (agent + judge). Present the
`evaluating-skills` pre-flight summary and arm `--guard` before dispatching.

Once promoted, this file is overwritten with the run metadata table, and
`benchmark.json` / `grading/<eval-id>__<condition>.json` are written alongside it.
