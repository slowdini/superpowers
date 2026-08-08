import { toDate } from "./parseDate";

// Is the order's due date the current calendar day? Used to badge invoices as
// "due today". `now` is injectable for testing.
export function isDueToday(ymd: string, now: Date = new Date()): boolean {
  const due = toDate(ymd);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}
