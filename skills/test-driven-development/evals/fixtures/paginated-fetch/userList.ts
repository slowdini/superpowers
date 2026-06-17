export type User = { id: string; name: string };

export type FetchUsers = (
  orgId: string,
  params: { page: number },
) => Promise<User[]>;

// A paginated user list backed by an injected `fetchUsers` dependency.
//
// The number of times `fetchUsers` is called is deliberately NOT fixed:
// `goToPage` lazily runs the page-1 baseline fetch the first time the list is
// navigated, and a caller may or may not have already run `init()`. So
// navigating to page 2 can issue one fetch or two — a realistic stand-in for an
// effect that fires on mount or a cache that refetches.
export class UserListController {
  users: User[] = [];
  private initialized = false;

  constructor(
    private readonly orgId: string,
    private readonly fetchUsers: FetchUsers,
  ) {}

  async init(): Promise<void> {
    this.users = await this.fetchUsers(this.orgId, { page: 1 });
    this.initialized = true;
  }

  async goToPage(page: number): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
    this.users = await this.fetchUsers(this.orgId, { page });
  }
}
