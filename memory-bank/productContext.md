# Product Context

## Why this exists

Coding agents under pressure skip discipline: they present unreviewed plans,
claim success without running tests, thrash on bugs with guess-and-check, and
let new work collide with in-progress branches. Slow-powers exists to put that
discipline back — not by replacing harness features, but by hardening them
(plan-mode gates, skill-enforcement bootstrap, verification loops).

## How it should work

- A bootstrap block (`bootstrap.md`) is injected into every session, making
  skill use non-negotiable when a skill applies.
- Skills declare prerequisite / next-step gates so the agent follows an
  intended sequence (plan → harden → isolate → TDD → verify).
- Harness hooks/plugins supply the deterministic beats a skill can't enforce
  on its own (e.g. gating plan presentation on hardening-plans).

## User experience goals

- Install once per harness, then forget it — the value shows up as plans that
  don't hallucinate files, tests that exist before code, and success claims
  backed by command output.
- "The plugin for people who don't install plugins": minimal surface, no
  config, no lock-in; users can extend with their own evaluated skills.
