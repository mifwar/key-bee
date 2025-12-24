import type { Keybinding } from "./types.js"

export function parseHammerspoon(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  let id = 0

  // Match: hs.hotkey.bind({"cmd", "alt"}, "key", function)
  const hotkeyRegex =
    /hs\.hotkey\.bind\s*\(\s*\{([^}]*)\}\s*,\s*["']([^"']+)["']\s*,\s*(?:["']([^"']+)["']|function|(\w+))/g

  let match
  while ((match = hotkeyRegex.exec(content)) !== null) {
    const [, modifiers, key, description, funcName] = match

    const mods = modifiers
      .split(",")
      .map((m) => m.trim().replace(/["']/g, ""))
      .filter(Boolean)

    const keys = [...mods, key].join(" + ")

    bindings.push({
      id: `hammerspoon-${id++}`,
      tool: "hammerspoon" as any,
      keys,
      normalizedKeys: keys.toLowerCase().replace(/\s+\+\s+/g, "+"),
      action: funcName || "function",
      description: description || funcName || "Hotkey action"
    })
  }

  // Match: hs.hotkey.new(mods, key, fn):enable() pattern
  const hotkeyNewRegex = /hs\.hotkey\.new\s*\(\s*\{([^}]*)\}\s*,\s*["']([^"']+)["']/g

  while ((match = hotkeyNewRegex.exec(content)) !== null) {
    const [, modifiers, key] = match

    const mods = modifiers
      .split(",")
      .map((m) => m.trim().replace(/["']/g, ""))
      .filter(Boolean)

    const keys = [...mods, key].join(" + ")

    bindings.push({
      id: `hammerspoon-${id++}`,
      tool: "hammerspoon" as any,
      keys,
      normalizedKeys: keys.toLowerCase().replace(/\s+\+\s+/g, "+"),
      action: "hotkey",
      description: "Hammerspoon hotkey"
    })
  }

  return bindings
}
