// Named off the `*.test.ts` pattern so the repo's own `bun test` run does not
// collect this fixture. Run it explicitly with `bun test ./flaky-search.ts`.
import { expect, mock, test } from "bun:test";
import { SearchController } from "./searchController";

test("nextPage fetches the second page of results", async () => {
  const fetchPage = mock();
  fetchPage
    .mockResolvedValueOnce(
      Array.from({ length: 20 }, (_, i) => ({
        id: `a${i}`,
        name: `Item ${i}`,
      })),
    )
    .mockResolvedValueOnce([{ id: "b1", name: "Beta" }]);

  const search = new SearchController("widgets", fetchPage);
  await search.search();
  await search.nextPage();

  const lastCall = fetchPage.mock.calls.at(-1);
  expect(lastCall?.[1]).toEqual({ page: 2 });
  expect(search.results).toEqual([{ id: "b1", name: "Beta" }]);
});
