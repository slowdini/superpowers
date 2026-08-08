# Active Context

## Current focus

Cline support was just added (August 2026). Two halves:

1. **Cline plugin** (`cline/plugins/slow-powers.js`, declared via the `cline`
   field in `package.json`): registers `bootstrap.md` as a session rule and
   gates the first `switch_to_act_mode` of each conversation on
   hardening-plans (skip-once + tmp marker, mirroring `hooks/exit-plan-mode`).
   Skills are auto-discovered from the package root — no wiring needed.
2. **Repo-local Cline setup**: `.clinerules/memory-bank.md` (canonical Memory
   Bank instructions) and this `memory-bank/` directory, both committed.

## Recent changes

- `cline/plugins/slow-powers.js` (new), `package.json` `cline` field + `files`
- `tests/harness/spec.ts` Cline entry; Cline assertions in `manifests.test.ts`;
  new `tests/harness/cline-plugin.test.ts`
- README Cline install section; AGENTS.md four-harness update;
  `.gitignore` covers `.cline/plugins/` install artifacts

## Verification results (Cline CLI 3.0.51, headless)

- `cline plugin install <repo> --cwd <scratch>` works; installer copies the
  repo and registers the plugin entry.
- Live session: all 8 skills discovered; `<EXTREMELY-IMPORTANT>` bootstrap
  block present in instructions; bootstrap behavior observed (agent invoked a
  skill on a ~1% match, per the bootstrap rule).
- Plan gate: unit-tested against the documented `AgentBeforeToolResult`
  contract. The runtime's `skip` handling (tool doesn't run, `reason` goes to
  the model) and the hook context shape were confirmed in the shipped CLI
  source — the first-party `core.plan-mode-command-guard` extension uses the
  same pattern. `switch_to_act_mode` is NOT exposed in headless one-shot
  sessions, so an interactive (TUI) confirmation of the gate firing is the one
  remaining manual check.

## Next steps

- PR opened: https://github.com/slowdini/slow-powers/pull/266 (base `dev`).
- Manually confirm the plan gate in an interactive `cline -i` plan-mode
  session (present plan → approve → first `switch_to_act_mode` gets skipped
  with the hardening instruction) — easiest via a test release, per the
  maintainer.
- After merge to `dev`: trigger the Release PR workflow with the next version
  to ship the Cline plugin (that release doubles as the test release).

## Active decisions

- Distribution reuses the root `package.json` (git install); no separate npm
  package or release-workflow change.
- The Cline gate is skip-once only. The already-hardened short-circuit
  (upstream #153 refinement) is deferred — it needs reliable detection that
  hardening-plans already ran (the skill-invocation tool is `skills` in the
  Cline runtime).
- No `.cline/skills/` dogfooding symlinks: Cline's skill registry is
  last-wins with plugin dirs scanned *after* workspace dirs, so an installed
  slow-powers plugin would silently shadow the repo's skills. The
  installed-vs-repo precedence question is deferred to a separate
  cross-harness exploration (it affects all harnesses).

## Learnings

- Cline plugins load only in CLI/SDK/Kanban — not VSCode/JetBrains. IDE users
  get skills via manual copy into `.cline/skills/` or `~/.cline/skills/`.
- Cline reads `AGENTS.md` natively; no memory-file symlink needed for it.
- Cline's plan-exit tool is `switch_to_act_mode`; `AgentBeforeToolResult.skip`
  + `reason` is the deny mechanism; `registerRule` puts content in the system
  prompt every session.
- Hook contexts pass the tool name on BOTH `tool.name` (first-party shape) and
  `toolCall.name` (docs shape) — read `tool?.name ?? toolCall?.name`.
- Headless one-shot sessions (`cline -p "..."`) don't expose
  `switch_to_act_mode` and can't drive TTY-only commands (`cline config`); use
  interactive sessions for plan-gate verification.
- Cline's local plugin install copies dotfile-free repo content — everything
  the plugin needs (`cline/`, `skills/`, `bootstrap.md`) is a normal path, so
  this is fine.
