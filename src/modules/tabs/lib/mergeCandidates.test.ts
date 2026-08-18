import { describe, expect, it } from "vitest";
import type { PaneNode } from "@/modules/terminal/lib/panes";
import { mergeCandidates, type Tab, type TerminalTab } from "./useTabs";

let nextId = 100;
function term(
  id: number,
  spaceId = "default",
  extra: Partial<TerminalTab> = {},
  leaves = 1,
): TerminalTab {
  let paneTree: PaneNode = { kind: "leaf", id: nextId++ };
  if (leaves > 1) {
    paneTree = {
      kind: "split",
      id: nextId++,
      dir: "row",
      children: Array.from({ length: leaves }, () => ({
        kind: "leaf" as const,
        id: nextId++,
      })),
    };
  }
  return {
    id,
    kind: "terminal",
    spaceId,
    title: `t${id}`,
    paneTree,
    activeLeafId: paneTree.kind === "leaf" ? paneTree.id : paneTree.children[0].id,
    ...extra,
  };
}

describe("mergeCandidates", () => {
  it("orders candidates starting after the target, wrapping", () => {
    const tabs: Tab[] = [term(1), term(2), term(3)];
    expect(mergeCandidates(tabs, 2).map((t) => t.id)).toEqual([3, 1]);
  });

  it("excludes other spaces, blocks, and mismatched privacy", () => {
    const tabs: Tab[] = [
      term(1),
      term(2, "other"),
      term(3, "default", { blocks: true }),
      term(4, "default", { private: true }),
      term(5),
    ];
    expect(mergeCandidates(tabs, 1).map((t) => t.id)).toEqual([5]);
  });

  it("excludes tabs that would exceed the pane limit", () => {
    const tabs: Tab[] = [term(1, "default", {}, 2), term(2, "default", {}, 3), term(3)];
    expect(mergeCandidates(tabs, 1).map((t) => t.id)).toEqual([3]);
  });

  it("returns nothing for a non-terminal or blocks target", () => {
    const tabs: Tab[] = [term(1, "default", { blocks: true }), term(2)];
    expect(mergeCandidates(tabs, 1)).toEqual([]);
    expect(mergeCandidates(tabs, 42)).toEqual([]);
  });
});
