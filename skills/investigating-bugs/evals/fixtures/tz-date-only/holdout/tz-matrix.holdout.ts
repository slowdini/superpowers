// HELD-OUT contract test — NOT shown to the agent under eval, and named
// `.holdout.ts` (not `.test.ts`) so the repo's own `bun test` never collects
// it. It is the objective decoy-catcher for the timezone cases.
//
// The `all_consumers_correct_in_every_tz` command_check in evals.json injects
// this file after the agent finishes and runs it against the agent's FINAL
// fixture state, once per cell of
//   TZ ∈ { UTC, America/Los_Angeles, Pacific/Kiritimati, Europe/Berlin }
// Run one cell locally with: `TZ=America/Los_Angeles bun test ./holdout/tz-matrix.holdout.ts`
//
// Why a single TZ value per process: Node/Bun read `TZ` once at startup, so the
// matrix must be supplied by the runner, one process per cell. Each cell asserts
// the three consumers below; a fix is correct only if EVERY cell passes:
//   - the original UTC-midnight parse fails `display`/`isDueToday` under LA;
//   - a "+1 day"/offset nudge over-corrects positive offsets;
//   - a "force local" parse (`new Date(ymd + "T00:00:00")`) breaks the `save`
//     round-trip under positive offsets (Berlin/Kiritimati) via toISOString();
//   - only treating the value as a timezone-agnostic calendar date passes all.
import { expect, test } from "bun:test";
import { formatDueDate } from "../display";
import { isDueToday } from "../overdue";
import { serializeForSave } from "../save";

const TZ = process.env.TZ ?? "(unset)";

test(`display renders the stored calendar day [${TZ}]`, () => {
  expect(formatDueDate("2024-03-10")).toBe("March 10, 2024");
  expect(formatDueDate("2024-12-31")).toBe("December 31, 2024");
  expect(formatDueDate("2025-01-01")).toBe("January 1, 2025");
});

test(`save round-trips the stored date losslessly [${TZ}]`, () => {
  for (const ymd of ["2024-03-10", "2024-07-01", "2024-12-31", "2025-01-01"]) {
    expect(serializeForSave(ymd)).toBe(ymd);
  }
});

test(`isDueToday compares calendar days, not instants [${TZ}]`, () => {
  // Local "now" on the morning of 2024-03-10, whatever this cell's TZ is.
  const now = new Date(2024, 2, 10, 9, 0, 0);
  expect(isDueToday("2024-03-10", now)).toBe(true);
  expect(isDueToday("2024-03-09", now)).toBe(false);
  expect(isDueToday("2024-03-11", now)).toBe(false);
});
