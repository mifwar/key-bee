import type { ConflictGroup } from "../parsers"

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
  conflicts: ConflictGroup[]
  selectedIndex: number
  scrollOffset: number
  maxVisible: number
}

export function ConflictView({ conflicts, selectedIndex, scrollOffset, maxVisible }: Props) {
  if (conflicts.length === 0) {
    return (
      <box paddingLeft={2} paddingTop={1}>
        <text>
          <span fg="#22c55e">No conflicts detected across tools!</span>
        </text>
      </box>
    )
  }

  const visibleConflicts = conflicts.slice(scrollOffset, scrollOffset + maxVisible)

  return (
    <box flexDirection="column" gap={1}>
      {visibleConflicts.map((conflict, i) => {
        const actualIndex = scrollOffset + i
        const isSelected = actualIndex === selectedIndex

        return (
          <box
            key={conflict.normalizedKeys}
            flexDirection="column"
            border
            borderStyle="single"
            borderColor={isSelected ? "#ef4444" : "#3b3b3b"}
            padding={1}
          >
            <text>
              <span fg="#ef4444">CONFLICT: </span>
              <span fg="#fbbf24">{conflict.normalizedKeys}</span>
              <span fg="#6b7280"> ({conflict.bindings.length} bindings)</span>
            </text>
            <box flexDirection="column" paddingTop={1}>
              {conflict.bindings.map((binding) => (
                <box key={binding.id} flexDirection="row" gap={2}>
                  <text>
                    <span fg={getToolColor(binding.tool)}>{binding.tool.padEnd(5)}</span>
                  </text>
                  <text>
                    <span fg="#a1a1aa">{binding.keys}</span>
                  </text>
                  <text>
                    <span fg="#6b7280">- {binding.description || binding.action}</span>
                  </text>
                </box>
              ))}
            </box>
          </box>
        )
      })}
    </box>
  )
}
