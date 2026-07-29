#!/bin/sh
# HELD-OUT mutation check — NOT shown to the agent under eval.
#
# Asks the only question that distinguishes a durable fix from a disposable one:
# if this bug came back tomorrow, would anything the agent left behind catch it?
#
#   phase 1 — everything the agent left behind must be GREEN against its own fix
#             (this rules out a broken or half-written test counting as a pass)
#   phase 2 — restore the original buggy source and re-run. At least one artifact
#             must now FAIL, or nothing present actually captures this bug.
#
# Artifacts are collected by shape, not by name, so both an automated test and a
# standalone repro script count — Phase 4 of the skill accepts either ("an
# automated test or simple script that consistently triggers the bug"). A script
# that merely prints the symptom without failing does not count, and should not.
set -u

FIXTURE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FIXTURE_DIR" || exit 1

SOURCE_FILE="chunk.ts"
PRISTINE="holdout/pristine/chunk.ts"

[ -f "$PRISTINE" ] || {
  echo "FAIL: held-out pristine source missing — check cannot run."
  exit 1
}

# Paths keep their leading "./": `bun test chunk.fixture.ts` treats a bare name as
# a name *filter* and silently matches nothing, while `bun test ./chunk.fixture.ts`
# treats it as a path. A filter that matches nothing exits non-zero, which would
# fail phase 1 for every run regardless of what the agent did.
candidates=$(find . -path ./holdout -prune -o -type f \( -name '*.ts' -o -name '*.js' \) -print |
  grep -v "^\./${SOURCE_FILE}\$" | sort)

if [ -z "$candidates" ]; then
  echo "FAIL: the agent left nothing behind that could catch a regression."
  exit 1
fi

echo "candidate artifacts:"
echo "$candidates" | sed 's/^/  /'

run_all() {
  rc=0
  for f in $candidates; do
    case "$f" in
    *.test.* | *_test.* | *.spec.* | *.fixture.ts) cmd="bun test $f" ;;
    *) cmd="bun run $f" ;;
    esac
    if ! $cmd >/dev/null 2>&1; then
      echo "  non-zero exit: $f"
      rc=1
    fi
  done
  return $rc
}

echo "phase 1: artifacts must be green against the agent's own fix"
if ! run_all; then
  echo "FAIL: something the agent left behind does not pass against its own fix."
  exit 1
fi

echo "phase 2: restoring the original bug"
cp "$PRISTINE" "$SOURCE_FILE" || exit 1
if run_all; then
  echo "FAIL: everything still passes once the original bug is restored — nothing captures this bug."
  exit 1
fi

echo "PASS: an artifact left behind fails when the bug is reintroduced."
exit 0
