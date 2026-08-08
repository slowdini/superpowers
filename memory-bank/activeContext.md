# Active Context

## Current focus

Cline plan-gate timing fix (August 2026). The first live test of the Cline
plugin showed the gate rejecting an un-hardened plan only AFTER the plan was
presented and approved — because `switch_to_act_mode` is called post-approval
in Cline, unlike Claude's `ExitPlanMode` which carries the plan text. The gate
is now two-layer:

1. **Cline plugin** (`cline/plugins/slow-powers.js`, declared via the `cline`
   field in `package.json`): registers `bootstrap.md` AND a
   `slow-powers/plan-presentation` rule (harden before presenting — the only
   mechanism that reaches the agent pre-presentation), and gates
   `switch_to_act_mode` as a pre-EXECUTION backstop with an
   already-hardened transcript short-circuit (skip-once marker as fail-open
   floor, mirroring `hooks/exit-plan-mode`).
   Skills are auto-discovered from the package root — no wiring needed.
2. **Repo-local Cline setup**: `.clinerules/memory-bank.md` (canonical Memory
   Bank instructions) and this `memory-bank/` directory, both committed.

## Recent changes

- `fix/cline-plan-gate-timing` branch: plugin header docs rewritten (real
  Cline plan flow), `PLAN_PRESENTATION_RULE` added, `planAlreadyHardened()`
  transcript scan added (matches the `skills` tool-input shape only, never
  prose, so the hook's own skip reason can't false-positive), `SKIP_REASON`
  reworded for execution-gate semantics; 5 new tests in
  `tests/harness/cline-plugin.test.ts` (rule registration, short-circuit,
  false-positive guards, full flow).
- Earlier (merged via PR #266/#267/#268): `cline/plugins/slow-powers.js` (new),
  `package.json` `cline` field + `files`; `tests/harness/spec.ts` Cline entry;
  Cline assertions in `manifests.test.ts`; README Cline install section;
  AGENTS.md four-harness update; `.gitignore` covers `.cline/plugins/`.

## Verification results

- `bun test`: 167 pass / 0 fail; typecheck and biome clean on changed files.
  (Baseline note: `bun run check` fails on three pre-existing
  `.eval-magic/hardening-plans/iteration-2` eval-fixture files — unrelated.)
- Live (Cline CLI 3.0.51, headless): install, skills discovery, bootstrap rule
  injection confirmed. First interactive test exposed the gate-timing issue
  this branch fixes.
- Plan gate: unit-tested against the documented `AgentBeforeToolResult`
  contract; runtime `skip` handling and hook context shape confirmed in the
  shipped CLI source. `switch_to_act_mode` is NOT exposed in headless one-shot
  sessions, so an interactive (TUI) confirmation of the new two-layer behavior
  is the one remaining manual check.

## Next steps

- Manually confirm the new behavior in an interactive `cline -i` plan-mode
  session: with the rule active the agent should harden BEFORE presenting;
  if it skips hardening, the first `switch_to_act_mode` after approval is
  skipped with the hardening instruction and the retry (transcript now holds
  the skills call) passes.
- Then open the PR for `fix/cline-plan-gate-timing` (base `dev`).

## Active decisions

- Distribution reuses the root `package.json` (git install); no separate npm
  package or release-workflow change.
- Pre-presentation enforcement is a RULE, not a hook: Cline has no hook moment
  before a plan is shown (verified against the installed binary and
  `@cline/shared` `AgentRuntimeHooks`). The hook stays as the pre-execution
  backstop. Trust guarantee moves from "user only ever sees a hardened plan"
  (Claude, achievable) to "an un-hardened plan is never executed, and hook
  firing routes the agent to harden + re-present" (Cline).
- The already-hardened short-circuit (upstream #153 refinement) is now
  implemented for Cline via the `snapshot.messages` transcript scan.
- No `.cline/skills/` dogfooding symlinks: Cline's skill registry is
  last-wins with plugin dirs scanned *after* workspace dirs, so an installed
  slow-powers plugin would silently shadow the repo's skills. The
  installed-vs-repo precedence question is deferred to a separate
  cross-harness exploration (it affects all harnesses).

## Learnings

- Cline plugins load only in CLI/SDK/Kanban — not VSCode/JetBrains. IDE users
  get skills via manual copy into `.cline/skills/` or `~/.cline/skills/`.
- Cline reads `AGENTS.md` natively; no memory-file symlink needed for it.
- **Cline plan-mode flow (verified in CLI 3.0.51 source):** the plan is
  presented as a free-form assistant message; the CLI's plan-mode system
  prompt and the `switch_to_act_mode` tool description both mandate: present
  plan → end turn → user approves in a follow-up message → ONLY THEN call
  `switch_to_act_mode` (`lifecycle.completesRun`, then a continuation turn
  with "The user approved switching to act mode..."). So
  `switch_to_act_mode` is an execution boundary, never a presentation moment.
- **Complete plugin hook surface** (`AgentRuntimeHooks`, binary + SDK agree):
  `beforeRun`, `afterRun` (observe), `beforeModel` (rewrite request / stop),
  `afterModel` (stop only — and `stop:true` aborts the whole run),
  `beforeTool` (skip/input/policy/stop), `afterTool` (result/stop),
  `onEvent` (observe only). Nothing fires before streamed assistant text,
  so no hook can gate plan presentation.
- Hook contexts pass the tool name on BOTH `tool.name` (first-party shape) and
  `toolCall.name` (docs shape) — read `tool?.name ?? toolCall?.name`. The
  `beforeTool` context also carries `snapshot.messages` — the full
  conversation transcript, usable for detection logic.
- Skill invocation in Cline goes through a `skills` tool with input
  `{skill, args}` — match that shape for skill-use detection.
- Headless one-shot sessions (`cline -p "..."`) don't expose
  `switch_to_act_mode` and can't drive TTY-only commands (`cline config`); use
  interactive sessions for plan-gate verification.
- Cline's local plugin install copies dotfile-free repo content — everything
  the plugin needs (`cline/`, `skills/`, `bootstrap.md`) is a normal path, so
  this is fine.
