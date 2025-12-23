export interface Keybinding {
  id: string
  tool: "skhd" | "tmux" | "nvim" | "yabai"
  keys: string
  normalizedKeys: string
  action: string
  description?: string
  mode?: string
}

export interface ConflictGroup {
  normalizedKeys: string
  bindings: Keybinding[]
}
