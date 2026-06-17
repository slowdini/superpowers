# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to add test-only methods to production code.

## Overview

Tests must verify real behavior, not mock behavior. Mocks are a means to isolate, not the thing being tested.

**Core principle:** Test what the code does, not what the mocks do. If TDD reveals you're testing mock behavior, you've gone wrong — test real behavior, or question why you're mocking at all.

## The Iron Laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production classes
3. NEVER mock without understanding dependencies
```

## Anti-Pattern 1: Testing Mock Behavior

**The violation:**
```typescript
// ❌ BAD: Testing that the mock exists
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**Why this is wrong:** You're verifying the mock works, not the component. The test passes when the mock is present and fails when it's not — it tells you nothing about real behavior.

**your human partner's correction:** "Are we testing the behavior of a mock?"

**The fix:**
```typescript
// ✅ GOOD: Test real component or don't mock it
test('renders sidebar', () => {
  render(<Page />);  // Don't mock sidebar
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// OR if sidebar must be mocked for isolation:
// Don't assert on the mock - test Page's behavior with sidebar present
```

**Gate:** Before asserting on any mock element, ask "Am I testing real component behavior or just mock existence?" If the latter, delete the assertion or unmock the component.

## Anti-Pattern 2: Test-Only Methods in Production

**The violation:**
```typescript
// ❌ BAD: destroy() only used in tests
class Session {
  async destroy() {  // Looks like production API!
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... cleanup
  }
}

// In tests
afterEach(() => session.destroy());
```

**Why this is wrong:** Production classes get polluted with test-only code that's dangerous if called for real. It violates YAGNI and separation of concerns, and confuses object lifecycle with entity lifecycle.

**The fix:**
```typescript
// ✅ GOOD: Test utilities handle test cleanup
// Session has no destroy() - it's stateless in production

// In test-utils/
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// In tests
afterEach(() => cleanupSession(session));
```

**Gate:** Before adding any method to a production class, ask "Is this only used by tests?" — if so, put it in test utilities instead. Then ask "Does this class own this resource's lifecycle?" — if not, it's the wrong class for the method.

## Anti-Pattern 3: Mocking Without Understanding

**The violation:**
```typescript
// ❌ BAD: Mock breaks test logic
test('detects duplicate server', () => {
  // Mock prevents config write that test depends on!
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // Should throw - but won't!
});
```

**Why this is wrong:** The mocked method had a side effect (writing config) the test depended on. Over-mocking "to be safe" breaks the actual behavior, so the test passes for the wrong reason or fails mysteriously.

**The fix:**
```typescript
// ✅ GOOD: Mock at correct level
test('detects duplicate server', () => {
  // Mock the slow part, preserve behavior test needs
  vi.mock('MCPServerManager'); // Just mock slow server startup

  await addServer(config);  // Config written
  await addServer(config);  // Duplicate detected ✓
});
```

**Gate:** Before mocking, ask what side effects the real method has and whether the test depends on any of them. If it does, mock at a lower level (the actual slow/external operation), not the high-level method the test relies on. If you're unsure what the test needs, run it against the real implementation first, observe what has to happen, then add minimal mocking at the right level.

## Anti-Pattern 4: Incomplete Mocks

**The violation:**
```typescript
// ❌ BAD: Partial mock - only fields you think you need
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // Missing: metadata that downstream code uses
};

// Later: breaks when code accesses response.metadata.requestId
```

**Why this is wrong:** Partial mocks hide structural assumptions — you only mock the fields you know about, so downstream code that depends on omitted fields fails silently. The test passes while integration breaks, giving false confidence.

**The Iron Rule:** Mock the COMPLETE data structure as it exists in reality, not just the fields your immediate test uses.

**The fix:**
```typescript
// ✅ GOOD: Mirror real API completeness
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // All fields real API returns
};
```

**Gate:** Before creating a mock response, check what fields the real API returns (docs/examples) and include all of them — if you're mocking it, you must understand the entire structure. When uncertain, include all documented fields.

## Anti-Pattern 5: Tests as Afterthought

```
✅ Implementation complete
❌ No tests written
"Ready for testing"
```

Testing is part of implementation, not an optional follow-up — you can't claim complete without tests, and TDD would have caught this. Write the failing test first; see `SKILL.md` for the cycle.

## When Mocks Become Too Complex

**Warning signs:** mock setup longer than the test logic, mocking everything to make the test pass, mocks missing methods the real components have, or tests that break when the mock changes.

**your human partner's question:** "Do we need to be using a mock here?"

**Consider:** integration tests with real components are often simpler than complex mocks.

## TDD Prevents These Anti-Patterns

Writing the test first forces you to think about what you're actually testing; watching it fail confirms it tests real behavior, not mocks; a minimal implementation keeps test-only methods from creeping in; and using real dependencies shows you what the test actually needs before you mock. If you're testing mock behavior, you added mocks without watching the test fail against real code first — you violated TDD.

## Quick Reference

| Anti-Pattern | Fix |
|--------------|-----|
| Assert on mock elements | Test real component or unmock it |
| Test-only methods in production | Move to test utilities |
| Mock without understanding | Understand dependencies first, mock minimally |
| Incomplete mocks | Mirror real API completely |
| Tests as afterthought | TDD - tests first |
| Over-complex mocks | Consider integration tests |

## Red Flags

- Assertion checks for `*-mock` test IDs
- Methods only called in test files
- Mock setup is >50% of test
- Test fails when you remove mock
- Can't explain why mock is needed
- Mocking "just to be safe" or before understanding the dependency chain
