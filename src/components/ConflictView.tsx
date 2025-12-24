import React from "react"
import { Box, Text } from "ink"
import type { ConflictGroup } from "../parsers/index.js"
import { getToolColor } from "../utils/colors.js"

interface Props {
  conflicts: ConflictGroup[]
  selectedIndex: number
  scrollOffset: number
  maxVisible: number
  customColors?: Record<string, string>
}

export function ConflictView({
  conflicts,
  selectedIndex,
  scrollOffset,
  maxVisible,
  customColors
}: Props) {
  if (conflicts.length === 0) {
    return (
      <Box paddingLeft={2} marginTop={1}>
        <Text color="#22c55e">No conflicts detected across tools!</Text>
      </Box>
    )
  }

  const visibleConflicts = conflicts.slice(scrollOffset, scrollOffset + maxVisible)

  return (
    <Box flexDirection="column" gap={1}>
      {visibleConflicts.map((conflict, i) => {
        const actualIndex = scrollOffset + i
        const isSelected = actualIndex === selectedIndex

        return (
          <Box
            key={conflict.normalizedKeys}
            flexDirection="column"
            borderStyle="single"
            borderColor={isSelected ? "#ef4444" : "#3b3b3b"}
            padding={1}
          >
            <Text>
              <Text color="#ef4444">CONFLICT: </Text>
              <Text color="#fbbf24">{conflict.normalizedKeys}</Text>
              <Text color="#6b7280"> ({conflict.bindings.length} bindings)</Text>
            </Text>
            <Box flexDirection="column" marginTop={1}>
              {conflict.bindings.map((binding) => (
                <Box key={binding.id} flexDirection="row" gap={2}>
                  <Text color={getToolColor(binding.tool, customColors)}>
                    {binding.tool.padEnd(5)}
                  </Text>
                  <Text color="#a1a1aa">{binding.keys}</Text>
                  <Text color="#6b7280">- {binding.description || binding.action}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
