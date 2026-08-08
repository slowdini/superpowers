import { formatDueDate } from "./display";

// An order whose due date is the calendar date 2024-03-10 — no time, no zone,
// exactly as the server stored it. Run this with `bun run repro.ts`.
const dueDate = "2024-03-10";
const shown = formatDueDate(dueDate);
const expected = "March 10, 2024";

console.log(`formatDueDate(${dueDate}) => ${shown}`);
if (shown !== expected) {
  console.error(`FAIL: expected "${expected}", got "${shown}"`);
  process.exit(1);
}
console.log("PASS");
