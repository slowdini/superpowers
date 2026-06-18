export type Product = { id: string; name: string };

export type FetchPage = (
  query: string,
  params: { page: number },
) => Promise<Product[]>;

const PAGE_SIZE = 20;

// Drives a paginated product search backed by an injected `fetchPage`.
export class SearchController {
  results: Product[] = [];
  page = 0;

  constructor(
    private readonly query: string,
    private readonly fetchPage: FetchPage,
  ) {}

  async search(): Promise<void> {
    this.page = 1;
    this.results = await this.fetchPage(this.query, { page: 1 });
    // Warm the next page in the background so paging forward feels instant.
    if (this.results.length === PAGE_SIZE) {
      setTimeout(() => {
        void this.fetchPage(this.query, { page: 2 });
      }, 0);
    }
  }

  async nextPage(): Promise<void> {
    this.page += 1;
    this.results = await this.fetchPage(this.query, { page: this.page });
  }
}
