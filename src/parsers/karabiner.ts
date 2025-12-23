import type { Keybinding } from "./types"

interface KarabinerKey {
  key_code?: string
  modifiers?: {
    mandatory?: string[]
    optional?: string[]
  }
}

interface KarabinerManipulator {
  type: string
  from: KarabinerKey
  to?: Array<{ key_code?: string; shell_command?: string }>
  description?: string
}

interface KarabinerRule {
  description: string
  manipulators: KarabinerManipulator[]
}

interface KarabinerProfile {
  name: string
  complex_modifications?: {
    rules: KarabinerRule[]
  }
}

interface KarabinerConfig {
  profiles: KarabinerProfile[]
}

function formatKey(from: KarabinerKey): string {
  const parts: string[] = []
  
  if (from.modifiers?.mandatory) {
    parts.push(...from.modifiers.mandatory)
  }
  
  if (from.key_code) {
    parts.push(from.key_code)
  }
  
  return parts.join(" + ")
}

function formatAction(to: KarabinerManipulator["to"]): string {
  if (!to || to.length === 0) return "No action"
  
  const actions = to.map(t => {
    if (t.shell_command) return `Shell: ${t.shell_command.slice(0, 30)}...`
    if (t.key_code) return t.key_code
    return "Unknown"
  })
  
  return actions.join(", ")
}

export function parseKarabiner(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  let id = 0

  try {
    const config: KarabinerConfig = JSON.parse(content)
    
    for (const profile of config.profiles) {
      const rules = profile.complex_modifications?.rules || []
      
      for (const rule of rules) {
        for (const manipulator of rule.manipulators) {
          if (manipulator.type !== "basic") continue
          
          const keys = formatKey(manipulator.from)
          if (!keys) continue
          
          bindings.push({
            id: `karabiner-${id++}`,
            tool: "karabiner" as any,
            keys,
            normalizedKeys: keys.toLowerCase().replace(/\s+\+\s+/g, "+"),
            action: formatAction(manipulator.to),
            description: manipulator.description || rule.description,
            mode: profile.name,
          })
        }
      }
    }
  } catch {
    // Invalid JSON, return empty
  }

  return bindings
}
