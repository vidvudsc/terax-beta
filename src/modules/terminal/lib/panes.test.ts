import { describe, expect, it } from "vitest";
import { graftSubtree, leafIds, type PaneNode } from "./panes";

const leaf = (id: number, cwd?: string): PaneNode => ({ kind: "leaf", id, cwd });
const split = (id: number, dir: "row" | "col", children: PaneNode[]): PaneNode => ({
  kind: "split",
  id,
  dir,
  children,
});

describe("graftSubtree", () => {
  it("wraps a lone leaf and the subtree in a new split", () => {
    const tree = leaf(1);
    const out = graftSubtree(tree, 1, 99, leaf(2), "row");
    expect(out).toEqual(split(99, "row", [leaf(1), leaf(2)]));
  });

  it("preserves the grafted subtree's leaf ids", () => {
    const source = split(10, "col", [leaf(11), leaf(12)]);
    const out = graftSubtree(leaf(1), 1, 99, source, "row");
    expect(leafIds(out)).toEqual([1, 11, 12]);
  });

  it("appends as sibling inside an existing same-direction split", () => {
    const tree = split(5, "row", [leaf(1), leaf(2)]);
    const out = graftSubtree(tree, 1, 99, leaf(3), "row");
    expect(out).toEqual(split(5, "row", [leaf(1), leaf(3), leaf(2)]));
  });

  it("flattens a same-direction subtree instead of nesting it", () => {
    const tree = split(5, "row", [leaf(1), leaf(2)]);
    const source = split(10, "row", [leaf(11), leaf(12)]);
    const out = graftSubtree(tree, 2, 99, source, "row");
    expect(out).toEqual(
      split(5, "row", [leaf(1), leaf(2), leaf(11), leaf(12)]),
    );
  });

  it("flattens a same-direction subtree when splitting a lone leaf", () => {
    const source = split(10, "col", [leaf(11), leaf(12)]);
    const out = graftSubtree(leaf(1), 1, 99, source, "col");
    expect(out).toEqual(split(99, "col", [leaf(1), leaf(11), leaf(12)]));
  });

  it("nests a cross-direction subtree under a new split", () => {
    const tree = split(5, "row", [leaf(1), leaf(2)]);
    const source = split(10, "row", [leaf(11), leaf(12)]);
    const out = graftSubtree(tree, 2, 99, source, "col");
    expect(out).toEqual(
      split(5, "row", [leaf(1), split(99, "col", [leaf(2), source])]),
    );
  });

  it("returns the tree unchanged when the target leaf is absent", () => {
    const tree = split(5, "row", [leaf(1), leaf(2)]);
    const out = graftSubtree(tree, 42, 99, leaf(3), "row");
    expect(out).toEqual(tree);
  });
});
