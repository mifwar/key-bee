import type { Keybinding } from "./types.js"

function normalizeTmuxKeys(keys: string, prefix: boolean): string {
  let normalized = keys.toLowerCase()
  const parts: string[] = []

  if (prefix) {
    parts.push("prefix")
  }

  if (normalized.includes("c-")) {
    parts.push("ctrl")
    normalized = normalized.replace("c-", "")
  }
  if (normalized.includes("m-")) {
    parts.push("alt")
    normalized = normalized.replace("m-", "")
  }
  if (normalized.includes("s-")) {
    parts.push("shift")
    normalized = normalized.replace("s-", "")
  }

  parts.push(normalized.trim())
  return parts.join("+")
}

export function parseTmuxConf(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  const lines = content.split("\n")
  let id = 0
  let prefix = "C-a"

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const prefixMatch = trimmed.match(/^set\s+-g\s+prefix\s+(\S+)/)
    if (prefixMatch) {
      prefix = prefixMatch[1]
      continue
    }

    const bindMatch = trimmed.match(/^bind(?:-key)?\s+(?:-r\s+)?(?:-T\s+(\S+)\s+)?([^\s]+)\s+(.+)$/)
    if (!bindMatch) continue

    const [, table, key, action] = bindMatch
    const mode = table || "prefix"
    const usePrefix = mode === "prefix"
    const displayKeys = usePrefix ? `${prefix} ${key}` : key
    const normalizedKeys = normalizeTmuxKeys(key, usePrefix)

    let description = action
    if (action.includes("split-window")) description = "Split pane"
    else if (action.includes("resize-pane")) description = "Resize pane"
    else if (action.includes("select-layout")) description = "Change layout"
    else if (action.includes("swap-window")) description = "Swap windows"
    else if (action.includes("swap-pane")) description = "Swap panes"
    else if (action.includes("last-window")) description = "Go to last window"
    else if (action.includes("source-file")) description = "Reload config"
    else if (action.includes("command-prompt")) description = "Command prompt"
    else if (action.includes("copy-selection")) description = "Copy selection"
    else if (action.includes("begin-selection")) description = "Begin selection"

    bindings.push({
      id: `tmux-${id++}`,
      tool: "tmux",
      keys: displayKeys,
      normalizedKeys,
      action,
      description,
      mode
    })
  }

  return bindings
}
