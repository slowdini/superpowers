# Project Brief

Slow-powers is an agent skill set for professional software development. It
enhances plan mode and debugging work, enforces best practices (TDD,
verification, workspace isolation), and works *with* the features of modern
agent harnesses instead of replacing them. It is a fork of
[obra/superpowers](https://github.com/obra/superpowers), with rewrites focused
on clarity, token efficiency, and a lighter touch.

## Core goals

- Ship discipline-enforcing skills (plan hardening, TDD, scientific debugging,
  verification, isolated workspaces) that measurably improve agent behavior —
  every skill ships with a documented eval or it doesn't ship.
- Support multiple agent harnesses from one repo: Claude Code, OpenAI Codex,
  OpenCode, and Cline.
- Keep skill content cross-harness compatible (no harness-specific vocabulary
  in skill prose).

## Scope

- `skills/` holds the shared skills and their evals.
- Harness-specific integration (manifests, hooks, runtime plugins) lives in
  top-level directories; skill content itself stays harness-agnostic.
- This repo is the source of truth; installed plugins are downstream copies.
