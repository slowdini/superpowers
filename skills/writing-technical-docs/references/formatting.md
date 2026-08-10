# Formatting technical content

A lookup reference for how to format particular content types in developer docs.
Consult it when one of these content types appears in a doc you're drafting, and during
review to verify the draft against it. Don't read it front to back.

Project or venue conventions (a repo's existing docs, a platform's comment syntax)
outrank everything here.

## Headings

- Sentence case ("Migrate the database", not "Migrate the Database").
- Task-based sections get a bare-infinitive heading ("Create an instance"); conceptual
  sections get a noun phrase that doesn't start with an -ing verb ("Migration
  concepts", not "Migrating").
- One unique H1 per page; don't skip levels (H2 under H1, H3 under H2); every heading
  is followed by content before the next heading.
- Introduce a group of subsections with "The following sections ...", not the ambiguous
  "this section".
- Prefix a section that applies only in some scenarios with "Optional:".

## Lists

- **Numbered** when sequence matters (steps, priorities); **bulleted** when it doesn't
  (options, examples) — and make clear whether every item applies. **Description
  lists** for term/definition pairs.
- Never a one-item list; fold it into prose or use other formatting.
- Keep items parallel: same grammatical form, same capitalization and punctuation
  scheme within a list.
- Introduce a list with a complete sentence: colon if the list follows immediately,
  period if something intervenes. Don't introduce with a partial sentence the items
  complete.
- In running text, use serial commas and never end a list with "etc." — if the list
  isn't exhaustive, say so in the lead-in ("processes data such as ...").

## Tables

- Use a table when each item has three or more related fields (name, type,
  description); pairs belong in a description list; single values in a list.
- Sentence-case, concise column heads with no trailing punctuation. Sort rows
  logically, or alphabetically when there's no logical order.
- Never use tables for page layout or to frame code snippets. One-column tables become
  lists; long or multi-header tables get split.
- Introduce each table with a sentence and keep it adjacent to the text that refers to
  it.

## Procedures

- One action per numbered step, imperative mood, parallel openings. Combine menu paths
  with `>` ("Click **File > Open**").
- The intro sentence adds context the heading doesn't already give — if the heading
  says it, skip the intro. A single-step procedure is a bullet, not a numbered list.
- Prefix conditional steps with "Optional:". For repeated procedures, reference the
  canonical one instead of copying it.
- No directional language ("the button below", "in the above diagram") — it breaks with
  layout changes and screen readers. Name the element instead.
- Introduce a command by what it does ("Deploy the load generator:"), not with "Run the
  following command:".
- When several ways exist to do something, document the best one.

## Notices (Note / Caution / Warning)

- **Note**: useful but not critical — the reader succeeds without it. **Caution**:
  proceed carefully. **Warning**: "don't do this" — irreversible actions, data loss,
  security risk.
- Use sparingly and never stack two in a row; overuse makes readers skip all of them.
  If unsure, write the point as regular text first and promote it only if it truly sits
  outside the flow.
- Never put prerequisites, essential steps, or expected results in a notice — that
  content belongs in the main flow. Never use a notice for a cross-reference.

## Code in text

- Code font (backticks) for anything the reader could mistake for prose: class, method,
  variable, and attribute names; commands and their output; data types; language
  keywords; filenames; placeholder variables; HTTP methods and status codes.
- Not code font: product and service names, domain names, URLs the reader visits.
- When a word is both a code element and a concept, code font marks the element
  ("the `Activity` class") and plain text the concept ("an activity's lifecycle").
- Don't bend code into grammar: avoid pluralizing or possessivizing code-font items
  (reword instead of writing "`endpoint`s").
- Link an API element to its reference entry on first use; very common classes don't
  need repeated links.

## Code samples

- Follow the language's own style guide for indentation and layout; wrap lines around
  80 characters so samples survive narrow windows and print.
- Mark omitted code with a comment in the sample's language ("# Several lines omitted
  here"), never with "..." or "…".
- Introduce each sample with a sentence — colon when the sample follows immediately,
  period when something intervenes.
