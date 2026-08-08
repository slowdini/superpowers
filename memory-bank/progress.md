# Progress

## What works

- Eight skills with eval coverage; bootstrap injection and plan gates on
  Claude Code, Codex CLI, and OpenCode.
- Full test suite green (`bun test`), typecheck and biome clean.
- **Cline support (new)**: plugin entry, manifest field, unit + manifest
  tests, README/AGENTS.md docs, memory bank initialized. Verified live on
  Cline CLI 3.0.51: install, skills discovery, and bootstrap rule injection
  all confirmed in headless sessions.

## What's left

- Manual interactive check of the Cline plan gate (`switch_to_act_mode` is
  only exposed in interactive sessions), then PR.
- Release: next version bump will carry the Cline plugin via the normal flow.

## Known issues / deferred

- Cline plugins don't load on VSCode/JetBrains extensions — IDE users get a
  documented skills-only manual install (no bootstrap, no plan gate).
- Cline skill collisions are last-wins with plugin directories scanned after
  workspace ones, so an installed slow-powers plugin shadows same-named
  workspace skills (the reverse of what this repo wants for development).
  Deferred: cross-harness installed-vs-repo precedence exploration.
- Cline plan gate has no already-hardened short-circuit yet (deferred; needs
  skill-invocation detection).

## Decision log

- 2026-08: Cline distribution via root `package.json` + git install (no new
  npm package).
- 2026-08: Memory bank committed to git (`.clinerules/memory-bank.md` +
  `memory-bank/`).
- 2026-08: No `.cline/skills/` symlinks (option (c)) pending the precedence
  exploration.
