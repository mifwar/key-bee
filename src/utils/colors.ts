export const BUILTIN_TOOL_COLORS: Record<string, string> = {
  skhd: "#f97316",
  tmux: "#22c55e",
  nvim: "#3b82f6",
  "nvim-keymap": "#3b82f6",
  yabai: "#a855f7",
  karabiner: "#ec4899",
  zsh: "#06b6d4",
  "zsh-alias": "#06b6d4",
  hammerspoon: "#8b5cf6"
}

export const DEFAULT_TOOL_COLOR = "#888888"

export function getToolColor(tool: string, customColors?: Record<string, string>): string {
  if (customColors?.[tool]) {
    return customColors[tool]
  }
  return BUILTIN_TOOL_COLORS[tool] || DEFAULT_TOOL_COLOR
}
