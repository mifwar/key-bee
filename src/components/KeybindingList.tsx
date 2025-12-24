import React from "react"
import { Box, Text } from "ink"
import type { Keybinding } from "../parsers/index.js"
import { getToolColor } from "../utils/colors.js"

interface Props {
  bindings: Keybinding[]
  selectedIndex: number
  scrollOffset: number
  maxVisible: number
  customColors?: Record<string, string>
}

export function KeybindingList({
  bindings,
  selectedIndex,
  scrollOffset,
  maxVisible,
  customColors
}: Props) {
  const visibleBindings = bindings.slice(scrollOffset, scrollOffset + maxVisible)

  return (
    <Box flexDirection="column">
      {visibleBindings.map((binding, i) => {
        const actualIndex = scrollOffset + i
        const isSelected = actualIndex === selectedIndex
        const toolColor = getToolColor(binding.tool, customColors)

        return (
          <Box key={binding.id} flexDirection="row" paddingLeft={1} paddingRight={1}>
            <Box width={6}>
              <Text color={toolColor} backgroundColor={isSelected ? "#3b3b3b" : undefined}>
                {binding.tool.toUpperCase().padEnd(5)}
              </Text>
            </Box>
            <Box width={25}>
              <Text color="#fbbf24" backgroundColor={isSelected ? "#3b3b3b" : undefined}>
                {binding.keys.padEnd(24)}
              </Text>
            </Box>
            <Box flexGrow={1}>
              <Text
                color={isSelected ? "#fff" : "#a1a1aa"}
                backgroundColor={isSelected ? "#3b3b3b" : undefined}
              >
                {binding.description || binding.action}
              </Text>
            </Box>
            {binding.mode && (
              <Box width={10}>
                <Text color="#6b7280" backgroundColor={isSelected ? "#3b3b3b" : undefined}>
                  [{binding.mode}]
                </Text>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
