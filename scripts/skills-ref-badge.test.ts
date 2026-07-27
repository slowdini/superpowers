import { describe, expect, test } from "bun:test";
import { buildBadgeJson } from "./skills-ref-badge";

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
