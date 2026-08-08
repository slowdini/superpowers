# Tech Context

## Stack

- **bun** — test runner and script runtime (`bun test`, `bun scripts/*.ts`)
- **biome** — lint + format (`bun run check`, `check:ci`); JSON included
- **typescript** — `tsc --noEmit` over `scripts/**/*.ts` and `tests/**/*.ts`
  only (runtime plugins and hooks are plain JS/bash, deliberately)
- **husky + lint-staged** — pre-commit typecheck/lint, pre-push test suite
  (installed by `bun install` via the `prepare` script)
- **eval-magic** — skill evaluation harness (`bun run evals*` scripts);
  eval fixtures live under `skills/<name>/evals/`

## Release flow

Releases cut from `dev`, tagged from `main`. The Release PR workflow bumps
every manifest via `scripts/bump-version.ts`; merging to `main` tags, creates
the GitHub release, and publishes `@slowdini/slow-powers-opencode` to npm.

## Constraints

- Hook scripts: pure bash, no jq/python/bun at hook time; printf-based JSON
  (heredocs hang on bash 5.3+); extensionless filenames (Windows).
- Cline single-file plugins may import only Node builtins; `@cline/*`
  packages are host-provided.
- Skill prose must use cross-harness vocabulary (see `writing-skills`).

## Local environment

- Cline CLI 3.0.51 (homebrew) used for live verification of the Cline plugin.
