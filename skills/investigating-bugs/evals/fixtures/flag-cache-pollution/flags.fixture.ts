// Renamed off the `*.test.ts` pattern so the repo's own `bun test` run does not
// collect this fixture. Run it explicitly with `bun test ./flags.fixture.ts`.
import { expect, test } from "bun:test";
import { isEnabled, loadDefaults, setFlag } from "./featureFlags";

test("admins can force new-checkout on", () => {
  setFlag("new-checkout", true);
  expect(isEnabled("new-checkout")).toBe(true);
});

test("new-checkout defaults off for anonymous users", () => {
  loadDefaults({ "new-checkout": false });
  expect(isEnabled("new-checkout")).toBe(false);
});
