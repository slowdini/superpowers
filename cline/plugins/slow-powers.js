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
 * 2. PLAN GATE — in Cline, presenting a plan is a free-form assistant message:
 *    the agent shows the plan, ends its turn, the user approves in a follow-up
 *    message, and ONLY THEN does the agent call switch_to_act_mode (the CLI's
 *    own plan-mode prompt and the tool description mandate that order). So,
 *    unlike Claude Code — where the plan text rides inside the ExitPlanMode
 *    call and a PreToolUse deny lands before the user ever sees the plan —
 *    there is NO hook moment in Cline that precedes plan presentation. The
 *    gate therefore works in two layers:
 *
 *    a. PRE-PRESENTATION (rule): the plan-presentation rule registered below
 *       tells plan-mode agents to run hardening-plans on a draft BEFORE
 *       presenting it. A rule is the only mechanism that reaches the agent
 *       before a plan is shown.
 *    b. PRE-EXECUTION (hook): the first switch_to_act_mode call of a
 *       conversation whose transcript shows no hardening-plans invocation is
 *       skipped with an instruction to harden, re-present the hardened plan,
 *       and retry. This is the deterministic backstop: an un-hardened plan can
 *       never be executed even if the agent skipped the rule.
 *
 * ALREADY-HARDENED SHORT-CIRCUIT: when the rule was followed, the transcript
 * already holds a skills tool call for hardening-plans, and the hook lets the
 * switch through with no beat (parity with hooks/exit-plan-mode, issue #153).
 * Detection matches the tool-input shape only, never prose, so this hook's own
 * skip reason in the transcript cannot false-positive.
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
  "Plan execution is gated. This conversation has not run the hardening-plans " +
  "skill on the plan yet, so the plan must not be executed as-is. Use the " +
  "hardening-plans skill to review the plan as a skeptical executor and fix " +
  "its findings, present the hardened plan to the user, and call " +
  "switch_to_act_mode again once they approve it.";

// Pre-presentation half of the plan gate. Cline offers no hook moment before a
// plan is shown (presentation is a free-form assistant message), so this rule
// is what puts the hardening beat ahead of presentation; the switch_to_act_mode
// hook below is the deterministic backstop.
const PLAN_PRESENTATION_RULE =
  "Plan-mode discipline: when you are working in plan mode, never present a " +
  "drafted plan to the user until you have invoked the hardening-plans skill " +
  "on it and applied its findings — a plan reaches the user hardened or not " +
  "at all. The switch_to_act_mode tool is gated the same way: if it is " +
  "skipped with a hardening instruction, run hardening-plans on the plan, " +
  "present the hardened plan, and wait for approval before calling " +
  "switch_to_act_mode again.";

// Already-hardened short-circuit (parity with hooks/exit-plan-mode, issue
// #153): if the agent ran hardening-plans this conversation, the transcript
// holds a skills tool call whose input names the skill. Match that tool-input
// shape ONLY — never prose — so this hook's own skip reason (which mentions
// "hardening-plans" and lands in the transcript as tool output) can never
// false-positive. Any missing/odd shape falls through to deny-once below.
function planAlreadyHardened(context) {
  const messages = context?.snapshot?.messages;
  if (!Array.isArray(messages)) return false;
  for (const message of messages) {
    const content = message?.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part?.type !== "tool-call" || part?.toolName !== "skills") continue;
      const input = part.input;
      const skill =
        input && typeof input === "object" ? input.skill : undefined;
      if (typeof skill === "string" && skill.includes("hardening-plans")) {
        return true;
      }
    }
  }
  return false;
}

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
    api.registerRule({
      id: "slow-powers/plan-presentation",
      source: "slow-powers",
      content: PLAN_PRESENTATION_RULE,
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

        // The agent already hardened the plan this conversation — let the
        // approved plan be executed with no redundant beat.
        if (planAlreadyHardened(context)) return undefined;

        const marker = markerPath(context);
        if (fs.existsSync(marker)) {
          // Re-submission after the skip-once beat — let it through.
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
