#!/usr/bin/env bash
# Re-enactment of a REAL Claude Code TDD session (RED -> GREEN).
#
# Deterministic: pacing lives here (the "actor"), VHS is the "camera".
# Colors use base-16 ANSI (30-37 / 90-97 + bold) so the terminal theme drives them
# (here, Synthpunk Neon Dark). Glyphs limited to VHS's default font: "└─ ✓ ✗ ●".
set -u

RST=$'\e[0m'; B=$'\e[1m'
FG=$'\e[97m'     # brightWhite  -> readable text
DIM=$'\e[90m'    # brightBlack  -> muted chrome
RED=$'\e[31m'    # fail
GREEN=$'\e[32m'  # pass
YEL=$'\e[33m'    # agent bullet
CYAN=$'\e[36m'   # skill name
BLUE=$'\e[34m'   # prompt caret

human()  { printf '%s>%s %s%s%s\n' "$BLUE" "$RST" "$B$FG" "$1" "$RST"; }
bullet() { printf '\n%s●%s %s\n' "$YEL" "$RST" "$1"; }
tool()   { printf '\n%s●%s %s%s%s%s(%s)%s\n' "$YEL" "$RST" "$B$FG" "$1" "$RST" "$DIM" "$2" "$RST"; }
res()    { printf '%s  └─%s %s\n' "$DIM" "$RST" "$1"; }
cont()   { printf '%s     %s%s\n' "$DIM" "$1" "$RST"; }
pause()  { sleep "$1"; }

clear
pause 0.4

# the human's request (generic: a data-fetching change with a subtle ordering bug)
human "for your own account, read the api key from the session instead of refetching it"
pause 0.9

bullet "Using ${B}${CYAN}working-with-tdd${RST}."
pause 0.8

# ---------- RED ----------
printf '\n%s  %sRED%s — write the failing test first\n' "$B" "$RED" "$RST"
pause 0.5
tool "Write" "overview.test.ts"
res  "${FG}it(\"reads the key from the session for your own account\")${RST}"
pause 0.9
tool "Bash" "bun test"
pause 0.7
res  "${RED}✗ reads the key from the session for your own account${RST}"
cont "${DIM}expected the session key, but fetchAccount() was called${RST}"
res  "${RED}0 pass, 1 fail${RST}"
pause 0.6
printf '  %s✓%s fails for the right reason — not wired up yet\n' "$GREEN" "$RST"
pause 1.1

# ---------- GREEN (first attempt reveals a race the test catches) ----------
printf '\n%s  %sGREEN%s — minimal code to pass\n' "$B" "$GREEN" "$RST"
pause 0.5
tool "Edit" "overview.ts"
res  "${FG}use the session key when it's your own account${RST}"
pause 0.9
tool "Bash" "bun test"
pause 0.7
res  "${RED}✗ fetchAccount() still fired once${RST}"
cont "${DIM}race: it ran before the session finished loading${RST}"
pause 0.8
bullet "The test caught a race the first cut missed — fixing before I move on."
pause 1.1
tool "Edit" "overview.ts"
res  "${FG}gate the fetch on the session being loaded${RST}"
pause 0.9
tool "Bash" "bun test"
pause 0.7
res  "${GREEN}✓ reads the key from the session for your own account${RST}  ${DIM}[3ms]${RST}"
res  "${GREEN}12 pass, 0 fail${RST}"
pause 0.7

bullet "${B}${GREEN}Green.${RST} The test caught a race before it shipped."
pause 2.0
