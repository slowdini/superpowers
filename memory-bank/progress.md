# Progress

## What works

- Eight skills with eval coverage; bootstrap injection and plan gates on
  Claude Code, Codex CLI, and OpenCode.
- Full test suite green (`bun test`), typecheck and biome clean.
- **Cline support**: plugin entry, manifest field, unit + manifest tests,
  README/AGENTS.md docs, memory bank initialized. Verified live on Cline CLI
  3.0.51: install, skills discovery, and bootstrap rule injection confirmed
  in headless sessions.
- **Cline plan-gate timing fixed** (`fix/cline-plan-gate-timing`): first live
  test showed the old skip-once hook firing after plan presentation and
  approval (Cline's `switch_to_act_mode` is post-approval by design). Now
  two-layer: a plan-presentation rule enforces hardening BEFORE presentation
  (no Cline hook fires earlier than that), and the hook is the pre-execution
  backstop with an already-hardened transcript short-circuit.

## What's left

- Commit/PR for `fix/cline-plan-gate-timing`; manual interactive check of the
  new two-layer gate (`switch_to_act_mode` is only exposed in interactive
  sessions), then release: next version bump carries the Cline plugin.

## Known issues / deferred

- Cline plugins don't load on VSCode/JetBrains extensions — IDE users get a
  documented skills-only manual install (no bootstrap, no plan gate).
- Cline skill collisions are last-wins with plugin directories scanned after
  workspace ones, so an installed slow-powers plugin shadows same-named
  workspace skills (the reverse of what this repo wants for development).
  Deferred: cross-harness installed-vs-repo precedence exploration.
- Cline pre-presentation enforcement is prompt-level (rule) — Cline exposes no
  hook moment before streamed assistant text. The hook backstop guarantees an
  un-hardened plan is never executed; if it fires, the user briefly saw an
  un-hardened draft before the agent hardens and re-presents.

## Decision log

- 2026-08: Cline distribution via root `package.json` + git install (no new
  npm package).
- 2026-08: Memory bank committed to git (`.clinerules/memory-bank.md` +
  `memory-bank/`).
- 2026-08: No `.cline/skills/` symlinks (option (c)) pending the precedence
  exploration.
- 2026-08: Cline plan gate re-anchored to a two-layer design (rule
  pre-presentation + hook pre-execution backstop) after the first live test
  showed `switch_to_act_mode` fires post-approval in Cline; the deferred
  already-hardened short-circuit implemented via `snapshot.messages` scan.
