export interface Keybinding {
  id: string
  tool: string
  keys: string
  normalizedKeys: string
  action: string
  description?: string
  mode?: string
  sourcePath?: string
}

export interface ConflictGroup {
  normalizedKeys: string
  bindings: Keybinding[]
}
