import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "..");

describe("release notes workflow contract", () => {
  const releasePrWorkflow = fs.readFileSync(
    path.join(REPO_ROOT, ".github/workflows/release-pr.yml"),
    "utf8",
  );
  const releaseWorkflow = fs.readFileSync(
    path.join(REPO_ROOT, ".github/workflows/release.yml"),
    "utf8",
  );

  test("release PRs start with the structured notes skeleton", () => {
    expect(releasePrWorkflow).toContain("<!-- release-notes -->");
    expect(releasePrWorkflow).toContain("<!-- release-notes:todo");
    expect(releasePrWorkflow).toContain("## Release notes");
    expect(releasePrWorkflow).toContain("### Highlights");
    expect(releasePrWorkflow).toContain("### Behavior changes to know about");
    expect(releasePrWorkflow).toContain("### Fixes");
    expect(releasePrWorkflow).toContain("### Internal changes");
    expect(releasePrWorkflow).not.toContain("Replace this paragraph");
  });

  test("release creation falls back while the todo marker remains", () => {
    expect(releaseWorkflow).toContain('grep -q "release-notes:todo"');
    expect(releaseWorkflow).not.toContain("Replace this paragraph");
  });
});
