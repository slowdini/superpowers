export type FormatName = (first: string, last: string) => string;

export type User = { first: string; last: string; active: boolean };

// Renders a one-line user card. The display name is produced by the injected
// `formatName` dependency.
export function renderUserCard(user: User, formatName: FormatName): string {
  const name = formatName(user.first, user.last);
  const suffix = user.active ? "" : " (inactive)";
  return `User: ${name}${suffix}`;
}
