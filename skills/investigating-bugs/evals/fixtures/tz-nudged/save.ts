import { toDate } from "./parseDate";

// When the order is saved unchanged, its due date is re-serialized to
// "YYYY-MM-DD" and written back to the server. This must round-trip losslessly —
// the date we store should equal the date we loaded.
export function serializeForSave(ymd: string): string {
  return toDate(ymd).toISOString().slice(0, 10);
}
