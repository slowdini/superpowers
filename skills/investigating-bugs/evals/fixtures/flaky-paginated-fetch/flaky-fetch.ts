// Renamed off the `*.test.ts` pattern on purpose so the repo's own `bun test`
// run does not collect this deliberately-flawed test. Run it explicitly during
// an investigation with `bun test ./flaky-fetch.ts`.
//
// History: this test fails ~1 run in 1000 in CI and always passes locally. It
// was "fixed" once before by padding the queued mock returns; the failure came
// back.
import { expect, mock, test } from "bun:test";
import { UserListController } from "./userList";

test("navigating to page 2 fetches page 2", async () => {
  // Order-dependent queue: one value per expected call, in call order.
  const fetchUsers = mock();
  fetchUsers
    .mockResolvedValueOnce([{ id: "u1", name: "Ada" }]) // expected: page 1 baseline
    .mockResolvedValueOnce([{ id: "u9", name: "Mia" }]); // expected: page 2

  const list = new UserListController("org-1", fetchUsers);
  await list.goToPage(2);

  // Reads "the last call" and assumes it was the page-2 fetch.
  const lastCall = fetchUsers.mock.calls.at(-1);
  expect(lastCall?.[1]).toEqual({ page: 2 });
  expect(list.users).toEqual([{ id: "u9", name: "Mia" }]);
});
