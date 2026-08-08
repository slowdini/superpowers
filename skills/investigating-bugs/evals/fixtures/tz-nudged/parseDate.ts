// Shared helper: turn a stored due-date string ("YYYY-MM-DD") into a Date the
// rest of the app formats and compares.
export function toDate(ymd: string): Date {
  return new Date(ymd);
}
