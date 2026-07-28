// Named off the `*.test.ts` pattern so the repo's own `bun test` does not collect
// this fixture. Run it explicitly with `bun test ./chunk.fixture.ts`.
import { expect, test } from "bun:test";
import { chunk } from "./chunk";

test("splits an exact multiple into equal pages", () => {
  expect(chunk([1, 2, 3, 4], 2)).toEqual([
    [1, 2],
    [3, 4],
  ]);
});

test("returns a single page when the list is exactly one page", () => {
  expect(chunk(["a", "b", "c"], 3)).toEqual([["a", "b", "c"]]);
});
