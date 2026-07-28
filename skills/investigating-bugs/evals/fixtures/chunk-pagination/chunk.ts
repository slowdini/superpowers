// Splits a list of results into fixed-size pages for the paginated results view.
export function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i + size <= items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}