- Samples should run as shown. Keep them minimal but complete: one excellent,
  realistic example beats several sketchy ones.

## Commands and placeholders

- Link the command's reference documentation where you introduce it; document only the
  arguments the task needs and let the reference carry the full list.
- Prefer a click-to-copy example that runs unedited. Keep `[]`, `{}`, `|`, and `...`
  meta-syntax out of copyable blocks — it breaks when pasted.
- Follow the tool's own terminology: POSIX command lines have *options* and
  *arguments*, not "flags".
- Placeholders are descriptive and styled distinctly (UPPERCASE_WITH_UNDERSCORES in
  code font): `PROJECT_ID`, never a bare `x` or `xxx` (except where the standard uses
  it, like `2xx` status codes). Explain every placeholder on first use; with several,
  list them in order of appearance with descriptions.
- Don't casually document destructive shortcuts (`--force`, `-y`, `--assumeyes`)
  without a warning about what they skip.

## UI elements and keyboard input

- Refer to UI elements by their exact visible label in **bold**, sentence case:
  "Click **Create bucket**." Don't use code font for UI labels, and don't make an
  element's name a verb.
- State instructions as goals when the UI is obvious ("Refresh the page"); name the
  widget only when the reader needs it.
- Verbs: **click** buttons/links/menu items, **select** checkboxes and list items,
  **enter** or **type** text, **press** keys, **turn on/off** toggles.
- Prepositions: *in* dialogs, fields, lists, menus, panes, windows; *on* pages, tabs,
  toolbars.
- Keyboard: spell out modifier names (Control, Command, Shift — not symbols), use
  `Modifier+Key` ("Press Control+C"), and give the macOS variant in parentheses after
  the Windows/Linux one.

## API reference comments

- Document every public class, method, constant, field, parameter, return value, and
  thrown exception. The first sentence of each description is the summary — put the
  essential fact there, because indexes and tooltips show only that.
- Class descriptions state purpose without repeating the class name; method
  descriptions lead with the action verb ("Creates", "Returns", "Deletes").
- Boolean parameters: "If true, validates the certificate. If false, ..." — or for
  state rather than commands, "True if the zoom is set; false otherwise."
- Give each value's behavior, then the default: end with "Default: ...".
- Return descriptions stay brief and start with "The ..." ("The bird specified by the
  given ID."); detail belongs in the class or method description.
- Deprecations name the replacement and what to do instead ("Deprecated. Use
  `CameraPose` instead."), plus the version that deprecated it when versions exist.

## Filenames and file types

- Refer to filenames in code font with the word "file" ("In the `build.sh` file, ..."),
  spelled exactly as on disk even when the name breaks conventions.
- Refer to file *types* by their formal name, not the extension: "a PNG file", not "a
  .png file"; "a YAML file", not "a .yaml file".
- Don't verb file types: "Extract a zip file", not "Unzip a zip file".

## Links and cross-references

- Links point to *additional* information, never to vital information the reader needs
  for the task at hand — put the essentials on the page, then link for depth.
- Short context beats a link: define the term or give the two steps inline instead of
  sending the reader away.
- Be selective: every link is a decision and an exit. A couple per paragraph at most,
  none in headings, and no duplicate links to the same target on one page.
- Link text describes the destination ("see Performance comparison"), never "click
  here", and carries no quotation marks.

## Dates, times, numbers

- Dates in words ("January 19, 2017"); if numeric-only is required, use ISO 8601
  (`2017-04-15`). Date before time. Avoid seasons — name months or quarters.
- Spell out zero through nine and numbers opening a sentence; numerals for 10 and up,
  and always for technical quantities, versions, measurements, and percentages
  ("5 MB", "version 3", "8%"). Commas in numbers with four or more digits ("1,532").
- Spell out ordinals ("first", not "1st"); dimensions take a lowercase x ("192x192").

## Sources

Adapted from the
[Google developer documentation style guide](https://developers.google.com/style)
(CC BY 4.0) and the
[Red Hat Technical Writing Style Guide](https://stylepedia.net/style/)
(CC BY-SA 3.0), trimmed to what professional developers actually format day to day.
