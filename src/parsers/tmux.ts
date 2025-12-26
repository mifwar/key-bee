import type { Keybinding } from "./types.js"

function normalizeTmuxKeys(keys: string, prefix: boolean): string {
  let raw = keys.trim()
  const parts: string[] = []
  let sawShift = false

  if (prefix) {
    parts.push("prefix")
  }

  while (/^[cCmsS]-/.test(raw)) {
    if (/^c-/.test(raw)) {
      parts.push("ctrl")
    } else if (/^m-/.test(raw)) {
      parts.push("alt")
    } else if (/^s-/.test(raw)) {
      parts.push("shift")
      sawShift = true
    }
    raw = raw.slice(2)
  }

  const rawKey = raw.trim()
  if (!sawShift && rawKey.length === 1 && /[A-Z]/.test(rawKey)) {
    parts.push("shift")
  }

  parts.push(rawKey.toLowerCase())
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
