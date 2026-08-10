// Behavioral tests for the cline/plugins/slow-powers.js Cline plugin.
// The plugin registers bootstrap.md as a session rule and gates the first
// switch_to_act_mode call of each conversation on hardening-plans. We import
// the real plugin module and drive it with fake api/hook contexts, with an
// isolated marker dir so its marker files never touch the developer's real
// temp dir (mirrors the TMPDIR isolation in exit-plan-mode-hook.test.ts).
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BOOTSTRAP_MARKER, REPO_ROOT } from "./spec";

const PLUGIN_PATH = path.join(REPO_ROOT, "cline/plugins/slow-powers.js");

// The subset of the AgentPlugin surface this plugin implements. Typed
// locally so the test stays honest about the contract it exercises without
// pulling @cline/sdk into the typecheck graph.
interface RuleContribution {
  id: string;
  source?: string;
  content: string;
}

interface FakeApi {
  registerRule: (rule: RuleContribution) => void;
}

interface ToolCallPart {
  type: "tool-call";
  toolCallId?: string;
  toolName?: string;
  input?: unknown;
}

interface TextPart {
  type: "text";
  text?: string;
}

interface ToolResultPart {
  type: "tool-result";
  toolCallId?: string;
  toolName?: string;
  output?: unknown;
  isError?: boolean;
}

interface FakeMessage {
  role?: string;
  content?: (ToolCallPart | TextPart | ToolResultPart)[] | string;
}

interface HookContext {
  tool?: { name?: string };
  toolCall?: { name?: string; input?: unknown };
  snapshot?: {
    conversationId?: string;
    agentId?: string;
    messages?: FakeMessage[];
  };
}

interface BeforeToolResult {
  skip?: boolean;
  reason?: string;
}

interface ClinePlugin {
  name: string;
  manifest: { capabilities: string[] };
  setup?: (api: FakeApi) => void;
  hooks?: {
    beforeTool?: (context: HookContext) => BeforeToolResult | undefined;
  };
}

// Computed (non-literal) specifier: bun resolves it at runtime, tsc treats
// the module as `any` and doesn't try to type-resolve the .js file.
const plugin = (await import(PLUGIN_PATH)).default as ClinePlugin;

function beforeTool(context: HookContext): BeforeToolResult | undefined {
  return plugin.hooks?.beforeTool?.(context);
}

// Mirrors the runtime's hook invocation shape: {snapshot, tool, toolCall,
// input} — with the tool definition carrying the canonical name.
const planContext = (conversationId?: string): HookContext => ({
  tool: { name: "switch_to_act_mode" },
  toolCall: { name: "switch_to_act_mode", input: {} },
  snapshot: { conversationId },
});

let markerDir: string;
let prevGateDir: string | undefined;

beforeEach(() => {
  markerDir = fs.mkdtempSync(path.join(os.tmpdir(), "cline-plugin-test-"));
  prevGateDir = process.env.SLOW_POWERS_PLAN_GATE_DIR;
  process.env.SLOW_POWERS_PLAN_GATE_DIR = markerDir;
});

afterEach(() => {
  if (prevGateDir === undefined) delete process.env.SLOW_POWERS_PLAN_GATE_DIR;
  else process.env.SLOW_POWERS_PLAN_GATE_DIR = prevGateDir;
  fs.rmSync(markerDir, { recursive: true, force: true });
});

function markers(): string[] {
  return fs
    .readdirSync(markerDir)
    .filter((f) => f.startsWith("slow-powers-plan-gate-"));
}

describe("cline plugin module", () => {
  test("exports an AgentPlugin-shaped object", () => {
    expect(plugin.name).toBe("slow-powers");
    expect(plugin.manifest.capabilities).toContain("hooks");
    expect(plugin.manifest.capabilities).toContain("rules");
    expect(typeof plugin.setup).toBe("function");
    expect(typeof plugin.hooks?.beforeTool).toBe("function");
  });

  test("setup registers bootstrap.md and the plan-presentation rule", () => {
    const registered: RuleContribution[] = [];
    plugin.setup?.({ registerRule: (rule) => registered.push(rule) });

    expect(registered.length).toBe(2);
    expect(registered[0].id).toBe("slow-powers/bootstrap");
    expect(registered[0].source).toBe("slow-powers");
    expect(registered[0].content).toContain(BOOTSTRAP_MARKER);

    // The second rule is the pre-presentation half of the plan gate: it is the
    // only mechanism that reaches the agent before a plan is shown, so it must
    // demand hardening-plans before presentation.
    expect(registered[1].id).toBe("slow-powers/plan-presentation");
    expect(registered[1].source).toBe("slow-powers");
    expect(registered[1].content).toContain("hardening-plans");
    expect(registered[1].content.toLowerCase()).toContain("before");
    expect(registered[1].content.toLowerCase()).toContain("present");
  });
});

