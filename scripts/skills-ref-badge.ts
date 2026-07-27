#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = "skills";
const BADGE_FILE = ".github/badges/skills-ref.json";
const SKILLS_REF_BIN = "skills-ref";

/**
 * Pure helper: build the shields.io endpoint JSON for the skills-ref badge.
 * `total === 0` signals the validator itself did not produce results
 * (binary missing / errored), rendered as a neutral "unavailable" badge.
 */
export function buildBadgeJson(
  valid: number,
  total: number,
): { schemaVersion: number; label: string; message: string; color: string } {
  if (total === 0) {
    return {
      schemaVersion: 1,
      label: "skills-ref",
      message: "unavailable",
      color: "lightgrey",
    };
  }
  const allValid = valid === total;
  return {
    schemaVersion: 1,
    label: "skills-ref",
    message: `${valid}/${total} valid`,
    color: allValid ? "brightgreen" : "red",
  };
}

function listSkillDirs(): string[] {
  return readdirSync(SKILLS_DIR)
    .filter((entry) => statSync(join(SKILLS_DIR, entry)).isDirectory())
    .filter((entry) => {
      try {
        statSync(join(SKILLS_DIR, entry, "SKILL.md"));
        return true;
      } catch {
        return false;
      }
    })
    .map((entry) => join(SKILLS_DIR, entry))
    .sort();
}

function validateSkill(skillDir: string): { ok: boolean; err?: string } {
  const result = Bun.spawnSync([SKILLS_REF_BIN, "validate", skillDir], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    return {
      ok: false,
      err: `${result.stderr.toString().trim() || result.stdout.toString().trim()}`,
    };
  }
  return { ok: true };
}

function writeBadgeIfChanged(badge: {
  schemaVersion: number;
  label: string;
  message: string;
  color: string;
}): boolean {
  const serialized = `${JSON.stringify(badge, null, 2)}\n`;
  let previous = "";
  try {
    previous = readFileSync(BADGE_FILE, "utf8");
  } catch {
    // file does not exist yet
  }
  if (previous === serialized) {
    return false;
  }
  writeFileSync(BADGE_FILE, serialized);
  return true;
}

if (import.meta.main) {
  // If skills-ref is not installed, emit the neutral badge and exit 0 so the
  // workflow never fails the job on a missing binary; the badge is the signal.
  const binCheck = Bun.spawnSync([SKILLS_REF_BIN, "--version"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  if (binCheck.exitCode !== 0) {
    console.error(
      `warning: '${SKILLS_REF_BIN}' not found on PATH; writing unavailable badge`,
    );
    writeBadgeIfChanged(buildBadgeJson(0, 0));
    process.exit(0);
  }

  const skillDirs = listSkillDirs();
  let valid = 0;
  for (const dir of skillDirs) {
    const res = validateSkill(dir);
    if (res.ok) {
      valid += 1;
    } else {
      console.error(`✗ ${dir}\n${res.err}`);
    }
  }

  // Exit 0 even on validation failures: a red badge is the intended signal,
  // not a workflow failure. Per-skill errors are logged above for the job log.
  const changed = writeBadgeIfChanged(buildBadgeJson(valid, skillDirs.length));
  console.log(
    `skills-ref: ${valid}/${skillDirs.length} valid — badge ${
      changed ? "updated" : "unchanged"
    }`,
  );
  process.exit(0);
}
