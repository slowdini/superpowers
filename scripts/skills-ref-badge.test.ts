import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildBadgeJson } from "./skills-ref-badge";

const skillsRefWorkflow = readFileSync(
  join(import.meta.dir, "..", ".github/workflows/skills-ref.yml"),
  "utf8",
);

describe("skills-ref-badge buildBadgeJson", () => {
  test("all skills valid -> green score badge", () => {
    expect(buildBadgeJson(8, 8)).toEqual({
      schemaVersion: 1,
      label: "skills-ref",
      message: "8/8 valid",
      color: "brightgreen",
    });
  });

  test("one skill invalid -> red partial-score badge", () => {
    expect(buildBadgeJson(7, 8)).toEqual({
      schemaVersion: 1,
      label: "skills-ref",
      message: "7/8 valid",
      color: "red",
    });
  });

  test("skills-ref missing or errored -> grey unavailable badge", () => {
    //total=0 signals the validator itself did not produce results
    expect(buildBadgeJson(0, 0)).toEqual({
      schemaVersion: 1,
      label: "skills-ref",
      message: "unavailable",
      color: "lightgrey",
    });
  });
});

describe("skills-ref badge workflow", () => {
  test("authenticates protected-branch pushes with the release token", () => {
    expect(skillsRefWorkflow).toMatch(
      /- uses: actions\/checkout@v4\n\s+with:\n\s+token: \$\{\{ secrets\.RELEASE_PR_TOKEN \}\}/,
    );
  });
});
