export type FormatName = (first: string, last: string) => string;

export type User = { first: string; last: string; active: boolean };

// Renders a one-line user card string. The display name is produced by an
// injected `formatName` dependency, but this unit's OWN behavior is the
// surrounding card: the `User: ` label and the ` (inactive)` suffix it appends
// for disabled users. A test that only checks the formatted name flows through
// never exercises that real behavior — the active/inactive branch.
export function renderUserCard(user: User, formatName: FormatName): string {
  const name = formatName(user.first, user.last);
  const suffix = user.active ? "" : " (inactive)";
  return `User: ${name}${suffix}`;
}
