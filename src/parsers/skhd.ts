import type { Keybinding } from "./types.js"

const modifierMap: Record<string, string> = {
  shift: "shift",
  ctrl: "ctrl",
  alt: "alt",
  cmd: "cmd"
}

function normalizeSkhdKeys(keys: string): string {
  const parts = keys.toLowerCase().split(/\s*[\+\-]\s*/)
  const mods: string[] = []
  let key = ""

  for (const part of parts) {
    if (modifierMap[part]) {
      mods.push(modifierMap[part])
    } else {
      key = part
    }
  }

  mods.sort()
  return [...mods, key].join("+")
}

export function parseSkhdrc(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  const lines = content.split("\n")
  let id = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const match = trimmed.match(/^([^:]+?)\s*:\s*(.+)$/)
    if (!match) continue

    const [, keys, action] = match
    const normalizedKeys = normalizeSkhdKeys(keys.trim())

    let description = action.trim()
    if (action.includes("yabai")) {
      if (action.includes("--focus")) description = "Focus window/display"
      else if (action.includes("--resize")) description = "Resize window"
      else if (action.includes("--swap")) description = "Swap windows"
      else if (action.includes("--toggle")) description = "Toggle window state"
      else if (action.includes("--layout")) description = "Change layout"
      else if (action.includes("--balance")) description = "Balance windows"
      else if (action.includes("--move")) description = "Move window"
      else if (action.includes("--display")) description = "Move to display"
      else if (action.includes("--rotate")) description = "Rotate layout"
      else if (action.includes("--mirror")) description = "Mirror layout"
    } else if (action.includes("cliclick")) {
      if (action.includes("m:")) description = "Move cursor"
      else if (action.includes("dc:")) description = "Double click"
      else if (action.includes("rc:")) description = "Right click"
      else if (action.includes("c:")) description = "Click"
    }

    bindings.push({
      id: `skhd-${id++}`,
      tool: "skhd",
      keys: keys.trim(),
      normalizedKeys,
      action: action.trim(),
      description
    })
  }

  return bindings
}
