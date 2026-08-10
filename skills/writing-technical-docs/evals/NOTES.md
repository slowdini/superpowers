# Eval notes — writing-technical-docs

**Status: proposed, not yet run.** Authored with the skill in the same change (issue
\#273). The suite is deliberately unexecuted: eval-magic whole-skill runs are not yet
reliable enough to validate complete skills, and the repo is shipping <1.0 skills
"vibes-verified" with evals slated to run as a 1.0 task. Do not treat this file as
evidence of improvement until a Mode A run (with_skill vs without_skill) has been
executed and recorded here.

## Coverage intent

One case per headline behavior, per the evaluating-skills decomposition guidance:

- `readme-for-cli-cold` — cold trigger; audience-first process and conventional
  README structure; evergreen content in a fresh doc.
- `seeded-pr-description-narration` — **seeded** mid-session case (competing
  attractor: momentum + user wants speed); the evergreen rule must strip session
  narration the seed made salient. Cold contrast is the README case.
- `docblock-comment-scale` — the scale rule in both directions: no large-doc ceremony
  for a single comment, and no external style-guide research (the time-waste probe).
  Uses `fixtures/docblock-comment-scale/config.ts`.

## When this gets run

- Mode A (new skill). Suggested follow-ups once reliable: an over-ceremony case at
  README scale (full checklist expected there, unlike the comment case), and a
  checklisting probe (a draft that "satisfies" the evergreen rule with a hollow
  justification and must still be fixed).
