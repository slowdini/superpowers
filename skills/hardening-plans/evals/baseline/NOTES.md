# Notes — hardening-plans Mode A baseline (iteration-2)

Forward-looking observations from the run that produced this baseline. Read these
before trusting the headline `benchmark.json` aggregate.

## What this baseline measures

Mode A (`new-skill`, **with_skill vs. without_skill**), `claude-sonnet-4-6` agent +
judge, `--plan-mode` **on**, 3 cases × **N=5** runs per condition (n=15 per
condition). This is the clean skill-vs-no-skill measurement for the README "why
trust these skills?" table — it replaces the prior Mode B (revision) baseline,
which measured a *language edit* (#188 named-hand-off), not the skill's value over
baseline.

The suite is run with `--skill-dir ./skills`, so the `without_skill` arm still
carries the **other six slow-powers skills** — "no skill" here means
**hardening-plans absent**, not a bare agent. The discriminating signal (below) is
behavior only hardening-plans produces, so the delta is cleanly attributable to it;
but a README headline should read "vs an agent **without this skill**," not "vs a
bare agent."

## Headline

`with_skill` **0.80** vs `without_skill` **0.578** → **delta +0.222 (+22.2pp)**.
Skill invoked **15/15** (rate 1.0, code-checked from transcripts — incl. the
adversarial "skills are redundant" seed). `missing_gradings: 0`, no
`validity_warnings`, no stray writes / live-source reads. `with_skill` costs ~+45s
and ~+28k tokens per run.

## Where the delta comes from (per assertion, with / without)

| Case · assertion | with | without | Δ |
|---|---|---|---|
| seeded-review · **catches_hallucinated_file** | 5/5 | **0/5** | **+1.00** |
| seeded-review · catches_name_inconsistency | 5/5 | 3/5 | +0.40 |
| oauth-cold · no_placeholders | 2/5 | 1/5 | +0.20 |
| seeded-review · catches_irrelevant_step | 5/5 | 5/5 | 0.00 (ceiled) |
| seeded-adversarial · no_placeholders | 5/5 | 5/5 | 0.00 (ceiled) |

**The marquee result** is `catches_hallucinated_file`: the baseline *never* catches
the unconfirmed `src/hooks/useLocalStorage.ts` reference (0/5); the skill *always*
does (5/5). That is precisely the skill's stated "most important check," and it
carries most of the aggregate delta.

## Caveats to read before re-using these numbers

- **Two ceilinged assertions** (`catches_irrelevant_step`, seeded-adversarial
  `no_placeholders`) pass 5/5 in *both* arms — they no longer discriminate. The
  baseline already questions the irrelevant Redux step and already avoids
  placeholders on the adversarial case. Replace or harden these before the next
  iteration if you want them to earn their signal.
- **oauth `no_placeholders` is weak even with the skill (2/5).** The 3 misses are
  honest and consistent: with no provider named in the prompt, the agent left
  `<provider>` / `<PROVIDER>_CLIENT_ID` template tokens, which the (strict) judge
  counts as placeholders. The 2 passes surfaced the provider as a *named
  assumption* instead — the skill's "decide it now" behavior. So the skill helps
  here (+0.20) but doesn't cleanly win; consider whether the rubric should accept a
  declared-assumption form, or whether the prompt should name a provider.
- **N=5 keeps stddev high** (with 0.40, without 0.41) because per-run pass-rate is
  coarse (1–3 assertions per case). The aggregate delta is stable, but per-cell
  rates are best read as the fraction table above, not as continuous values.

## Run friction (eval-magic, hybrid + --guard)

Driven via `--run-mode hybrid` (orchestrated from a prep session shelling
`claude -p` per task). The generated dispatch recipes point `claude -p` at prompt
/ response paths **outside** its cwd/sandbox (`dispatch_prompt_path` is a sibling
of the env; judge prompt+response live under the iteration dir), which a guarded,
non-interactive dispatch cannot read/write. Worked around without changing what the
agent/judge sees: copy each agent prompt into its in-sandbox `outputs_dir`; run
judges from the iteration-dir cwd. A failed-read dispatch still exits 0 and emits a
result, so **smoke-test one dispatch and inspect before the full batch.** Filed
upstream with eval-magic.

## Provenance / scope

iteration-2, mode `new-skill`, harness claude-code, run-mode hybrid, agent + judge
both `claude-sonnet-4-6`, run 2026-06-24, label `hardening-plans-mode-a-baseline`.
3-case consolidated suite (`oauth-task-breakdown-cold`,
`seeded-review-catches-defects`, `seeded-adversarial-todo-app`); `--plan-mode` on.
