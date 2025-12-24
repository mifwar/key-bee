import type { Keybinding } from "./types.js"

export function parseZshAliases(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  const lines = content.split("\n")
  let id = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    // Match: alias name="command" or alias name='command'
    const aliasMatch = trimmed.match(/^alias\s+([^=]+)=["'](.+)["']/)
    if (aliasMatch) {
      const [, name, command] = aliasMatch
      bindings.push({
        id: `zsh-alias-${id++}`,
        tool: "zsh" as any,
        keys: name.trim(),
        normalizedKeys: name.trim().toLowerCase(),
        action: command,
        description: `Alias: ${command.slice(0, 50)}${command.length > 50 ? "..." : ""}`
      })
      continue
    }

    // Match: bindkey "^X" command
    const bindkeyMatch = trimmed.match(/^bindkey\s+["']([^"']+)["']\s+(\S+)/)
    if (bindkeyMatch) {
      const [, keys, action] = bindkeyMatch
      bindings.push({
        id: `zsh-bindkey-${id++}`,
        tool: "zsh" as any,
        keys,
        normalizedKeys: keys.toLowerCase(),
        action,
        description: action
      })
    }
  }

  return bindings
}
