// HELD-OUT correctness test — NOT shown to the agent under eval. Injected by the
// `fix_is_correct` command_check after the agent finishes, so a run that never
// fixed the bug is distinguishable from one that fixed it but left no test behind.
import { expect, test } from "bun:test";
import { chunk } from "../chunk";

test("keeps the trailing partial page", () => {
  expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
});

test("still splits exact multiples", () => {
  expect(chunk([1, 2, 3, 4], 2)).toEqual([
    [1, 2],
    [3, 4],
  ]);
});

test("keeps a list shorter than one page", () => {
  expect(chunk(["a"], 3)).toEqual([["a"]]);
});

test("returns no pages for an empty list", () => {
  expect(chunk([], 3)).toEqual([]);
});
