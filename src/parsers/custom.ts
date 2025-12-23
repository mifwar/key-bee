import type { Keybinding } from "./types"
import type { CustomParserConfig } from "../config/types"

export function parseCustomConfig(
  content: string,
  config: CustomParserConfig
): Keybinding[] {
  const bindings: Keybinding[] = []
  const lines = content.split("\n")
  const regex = new RegExp(config.pattern)
  const commentPrefix = config.commentPrefix || "#"
  let id = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(commentPrefix)) continue

    const match = trimmed.match(regex)
    if (!match) continue

    const keys = match[config.keyGroup] || ""
    const action = match[config.actionGroup] || ""
    const description = config.descriptionGroup ? match[config.descriptionGroup] : undefined
    const mode = config.modeGroup ? match[config.modeGroup] : undefined

    if (!keys) continue

    bindings.push({
      id: `${config.name}-${id++}`,
      tool: config.name as any,
      keys,
      normalizedKeys: keys.toLowerCase().replace(/\s+/g, "+"),
      action,
      description: description || action,
      mode,
    })
  }

  return bindings
}
