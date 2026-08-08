# System Patterns

## Flat layout, one source of truth

Skills and shared assets live at the repo root; each harness's integration is
a thin top-level layer that points back at them. Nothing is duplicated per
harness.

## Per-harness delivery of the same two behaviors

Every harness delivers (1) the `bootstrap.md` skill-enforcement block and
(2) a deterministic plan-presentation gate, using that harness's native
mechanism:

| Harness  | Bootstrap delivery                     | Plan gate                                        |
| -------- | -------------------------------------- | ------------------------------------------------ |
| Claude   | `hooks/session-start` (SessionStart)   | `hooks/exit-plan-mode` (PreToolUse, deny-once)   |
| Codex    | shared `hooks/hooks.json` SessionStart | `hooks/codex-stop-plan-mode` (Stop hook)         |
| OpenCode | `opencode/plugins/slow-powers.js` system-prompt transform | same plugin, `file.edited` event on plan files |
| Cline    | `cline/plugins/slow-powers.js` `registerRule` | same plugin, `beforeTool` skip-once on `switch_to_act_mode` |

Claude/Codex hooks are extensionless bash scripts dispatched by the
`hooks/run-hook.cmd` polyglot (Windows-safe). OpenCode/Cline integrations are
dependency-free JS runtime plugins.

## Manifest and version lockstep

`scripts/manifest-files.ts` lists every versioned manifest;
`scripts/bump-version.ts` rewrites them in lockstep (then biome-formats);
`tests/harness/manifests.test.ts` asserts parity. The Cline and OpenCode
integrations both declare themselves inside the root `package.json`, which is
already locked.

## Parameterized parity tests

`tests/harness/spec.ts` holds one `HarnessSpec` per harness; the suite in
`manifests.test.ts` applies the same contract to all of them. Adding a
harness = adding a spec entry (+ custom assertions when the manifest shape
doesn't fit the dotted-string `pathFields` machinery, as with Cline's nested
`cline.plugins[].paths[]`).

## Skill integrity tests

The shared-assets block in `manifests.test.ts` pins: SKILL.md frontmatter
(name + description), top-level-only skill folders, documented peer
directories (`assets`/`evals`/`references`/`scripts`), resolvable markdown
links, reachable reference files, mermaid-not-graphviz, and the bootstrap
marker.
