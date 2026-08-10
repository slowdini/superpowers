# Style principles for technical docs

Condensed, evergreen writing guidance for professional software developers, distilled
from the sources listed at the bottom. Read this when you need a decision grounded —
during drafting when a style question comes up, and during review when something reads
wrong. Do not read it cover-to-cover before drafting; most of it confirms what you
already do.

## Audience and style come first

Before writing anything, decide two things. Every later choice — structure, depth,
terminology, tone — is checked against them:

- **Audience:** who reads this, and what do they already know? A beginner following a
  quickstart, an expert looking up a flag, a teammate reviewing your design, and a
  maintainer seeing your PR for the first time need different docs. For anything longer
  than a page, say who the doc is for in an explicit audience sentence near the top.
- **Style:** what register fits the doc type and venue? A README, a design doc, and a
  review comment have different defaults (see [doc-types.md](doc-types.md)).

When a writing decision is hard, re-ask the audience question: *is this right for the
person who will actually read it?* If the answer is clear, you have your answer.

## Voice and tone

- Conversational, friendly, respectful — a knowledgeable colleague, not a marketing page
  and not a spec committee. Neither slangy nor stiff.
- Don't perform enthusiasm or humor; don't be deliberately dry either. The doc's job is
  to give someone in a hurry the information they came for.
- Skip "please" in instructions: "To view the document, click **View**", not "please
  click".
- Avoid buzzwords, figurative language, and culture-specific references (sports,
  holidays, idioms) — they confuse global readers and date the doc.

## Clarity and concision

The always-rules, cheap to apply at any scale:

- Say it directly. Don't use a paragraph where a sentence works.
- One idea per paragraph; break walls of text up.
- Write processes sequentially — never reorder steps for narrative effect.
- Define acronyms and abbreviations on first use; avoid coining new ones.
- Use formatting (headings, lists, tables, code font) to make the doc scannable — see
  [formatting.md](formatting.md).
- Writing for beginners? Name the problems they'll hit and the things they'll overlook.
  Anticipating confusion is what makes a beginner doc good.

## Sentence-level defaults

- **Active voice by default** — make the doer the subject: "Send a query to the service.
  The server sends an acknowledgment." Passive voice is acceptable when the object
  matters more than the actor ("The file is saved"), when the actor should be
  de-emphasized ("Over 50 conflicts were found in the file"), or when the actor is
  irrelevant.
- **Present tense** for general behavior: "the server sends", not "the server will
  send". Reserve *will* for events that genuinely happen later (asynchronous delivery,
  a file archived at the next backup run). Never use hypothetical *would* ("the server
  would then remove you") — commit to what happens.
- **Second person** for the reader: "you", not "we". Use the imperative for
  instructions ("Click **Submit**"). Use third person for what the software or an end
  user does. Reserve *user* for the user of the software your reader is building.
- **Condition or goal before instruction**: "To delete the entire document, click
  **Delete**" — the reader can skip the instruction when it doesn't apply. Same pattern
  for references: "For more information, see X", not "See X for more information".
- Keep sentences short and words simple. Avoid noun stacks longer than three words
  ("default printer configuration parameters" forces the reader to parse the
  relationships). Use the same term for the same thing throughout.

## Timeless (evergreen) documentation

Documentation is read long after it's written. Write for the current state of things,
not the moment of writing. Avoid words and phrases that anchor the doc to a point in
time or assume knowledge of earlier versions:

> as of this writing · currently · does not yet · eventually · existing · future /
> in the future · latest · new / newer · now · old / older · presently · soon

- These are implied by the doc existing at all ("currently supported" is just
  "supported"), or they rot within months ("soon", "latest").
- Time-stamped genres are legitimate exceptions: release notes, changelogs, blog posts,
  and deprecation notices are *about* points in time. PR descriptions and commit
  messages carry session context by design — but even there, write the parts that will
  be re-read (the "why") so they stand alone later.
- If you must mark something as new, anchor it: "The January 14, 2021 release includes
  a new resource panel" ages well; "the new resource panel" doesn't.
- **The agent-specific failure mode:** narrating the work session. "I moved this into
  `utils.ts`", "this now handles retries", "the old parser used to..." — all of these
  describe the edit, not the system. Describe the system.
- Don't document unreleased or planned features as if they exist, and don't promise
  them ("will support", "eventually").

## Claims and recommendations

- No excessive claims: nothing about performance, cost, or security that the reader
  can't verify or that a future incident could invalidate. Avoid superlatives
  (*best*, *fastest*, *simplest*) and absolutes (*never*, *always*); use *ensure* and
  *guarantee* only when literally true.
- Security claims age worst. "Helps prevent account takeovers" survives a breach;
  "prevents account takeovers" doesn't.
- If you state numbers (performance, storage, cost), cite the source or measurement.
- Compare factually: "distributes computation in memory, so it can be faster for this
  scenario — see [benchmark]" beats "faster than X".
- Make recommendations in an active voice with an owner: "We recommend creating multiple
  service accounts", not "It is recommended to create...".

## Jargon, global readers, inclusion

- Jargon: write around it if you can ("when the project finishes, review what worked"
  instead of "hold a post-mortem"); replace it with a plainer term if one exists;
  otherwise define it in plain language on first use or link a trusted definition.
  Jargon that names a code element stays only in direct references to that element.
- Global audience: short unambiguous sentences, consistent terminology and formatting,
  no idioms, no humor that must be translated, no seasons ("in November", not "in
  winter").
- Inclusive language: avoid gendered terms ("man-hours" → "person-hours"), ableist
  metaphors ("sanity check" → "validity check"), and violent figures of speech. Use a
  diverse set of names in examples.

## Sources

Adapted for agent-authored developer documentation from the
[Google developer documentation style guide](https://developers.google.com/style)
(CC BY 4.0), the
[Red Hat Technical Writing Style Guide](https://stylepedia.net/style/)
(CC BY-SA 3.0), and
*[A Guide to Technical Writing: Dos & Don'ts](https://medium.com/shecodeafrica/a-guide-to-technical-writing-7efcd0e70166)*
(Olamide Makinde). When a detail here seems wrong for your venue, the sources are the
tiebreaker — and your project's own conventions outrank them.
