# Notes — running the hardening-plans suite

Durable run guidance for `evals.json`. (Per-baseline observations live in
`baseline/NOTES.md`; this file is about how the suite must be invoked.)

## Run it with `--plan-mode`

This suite must be run with eval-magic's run-level `--plan-mode` flag. The flag injects
the harness's verbatim plan-mode procedure (`profiles/<harness>/plan-mode.md`) as a
`<system-reminder>` into every dispatch, identical across arms. The seeded cases assume
that operating-context layer is present — earlier versions of these prompts hand-embedded
a "[…operating inside the harness's plan-mode workflow…]" preamble; the flag now supplies
it, so the preamble was removed. `--plan-mode` is a run-level flag with no per-eval
encoding, which is why this requirement is recorded here rather than in `evals.json`.

Mode A (`new-skill`, with-skill vs. skill-free baseline) is the default. Representative
invocation (pick the agent/judge models and run count at the pre-flight gate):

```
eval-magic run --skill-dir ./skills --skill hardening-plans \
  --bootstrap ./bootstrap.md --plan-mode --runs <N>
```

The seeded cases (`seeded-review-catches-defects`, `seeded-adversarial-todo-app`) benefit
from `--runs >= 3` to damp run-to-run variance on the llm_judge assertions.

## What the suite measures (and what it deliberately doesn't)

The assertions test the skill's value over a skill-free baseline — the fresh-eyes defect
catch: `no_placeholders`, `catches_hallucinated_file`, `catches_irrelevant_step`,
`catches_name_inconsistency`.

Routing / hand-off ("name `slow-powers:test-driven-development`" /
"`…working-in-isolation`") is **not** asserted by any llm_judge. The skill routes
deterministically, so a "did you name skill X" assertion only measures instruction-following
and duplicates eval-magic's automatic skill-invocation meta-check — which is what now
carries the "did the skill fire" coverage, especially on `seeded-adversarial-todo-app`
where the seed argues the skill is redundant. As a deliberate consequence, the suite no
longer exercises non-functional / research planning contexts; placeholder/defect quality is
domain-independent and covered by the OAuth (cold) and todo (seeded) cases.

`--plan-mode` narrows but does not close the seed gap — it is still text the agent reads,
not a harness-injected mode — so seeded passes are a stronger-than-cold signal, not ground
truth. See "Seeding conversation context (and its ceiling)" in `evaluating-skills`.

## Baseline status

`baseline/` reflects the **old** 8-case Mode B suite (plan-mode off) and is stale against
this consolidated, plan-mode-on suite. Re-run and `promote-baseline` to refresh it; the
old `BASELINE.md`/`NOTES.md` are kept for provenance until then.
