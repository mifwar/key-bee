import type { Keybinding } from "../parsers"

const toolColors: Record<string, string> = {
  skhd: "#f97316",
  tmux: "#22c55e",
  nvim: "#3b82f6",
  yabai: "#a855f7",
  karabiner: "#ec4899",
  zsh: "#06b6d4",
  hammerspoon: "#8b5cf6",
}

function getToolColor(tool: string): string {
  return toolColors[tool] || "#888888"
}

interface Props {
  bindings: Keybinding[]
  selectedIndex: number
  scrollOffset: number
  maxVisible: number
}

export function KeybindingList({ bindings, selectedIndex, scrollOffset, maxVisible }: Props) {
  const visibleBindings = bindings.slice(scrollOffset, scrollOffset + maxVisible)

  return (
    <box flexDirection="column" gap={0}>
      {visibleBindings.map((binding, i) => {
        const actualIndex = scrollOffset + i
        const isSelected = actualIndex === selectedIndex
        const toolColor = getToolColor(binding.tool)

        return (
          <box
            key={binding.id}
            flexDirection="row"
            backgroundColor={isSelected ? "#3b3b3b" : undefined}
            paddingLeft={1}
            paddingRight={1}
          >
            <box width={6}>
              <text>
                <span fg={toolColor}>{binding.tool.toUpperCase().padEnd(5)}</span>
              </text>
            </box>
            <box width={25}>
              <text>
                <span fg="#fbbf24">{binding.keys.padEnd(24)}</span>
              </text>
            </box>
            <box flexGrow={1}>
              <text>
                <span fg={isSelected ? "#fff" : "#a1a1aa"}>
                  {binding.description || binding.action}
                </span>
              </text>
            </box>
            {binding.mode && (
              <box width={10}>
                <text>
                  <span fg="#6b7280">[{binding.mode}]</span>
                </text>
              </box>
            )}
          </box>
        )
      })}
    </box>
  )
}
