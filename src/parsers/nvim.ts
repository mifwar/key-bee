import type { Keybinding } from "./types"

function normalizeNvimKeys(keys: string): string {
  let normalized = keys.toLowerCase()
  const parts: string[] = []

  if (normalized.includes("<leader>")) {
    parts.push("leader")
    normalized = normalized.replace("<leader>", "")
  }
  if (normalized.includes("<c-")) {
    parts.push("ctrl")
    normalized = normalized.replace(/<c-([^>]+)>/g, "$1")
  }
  if (normalized.includes("<m-") || normalized.includes("<a-")) {
    parts.push("alt")
    normalized = normalized.replace(/<[ma]-([^>]+)>/g, "$1")
  }
  if (normalized.includes("<s-")) {
    parts.push("shift")
    normalized = normalized.replace(/<s-([^>]+)>/g, "$1")
  }

  normalized = normalized.replace(/<cr>/gi, "enter")
  normalized = normalized.replace(/<esc>/gi, "escape")
  normalized = normalized.replace(/<tab>/gi, "tab")
  normalized = normalized.replace(/<space>/gi, "space")

  parts.push(normalized.trim())
  return parts.join("+")
}

export function parseNvimKeymaps(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  let id = 0

  const keymapRegex = /keymap\.set\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*(?:["']([^"']+)["']|[^,]+)\s*,?\s*(?:\{[^}]*desc\s*=\s*["']([^"']+)["'][^}]*\})?/g

  let match
  while ((match = keymapRegex.exec(content)) !== null) {
    const [, mode, keys, action, desc] = match

    const modeMap: Record<string, string> = {
      n: "normal",
      i: "insert",
      v: "visual",
      x: "visual",
      c: "command",
      t: "terminal",
    }

    bindings.push({
      id: `nvim-${id++}`,
      tool: "nvim",
      keys,
      normalizedKeys: normalizeNvimKeys(keys),
      action: action || "function",
      description: desc || action || "Custom action",
      mode: modeMap[mode] || mode,
    })
  }

  return bindings
}