describe("cline plugin plan gate", () => {
  test("skips the first switch_to_act_mode and points at hardening-plans", () => {
    const result = beforeTool(planContext("conv-A"));

    expect(result?.skip).toBe(true);
    expect(result?.reason).toContain("hardening-plans");
    expect(markers()).toEqual(["slow-powers-plan-gate-conv-A"]);
  });

  test("allows the re-submitted call (marker present, same conversation)", () => {
    expect(beforeTool(planContext("conv-B"))?.skip).toBe(true);
    expect(beforeTool(planContext("conv-B"))).toBeUndefined();
  });

  test("treats distinct conversations independently", () => {
    beforeTool(planContext("conv-C")); // first call for C -> skip + marker
    // D has never been seen, even though C's marker exists in the same dir.
    expect(beforeTool(planContext("conv-D"))?.skip).toBe(true);
  });

  test("ignores unrelated tools entirely", () => {
    const result = beforeTool({
      tool: { name: "read_files" },
      toolCall: { name: "read_files", input: {} },
      snapshot: { conversationId: "conv-E" },
    });

    expect(result).toBeUndefined();
    expect(markers()).toEqual([]);
  });

  test("fires when only the toolCall carries the name (docs shape)", () => {
    const result = beforeTool({
      toolCall: { name: "switch_to_act_mode", input: {} },
      snapshot: { conversationId: "conv-toolCall-only" },
    });

    expect(result?.skip).toBe(true);
    expect(markers()).toEqual(["slow-powers-plan-gate-conv-toolCall-only"]);
  });

  test("still denies-once when conversationId is absent (no crash)", () => {
    expect(beforeTool(planContext())?.skip).toBe(true);
    expect(beforeTool(planContext())).toBeUndefined();
  });

  test("fails open on malformed contexts", () => {
    expect(beforeTool({})).toBeUndefined();
    expect(
      beforeTool({ snapshot: { conversationId: "conv-F" } }),
    ).toBeUndefined();
    expect(beforeTool({ toolCall: {} })).toBeUndefined();
  });
});

// Mirrors the runtime's assistant-message shape for a skills-tool invocation.
function skillsCallMessage(skill: string): FakeMessage {
  return {
    role: "assistant",
    content: [
      {
        type: "tool-call",
        toolCallId: "call_skills_1",
        toolName: "skills",
        input: { skill },
      },
    ],
  };
}

const switchContext = (
  conversationId: string,
  messages?: FakeMessage[],
): HookContext => ({
  tool: { name: "switch_to_act_mode" },
  toolCall: { name: "switch_to_act_mode", input: {} },
  snapshot: { conversationId, messages },
});

describe("cline plugin already-hardened short-circuit", () => {
  test("allows switch_to_act_mode when hardening-plans was invoked (bare name)", () => {
    const result = beforeTool(
      switchContext("conv-H1", [skillsCallMessage("hardening-plans")]),
    );

    expect(result).toBeUndefined();
    // No marker needed: the transcript itself is the proof.
    expect(markers()).toEqual([]);
  });

  test("allows it for the namespaced skill name too", () => {
    const result = beforeTool(
      switchContext("conv-H2", [
        skillsCallMessage("slow-powers:hardening-plans"),
      ]),
    );

    expect(result).toBeUndefined();
    expect(markers()).toEqual([]);
  });

  test("full flow: skip un-hardened, allow after the agent hardens and retries", () => {
    expect(beforeTool(switchContext("conv-flow"))?.skip).toBe(true);
    expect(
      beforeTool(
        switchContext("conv-flow", [skillsCallMessage("hardening-plans")]),
      ),
    ).toBeUndefined();
  });

  test("does not false-positive on prose mentions of the skill", () => {
    // A prior skip reason lands in the transcript as tool output and mentions
    // "hardening-plans" in prose. Only the skills tool-input shape may count,
    // mirroring hooks/exit-plan-mode's false-positive guard.
    const result = beforeTool(
      switchContext("conv-H3", [
        {
          role: "assistant",
          content: [
            { type: "text", text: "you must use the hardening-plans skill" },
          ],
        },
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "call_x",
              toolName: "switch_to_act_mode",
              output: "use the hardening-plans skill first",
              isError: true,
            },
          ],
        },
      ]),
    );

    expect(result?.skip).toBe(true);
  });

  test("does not false-positive on other skills invocations", () => {
    const result = beforeTool(
      switchContext("conv-H4", [skillsCallMessage("working-with-tdd")]),
    );

    expect(result?.skip).toBe(true);
  });
});
