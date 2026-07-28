// Named off the `*.test.ts` pattern so the repo's own `bun test` does not collect
// this fixture. Run it explicitly with `bun test ./formatBytes.fixture.ts`.
import { expect, test } from "bun:test";
import { formatBytes } from "./formatBytes";

test("renders plain bytes below a kilobyte", () => {
  expect(formatBytes(0)).toBe("0 B");
  expect(formatBytes(999)).toBe("999 B");
});

test("scales up through the units", () => {
  expect(formatBytes(2048)).toBe("2.0 KB");
  expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
});

test("stops scaling at gigabytes", () => {
  expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
});
