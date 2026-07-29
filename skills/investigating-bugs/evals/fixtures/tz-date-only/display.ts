import { toDate } from "./parseDate";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Renders the order's due date on the invoice.
export function formatDueDate(ymd: string): string {
  const d = toDate(ymd);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
