---
name: evaluating-skills
description: Use when testing whether a new skill improves agent behavior, or when validating a change to an existing skill's language.
---

# Evaluating skills

Skill development has two phases: **drafting** (`slow-powers:writing-skills`) and **evaluation** (this skill). This skill owns the *craft* of evaluation — deciding whether a change needs measuring, designing test cases, devising pressure-testing scenarios, writing assertions, and reading results. The *mechanics* of actually running an eval — building the workspace, staging skills, dispatching subagents, grading, aggregating — are owned by a dedicated tool, **[eval-magic](https://github.com/slowdini/eval-magic)**, which ships as a dependency-less prebuilt binary you invoke as `eval-magic`. See [Running the eval](#running-the-eval) for the hand-off.

## Overview

An eval is a structured measurement of whether a skill actually shifts behavior. Each test case is a realistic prompt; each run dispatches a fresh general-purpose subagent twice — once with the skill loaded, once without (or once with the prior version, once with the revised version) — and grades the outputs against assertions. Pass-rate deltas tell you whether the skill is worth shipping or the change is worth landing.

Evals are harness-agnostic: run records use a portable JSON schema so an eval authored on one harness (Claude Code, Codex, OpenCode) can be executed and graded on any other. The runner documents the schema and the per-harness specifics; this skill stays at the level of *what makes a good eval*.

### Two comparison modes

- **Mode A — new skill.** Compares `with_skill` vs `without_skill`. Use when validating that a brand-new skill beats baseline behavior with no skill loaded. Best understood as a bundle of removal tests — one case per behavior the skill teaches (see *Decompose the skill into behaviors first*).
- **Mode B — revision (the common case).** Compares `old_skill` vs `new_skill`. Use when testing a language change to an existing skill — snapshot the old `SKILL.md`, then run both variants against the same prompts. A negative or zero delta is a signal to revert: the new language did not improve behavior.

The runner implements both; pick the mode that matches the change you're measuring.

## Choosing to test with evals

Before you build an eval, decide whether this change needs one. An eval measures whether words on a page shift **contingent** behavior — what the agent does when the outcome is genuinely in doubt: under pressure, with ambiguity, or against a competing goal. That is where measurement earns its cost.

A **deterministic** change doesn't move that needle. Removing a one-line "announce out loud that you're using this skill" instruction, fixing a typo, or shipping a manually-invoked, testing-only procedure changes what the agent is told, not whether it complies under pressure. You don't eval that an agent can stop saying a sentence any more than you'd unit-test that the language computes `2 + 2`. Following an unambiguous instruction is the runtime contract; evals test the contingent logic built on top of it.

**The question for every skill change:** does it alter contingent behavior, or is it deterministic instruction-following?

- **Contingent → eval (this is the default).** Renaming a skill so its trigger fires reliably, editing a discipline-enforcing skill's rationalization table, changing the wording that decides a pressured choice — the agent might behave differently, and you can't know which way without measuring.
- **Deterministic → declare and skip.** State the decision and your reasoning to the user, then skip the eval. The reasoning is not optional: a silent skip is indistinguishable from dodging the work.

**Either way, announce the decision and why** — "deterministic instruction removal, no eval" or "this changes pressured compliance, I'll run an eval." A visible decision is one the user can override; a silent one is a rationalization waiting to happen. **The door stays open:** if the user wants an eval anyway, run a worthwhile one — design real cases, don't phone it in to confirm a foregone conclusion.

**Skill type is a fast read, not a verdict.** Reference and manually-invoked procedural changes *often* land deterministic; discipline, technique, and pattern changes *often* carry contingency ([`pressure-scenarios.md`](references/pressure-scenarios.md) draws the same line under "When to use" / "Don't use them for"). Use type to orient your first guess — never as the answer. The decision is per *change*, not per type: a deterministic typo fix in a discipline-enforcing skill still skips, and restructuring a reference doc because the agent kept missing a section is contingent and earns an eval.

## The Iron Law

**No skill shipped without passing evals. No behavior-shaping change landed without a positive revision delta.**

Once you've judged a change behavior-shaping, the law is absolute — these are not exemptions:

- Not for "simple additions"
- Not for "just adding a section"
- Not for "documentation updates"
- Not for "obviously the same as before"

If you can't measure a behavioral change, you don't know if it's an improvement. Tuning behavior-shaping language without a benchmark drifts the skill — sometimes silently — toward worse behavior under pressure. (The narrow, declared exception for deterministic changes is above; "deterministic" is a judgment you announce and defend, not a backdoor around this law.)

### Common rationalizations

Excuses for skipping an eval on a change you've already judged behavior-shaping. None of them hold.

| Excuse | Reality |
|--------|---------|
| "Change is obviously an improvement" | Then proving it is fast. Run the eval. |
| "Existing skill works fine" | Until pressure-test scenario X. Run the eval. |
| "No time to author test cases" | The cost of shipping a regression is higher than 30 minutes of eval design. |
| "It's just rewording" | Wording IS the skill. Reword = changed skill. Run the eval. |
| "Eval results are noisy" | Then add runs, not skip the eval. |
| "Pass rate was already 100%" | Then the assertion is too easy. Replace it. |
| "I'll just call it deterministic" | Deterministic means the agent's compliance isn't in doubt — not that you'd rather not measure. If the wording could change a pressured choice, it's behavioral. Run the eval. |

## Models, harnesses, and populations

Model selection defines the population the result describes. An agent is the model
*and* its harness together, so changing either one changes the population rather than
cleanly replicating the old run. Keep the model, harness, prompts, and run settings
identical between comparison arms, and measure on the population the claim is about.

Choose a judge capable of applying the rubric reliably, then calibrate it against human
review on real outputs before scaling. Record exact agent and judge model IDs, verify the
agent ID in a smoke dispatch, and do not pool results across models, model families, or
harnesses. OpenAI's
[evaluation guidance](https://platform.openai.com/docs/guides/evaluation-best-practices)
likewise recommends human calibration for model graders.

## Pre-flight gate (required)

An eval run is not free. Each test case dispatches a fresh subagent **per condition** — an N-case suite is `2N` full agent sessions, plus a judge dispatch for every `llm_judge` assertion. A harness that cannot surface skill invocation also needs judge dispatches for the automatic invocation meta-check. That is real wall-clock time and real tokens, and a subagent under test can write outside its sandbox and pollute the real workspace. **Never kick off a run silently.**

Before building the workspace and dispatching anything, STOP and present the user a run summary, then wait for explicit confirmation:

- **Skill under test** — name and path
- **Mode** — `new-skill` (with vs without) or `revision` (old vs new), plus the baseline label for revision mode
- **Eval cases** — the count and a one-line list of the prompts (from `evals.json`)
- **Models** — the exact agent-under-test and judge model IDs, the population each describes, and whether a family or harness change limits comparison with prior runs. Pass the IDs explicitly through the runner and verify the agent ID in a smoke dispatch so a silent harness default cannot invalidate the run.
- **Cost** — `2N` agent dispatches plus substantive and invocation-meta-check judge dispatches; call out that this is time- and token-intensive
- **Sandbox** — the guard status (on Claude Code, arming the runner's `--guard` is the default; proceed unguarded only on an explicit opt-out, and warn that stray writes will then only be detected after the fact, never blocked)

Do not dispatch until the user confirms *this summary*. An earlier "run the eval" is not confirmation — the summary may reveal a wrong mode, the wrong model, or a missing guard the user never intended. The runner's docs cover how the guard and after-the-fact detection work mechanically; the *gate itself is a judgment call this skill owns*.

### Red flags — STOP before dispatching

- About to dispatch subagents without showing the user the run summary first
- Running on a guard-capable harness without the guard and without an explicit opt-out from the user
- "The user already said run it" — they said it before seeing the cost, models, and guard status
- Spending tokens to "just see what happens" before the cases, mode, or models are confirmed

All of these mean: STOP. Present the pre-flight summary and wait for confirmation.

## Designing test cases

### Decompose the skill into behaviors first

A skill worth a with-vs-without eval usually teaches several distinct behaviors, and a suite authored "for the skill" measures whichever one it happens to trip over. The type case is in this repo: an `investigating-bugs` case written to test investigation efficiency turned out to measure something else — whether the agent leaves a regression test behind — and that accident became the suite's only confirmed effect. This is also why revision (Mode B) evals are easier to author: a revision arrives pre-scoped, the diff names what to measure. A new-skill suite must do that scoping itself, and decomposition is how. Before authoring any case, inventory the skill as discrete, testable behaviors: for each, finish the sentence *"without this, the agent does Y instead of Z."*

- **Units are functional, not lexical.** A behavior rarely lives in one place — a phase step, a rationalization-table row, and a red-flag bullet often restate the same rule. The unit is the behavior; its inventory entry lists every lexical expression. Redundancy inside a skill is expected and deliberate (discipline skills repeat rules on purpose); whether one particular restatement earns its keep is a Mode B revision question, never part of the decomposition.
- **Classify each behavior** with the test from *Choosing to test with evals*: contingent (needs a case), deterministic (compliance isn't in doubt — no case), or structural (prerequisites, navigation, cross-links that support other behaviors).
- **Map both directions.** Every case names the single behavior whose removal should flip it; every contingent behavior names the case that would catch its removal. A contingent behavior with no case is a coverage gap. A behavior no case could ever detect is a trim candidate — tier-scoped, see *Pricing a behavior — ablation runs*.

The map is the suite's coverage report: it shows the range of things the skill demonstrably buys, the way coverage shows which code the tests exercise. Keep it next to the suite (a `COVERAGE.md` beside `evals.json`); the worked example is `skills/investigating-bugs/evals/COVERAGE.md`.

### Writing the cases

A test case has these parts:

- **prompt**: a realistic user message — the kind a real user would actually type
- **expected_output**: a human-readable description of success
- **files** (optional): fixture files the prompt references
- **skill_should_trigger** (optional, default `true`): set `false` for a *negative* eval where correct behavior is the skill **not** firing (e.g. an over-trigger guard — a feature request that shouldn't launch a debugging investigation). Negative evals are excluded from the skill-invocation rate, so a correct non-invocation isn't mistaken for the skill failing to fire.

Cases live in `<skill>/evals/evals.json`. For the file shape, see the author-template example in the eval-magic README and validate against the bundled schema with `eval-magic validate`; for worked, maintained examples, read the live suites in this repo — e.g. `skills/verifying-development-work/evals/evals.json` and `skills/hardening-plans/evals/evals.json`.

Tips for writing good prompts:

- **Start with 2–3 test cases** — the highest-value rows of the behavior map. Don't over-invest before iteration 1.
- **Vary phrasing.** Mix casual ("hey can you check this") with precise ("Run `bun test`, quote the output").
- **Cover edge cases.** Include at least one boundary condition, malformed input, or ambiguous instruction.
- **Use realistic context.** Real users reference file paths, function names, personal context. "Process this data" is too vague to test anything useful.
- **For discipline-enforcing skills**, see the [pressure-scenario taxonomy](references/pressure-scenarios.md) (time pressure, sunk cost, authority, exhaustion, etc.).

**Ship the state the behavior needs.** A case about inspecting files, running commands, or
checking state needs an environment where that action is possible. Without it, the case measures
whether the agent *talks about* inspection, not whether it inspects. Provide real fixtures or
state, then grade the action or evidence they make possible.

**Don't write assertions yet.** You don't know what "good" looks like until you see what the first run produces.

### Testing by skill type

What "stresses the skill" depends on what kind of skill it is. The four types from `slow-powers:writing-skills` each need a different style of prompt:

- **Discipline-enforcing skills** (TDD, verifying-development-work). Test with pressure — academic prompts ("explain how TDD works") will pass without measuring anything useful. Combine multiple pressures (time + sunk cost + authority + exhaustion) and force a choice. See the [pressure-scenario taxonomy](references/pressure-scenarios.md). The wild failure for these skills is almost always *mid-session* — the agent is already committed to a skill-free approach when the trigger arrives — so a cold prompt under-measures them; pair each cold case with a **seeded** one (see *Seeding conversation context* below). Success = the rule holds under maximum pressure.
- **Technique skills** (condition-based-waiting, root-cause-tracing). Test application: hand the agent a new scenario where the technique applies and check it gets used correctly. Include at least one edge-case variation. Success = the technique transfers to a situation the skill didn't explicitly describe.
- **Pattern skills** (flatten-with-flags, information-hiding). Test recognition: include prompts where the pattern applies and prompts where it doesn't. Success = the agent applies the pattern when warranted and refrains when it isn't.
- **Reference skills** (API docs, syntax guides). Test retrieval: ask questions whose answers are in the reference, including a few that hit gaps you suspect. Success = the agent finds the right section and uses it correctly.

**Failure-prevention vs quality-gradient skills — a cut across those four types.** Some skills exist to prevent an obvious, catchable failure: `hardening-plans` stops a plan that cites a hallucinated file, and a single correctness check separates the skilled arm from the unskilled one. Others are *quality-gradient*: the agent already produces a working result, and the skill makes it smaller, faster, more targeted, or correct on the cases the developer didn't test — `investigating-bugs` is the type case (any competent model fixes the reported bug; the skill is about fixing it at the source, once, for everyone). Binary "did it work?" assertions **ceil** on quality-gradient skills, because the unskilled arm also produces something that works. To get a delta you need an engineered trap (a fix that's green on the happy path but wrong elsewhere) and/or a scope/quality metric (a held-out test across other inputs, a diff size) — not just a correctness check the unskilled arm passes too.

### Engineering an attractive failure

An eval only measures a skill when the **unskilled arm is genuinely tempted into the wrong path**. If the correct answer is also the obvious answer, both arms take it, the delta is zero, and you have measured nothing — however many runs you spend. A ceiling like that is a property of the *case*, not the skill: the trap was never baited. Engineer the trap against one behavior from your map — bait exactly the shortcut that behavior forbids — so the case works as a removal test rather than a general exam.

The richest traps combine **hard reproduction** with a **locally-rewarded wrong fix**:

- *Hard to reproduce* — the bug only manifests under conditions the developer's own machine doesn't have: a different timezone, locale, clock, data shape, or scale. A green run in the default environment (and a reporter's "works fine for me") is then not evidence the bug is gone, so the disciplined move — reproduce by varying the context — becomes the thing the skill has to supply.
- *Locally rewarded but wrong* — there is a fast fix that makes the reported symptom go away on the happy path yet breaks an un-reported one: a second consumer of the same value, a different user segment, a boundary the report didn't mention. The unskilled arm takes it and feels finished; only investigation surfaces the breakage.

The worked example: a JavaScript date-only field that renders a day early for users west of UTC. A developer in UTC can't reproduce it; the obvious nudges (`+1 day`, "force local parse") each fix the reporter's case while corrupting other offsets or the save round-trip; only treating the value as a timezone-agnostic calendar date is correct everywhere. The anti-example is a trap that *doesn't* bait — a clamp that visibly charges $0, which any competent model rejects on sight. There is nothing to be tempted by, so there is nothing to measure.

In a small fixture, full investigation is nearly free, so a lazy path is only tempting if you build the temptation in. That is the work: manufacture — with a hidden environment variable, or a second consumer of the same value — the cost a large real codebase would impose for free.

### Seeding conversation context (and its ceiling)

A cold prompt measures trigger-recognition *in isolation*. The harder, more realistic failure is trigger-recognition *under a competing attractor* — an agent already mid-session, committed to a skill-free approach, where loading the skill reads as redundant. Approximate that by **seeding**: embed prior `User:` / `Assistant:` turns directly in the `prompt` string (it is wrapped verbatim as the user request, so a multi-line transcript needs no schema change). Seed an `Assistant:` turn that has already produced work in a native, skill-free style, then a final `User:` turn carrying the real request. A seed can reproduce prior commitment / in-flight momentum, redundancy framing, sunk cost, and — usefully — a prior plan that *name-drops* a skill (e.g. a parenthetical "TDD — tests first") without actually following it, so you can test whether the agent makes the discipline load-bearing or treats the label as compliance. For a worked example, see the seeded cases in `hardening-plans/evals/`.

**When to seed.** Seed when the skill's real-world failure happens *mid-session under a competing attractor* — prior commitment to a skill-free approach, redundancy framing ("I'm already doing this"), sunk cost, exhaustion, or an in-flight workflow/mode that makes loading the skill feel like ceremony. A cold prompt is enough when all you need to know is whether the *description* triggers from a clean start. Discipline-enforcing skills almost always warrant at least one seeded case kept alongside a cold contrast case (the cold one isolates the description; the seeded one stresses the trigger under momentum). Technique, pattern, and reference skills usually don't need seeding unless their failure, too, is specifically a mid-session one.

Reusable seed scaffold — adapt the turns to your skill's attractor:

```
[The following is the conversation so far in this session. You are the
assistant; continue from the final user turn.]

User: <the original request that kicked off the work>

Assistant: <work already produced in a native, skill-free style — the
approach the skill is supposed to correct, optionally name-dropping the
skill's discipline as a label without following it>

User: <the turn that should trigger the skill — phrased so loading it now
reads as redundant or as duplicated effort>
```

Keep the seeded turns short and concrete; the point is to establish momentum, not to write a full session.

**The ceiling — state it plainly.** A seed is *text the subagent reads*, not a state it operates under. It cannot place the agent in a harness-injected mode — a real plan mode, an enforced multi-phase workflow, genuine context-window pressure — it can only *describe* one. So when the wild failure you're chasing was *caused* by such a mode (the documented case: an agent in plan mode that invoked **zero** skills because the mode's own procedure made loading them feel redundant), a text seed cannot fully reproduce it — the causal layer is exactly the one a prompt string can't inject. A seeded **pass is therefore necessary but not sufficient** — it under-estimates real-session difficulty — and a seed that *fails* to reproduce a known wild failure is usually hitting this ceiling, not testing a bad seed. Treat seeded results as a stronger-than-cold signal, not as ground truth, and don't let downstream work over-trust them.

**Narrowing the gap — `--plan-mode`.** For the documented plan-mode case, the runner offers the highest-fidelity in-runner approximation: its `--plan-mode` flag injects the harness's *verbatim* plan-mode procedure into every dispatch as an operating-context layer the subagent is told it is operating under, rather than a paraphrase the agent merely reads in the seed prose. This narrows the gap (verbatim procedure > paraphrase) but does **not** close it: it is still text the agent reads, not an injected mode, so the necessary-not-sufficient ceiling above stands unchanged. Use it as the strongest in-runner signal and pair it with a paraphrase-seed arm. See `eval-magic run --help` for the flag and the per-harness profiles it depends on.

**Preserve the real comparison boundary.** A shared context layer is not a confound merely
because it overlaps the subject skill. If real sessions include it, keep it identical in both
arms: the control is "without this skill," not "without any related guidance." A skill may
intentionally re-surface guidance at the point of decision after earlier instructions have
receded; that timely reinforcement is the behavior being priced. Record shared layers so the
delta is read as marginal value on top of them.

## Writing assertions

After iteration 1, you've seen what the outputs look like. Now write **assertions**: verifiable statements about correctness. Add them to `evals.json` and re-grade existing outputs without re-dispatching. There are two assertion types, and choosing the right one is the craft; the runner documents their exact schema and how each is evaluated.

- **`transcript_check` — mechanical.** Matches patterns against a run's tool invocations. Fast, deterministic, cheap. Use for "did the agent run X" or "did file Y get written." Depends on the harness exposing transcripts (full support on Claude Code; on transcript-less harnesses these grade as unverifiable — lean on `llm_judge` there).
- **`llm_judge` — judged.** Soft criteria a model evaluates. Use for "did the response quote actual evidence" or "did the agent refuse to claim success without proof." Portable across all harnesses.

For maximally portable evals, lean on `llm_judge` for the substantive checks and use `transcript_check` for cheap mechanical signals where the adapter is available.

### Principles

- **PASS requires concrete evidence.** "Includes a summary" + a one-liner labeled "Summary" = FAIL. The label is there but the substance isn't.
- **Specific and observable.** "The output is good" is too vague. "Both axes are labeled" is gradable.
- **Not too brittle.** "Uses the exact phrase 'Total: $X'" fails when correct output uses different wording. Reserve mechanical exactness for actually-mechanical things.
- **Review the assertions while grading.** Too-easy assertions (always pass) and too-hard assertions (always fail) waste signal. Fix them before the next iteration.

**Smoke mechanical graders on real output before scaling.** Synthetic states cover failures you
already imagined; one hand-graded dispatch exposes real phrasing, layout, path, and artifact
assumptions. Before a multi-run batch, dispatch once, grade the output by hand, then compare the
grader's verdict. Make the grader emit an unambiguous marker such as
`GRADER_VERDICT: PASS|FAIL`, assert on that marker, and fail closed when the grader or input
artifact is missing — diagnostic text must never satisfy a passing assertion.

Every with-skill run also gets an automatic **skill-invocation meta-check** — did the skill actually influence behavior, or would the response look identical without it? A run where the skill wasn't invoked is a non-data-point, not evidence the skill is bad. The runner injects and scores this for you and surfaces an invocation rate per condition; read it before trusting a substantive delta. (Mechanics in the runner's docs.)

## Reading results and iterating

Once a run is graded and aggregated, the headline is the **delta**: what the skill costs (time, tokens) and what it buys (pass-rate improvement). A skill that adds 13 seconds and 1700 tokens but improves pass rate by 50 points is probably worth it; one that doubles tokens for a 2-point gain is probably not. For Mode B, a positive `delta.pass_rate` means the revision is an improvement.

**Analyzing patterns:**

- **Replace assertions that always pass in both conditions.** They don't measure skill value.
- **Investigate assertions that always fail in both conditions.** Either the assertion is broken, the case is too hard, or it checks the wrong thing. Fix before next iteration.
- **Study assertions that pass with the skill but fail without it.** This is where the skill adds value — understand *why*.
- **Tighten instructions when results are inconsistent.** High stddev = ambiguous instructions or model variability.
- **Read time/token outliers.** If one run is 3× longer, read its transcript for the bottleneck.

**A ceiling has two causes — tell them apart.** Both arms passing can mean the case's behavior is base-model native at this tier, or the eval is too easy. Disambiguate two ways: check whether the unskilled arm *ever* takes the decoy across runs, and verify each "passing" fix against a held-out matrix (other timezones, other inputs) rather than the reported repro alone. If the unskilled arm reaches the full correct answer unprompted, the ceiling is real — a **null ablation**: the skill doesn't change *that behavior* at this tier. Record it in the coverage map and keep the case as a diagnostic (deleting a case because it stopped flattering the skill is how a suite gets tuned into agreement); a weaker tier or another harness may still need the behavior. If *no* behavior in the map survives, the skill has nothing measurable at this tier and the Iron Law says don't ship — a legitimate, documented finding, not a failure to measure. If neither arm was ever tempted, the trap wasn't attractive — redesign it (see *Engineering an attractive failure*) before concluding anything.

**Human review** catches what assertions don't — outputs that are technically correct but miss the point. Keep per-eval reviewer notes; an empty note means the output looked fine. Focus the next iteration on the cases you had specific complaints about.

**Guidance for revision:**

- **Generalize from feedback.** The skill is used across many prompts, not just these cases. Fixes should address underlying issues broadly, not patch specific examples.
- **Keep the skill lean.** Fewer, better instructions outperform exhaustive rules. If pass rates plateau despite more rules, remove instructions — and let ablation evidence pick the cut, not taste (see *Pricing a behavior — ablation runs*).
- **Explain the why.** Reasoning-based instructions ("Do X because Y") outperform rigid directives. Models follow instructions more reliably when they understand the purpose.

**When to stop:** pass rates are satisfactory and reviewer feedback is consistently empty; iteration deltas have plateaued; or you've found a more fundamental issue (wrong scope, unrepresentative prompts).

## Pricing a behavior — ablation runs

The coverage map is a set of claims: *case C flips when behavior B is removed*. An ablation run tests one claim directly. Mechanically it is a Mode B run — old = the full skill, new = the skill minus one behavior — with the expectation inverted: you are hoping the ablated arm gets **worse** on B's case. If it degrades, the mutant is killed — the attribution is confirmed and the behavior demonstrably earns its keep. If it holds, either the effect is diffuse (other parts of the skill carry it) or the behavior isn't doing anything — at this tier.

- **Ablate the functional unit, entire.** Delete every expression of the behavior together — the step, whole table rows that restate it, its red-flag bullets. A restatement left behind compensates for the deleted step and under-credits the behavior.
- **One behavior at a time, always from the full skill.** Cumulative deletion confounds attribution across behaviors.
- **A null ablation is a per-tier verdict.** The tier you measured didn't need the behavior; a weaker model or another harness may. Trimming on one tier's null tunes the skill to that tier.
- **Runs are targeted, not routine.** A meaningful ablation needs the same run count as any other eval, so a per-behavior sweep is a campaign per behavior. The mandatory, free part is the design-time map. Pay for a run only when (a) a new case should prove it detects the behavior it claims to cover, or (b) a trimming decision needs evidence rather than taste.

The whole-skill Mode A delta remains the headline number. Per-behavior deltas are sub-additive — deliberate redundancy means behaviors partially back each other up — so they do not sum to it.

## Running the eval

The mechanics of executing a run live in **[eval-magic](https://github.com/slowdini/eval-magic)** — the `eval-magic` binary. eval-magic's README is the complete operating guide, and every flag is documented in the tool's own help.

| Need | Where |
|------|-------|
| Quickstart, install, the two modes end-to-end | the eval-magic README |
| Every subcommand and flag; the `--skill-dir` model; workspace layout | `eval-magic --help` and `eval-magic <subcommand> --help` |
| Full run mechanics: dispatch loop, transcript access, grading, aggregating, baselines | the eval-magic README |
| Claude Code & Codex harness specifics — isolating from installed plugins, the guard, judging | the README's Harnesses section |
| What a harness needs to reach Claude-Code-tier support | `docs/harness-parity.md` |

## See also

- `slow-powers:writing-skills` — drafting a skill (Phase 1)
- [Pressure scenarios](references/pressure-scenarios.md) — taxonomy for authoring prompts that stress discipline-enforcing skills
- eval-magic (the `eval-magic` tool) — runs the evals this skill teaches you to author
- agentskills.io/skill-creation/evaluating-skills — the methodology this skill is derived from
