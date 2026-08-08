/**
 * Slow-powers plugin for Cline (CLI / SDK / Kanban).
 *
 * Two jobs, mirroring what the bash hooks do on Claude Code and Codex:
 *
 * 1. BOOTSTRAP INJECTION — registers the contents of bootstrap.md as a session
 *    rule, so the skill-enforcement block is part of every session's system
 *    prompt. This replaces the SessionStart-hook injection used on Claude/Codex
 *    and the system-prompt transform used on OpenCode.
 *
 * 2. PLAN GATE — the FIRST switch_to_act_mode call of a conversation is skipped
 *    with an instruction to run the hardening-plans skill on the plan first.
 *    switch_to_act_mode is how Cline presents a finished plan and leaves plan
 *    mode; skipping it keeps the session in plan mode, so the agent can load
 *    the skill, fix findings inline, and re-submit a hardened plan. The
 *    re-submission finds the per-conversation marker and is allowed through.
 *
 * WHY DENY-ONCE (and not deny-until-proven-hardened): keying the marker per
 * conversation and allowing the second attempt guarantees we can never
 * hard-lock a user inside plan mode. Worst case (agent re-submits without
 * hardening) degrades to no-gate behavior — never worse. Same argument as
 * hooks/exit-plan-mode.
 *
 * Skills need no wiring here: when this package is installed as a Cline
 * plugin, the top-level skills/ directory is discovered automatically.
 *
 * Single-file plugin constraint: only Node builtins may be imported at
 * runtime; @cline/* packages are host-provided and referenced in JSDoc only.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const BOOTSTRAP_PATH = path.resolve(PLUGIN_DIR, "../../bootstrap.md");

// Module-level cache: bootstrap.md does not change during a session, so read
// it once. undefined = not yet loaded, null = missing/unreadable.
let _bootstrapCache;

function getBootstrapContent() {
  if (_bootstrapCache !== undefined) return _bootstrapCache;
  try {
    _bootstrapCache = fs.readFileSync(BOOTSTRAP_PATH, "utf8");
  } catch {
    _bootstrapCache = null;
  }
  return _bootstrapCache;
}

// Pick a key that is stable across the skip and the re-submit. conversationId
// is the natural choice; fall back to agentId, then a fixed key. Any
// consistent key preserves deny-once safety.
function conversationKey(context) {
  const snapshot = context?.snapshot;
  const raw = snapshot?.conversationId ?? snapshot?.agentId ?? "fallback";
  // Sanitize to a safe, bounded filename component (mirrors the bash hooks).
  return String(raw)
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .slice(0, 128);
}

function markerPath(context) {
  return path.join(
    process.env.SLOW_POWERS_PLAN_GATE_DIR ?? os.tmpdir(),
    `slow-powers-plan-gate-${conversationKey(context)}`,
  );
}

const SKIP_REASON =
  "A plan is about to be presented. Before it leaves your hands, use the " +
  "hardening-plans skill to review the plan file as a skeptical executor, " +
  "then call switch_to_act_mode again to present the hardened plan.";

/** @type {import("@cline/sdk").AgentPlugin} */
const SlowPowersPlugin = {
  name: "slow-powers",
  manifest: {
    capabilities: ["hooks", "rules"],
  },

  setup(api) {
    const bootstrap = getBootstrapContent();
    if (!bootstrap) return;
    api.registerRule({
      id: "slow-powers/bootstrap",
      source: "slow-powers",
      content: bootstrap,
    });
  },

  hooks: {
    beforeTool(context) {
      try {
        // The runtime passes both `tool` (the AgentTool definition) and
        // `toolCall` (the pending call). First-party guards read `tool.name`;
        // the plugin docs read `toolCall.name`. Accept either shape.
        const toolName = context?.tool?.name ?? context?.toolCall?.name;
        if (toolName !== "switch_to_act_mode") return undefined;

        const marker = markerPath(context);
        if (fs.existsSync(marker)) {
          // Re-submission after hardening — let the plan be presented.
          return undefined;
        }

        // First switch_to_act_mode this conversation: record it, then skip
        // once to insert the hardening-plans beat. Best-effort marker write —
        // a failed write must not break the gate (fail-open below covers it).
        try {
          fs.writeFileSync(marker, "");
        } catch {
          // Ignore: worst case the gate fires again on the next attempt.
        }

        return { skip: true, reason: SKIP_REASON };
      } catch {
        // Fail open: a plugin error must never block the user's workflow.
        return undefined;
      }
    },
  },
};

export default SlowPowersPlugin;
