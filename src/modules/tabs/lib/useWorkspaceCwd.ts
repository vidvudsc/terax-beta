import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Tab } from "./useTabs";

type Result = {
  explorerRoot: string | null;
  inheritedCwdForNewTab: () => string | undefined;
  inheritedCwdForNewTabHere: () => string | undefined;
};

export function useWorkspaceCwd(
  activeTab: Tab | undefined,
  tabs: Tab[],
  home: string | null,
  newTabCwd: string,
): Result {
  const lastTerminalCwd = useRef<string | null>(null);

  useEffect(() => {
    if (activeTab?.kind === "terminal" && activeTab.cwd) {
      lastTerminalCwd.current = activeTab.cwd;
    }
  }, [activeTab]);

  const explorerRoot = useMemo<string | null>(() => {
    if (activeTab?.kind === "terminal" && activeTab.cwd) return activeTab.cwd;
    if (lastTerminalCwd.current) return lastTerminalCwd.current;
    const anyTerm = tabs.find((t) => t.kind === "terminal" && t.cwd);
    if (anyTerm?.kind === "terminal" && anyTerm.cwd) return anyTerm.cwd;
    return home;
  }, [activeTab, tabs, home]);

  const inheritedCwdForNewTab = useCallback((): string | undefined => {
    const configured = newTabCwd.trim();
    if (configured) {
      if (configured.startsWith("~") && home) {
        return `${home}${configured.slice(1)}`;
      }
      return configured;
    }
    if (activeTab?.kind === "terminal" && activeTab.cwd) return activeTab.cwd;
    // Editor tabs inherit the last terminal's cwd (or workspace home), not
    // the file's folder — opening a new terminal from a file shouldn't
    // hijack the user's working directory context.
    return lastTerminalCwd.current ?? home ?? undefined;
  }, [activeTab, home, newTabCwd]);

  const inheritedCwdForNewTabHere = useCallback((): string | undefined => {
    if (activeTab?.kind === "terminal" && activeTab.cwd) return activeTab.cwd;
    return lastTerminalCwd.current ?? home ?? undefined;
  }, [activeTab, home]);

  return { explorerRoot, inheritedCwdForNewTab, inheritedCwdForNewTabHere };
}
