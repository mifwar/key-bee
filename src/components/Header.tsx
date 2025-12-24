import React from "react"
import { Box, Text } from "ink"

interface Props {
  activeTab: string
  tabs: string[]
  totalBindings: number
  conflictCount: number
}

export function Header({ activeTab, tabs, totalBindings, conflictCount }: Props) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor="#3b3b3b"
    >
      <Box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
        <Text>
          <Text color="#60a5fa">Key Bee</Text>
          <Text color="#6b7280"> | </Text>
          <Text color="#a1a1aa">{totalBindings} bindings</Text>
          {conflictCount > 0 && (
            <>
              <Text color="#6b7280"> | </Text>
              <Text color="#ef4444">{conflictCount} conflicts</Text>
            </>
          )}
        </Text>
        <Text color="#6b7280">q: quit | /: search | tab: switch view</Text>
      </Box>
      <Box flexDirection="row" gap={2} paddingLeft={1} marginTop={1}>
        {tabs.map((tab) => (
          <Text
            key={tab}
            color={activeTab === tab ? "#000" : "#a1a1aa"}
            backgroundColor={activeTab === tab ? "#60a5fa" : undefined}
          >
            {` ${tab} `}
          </Text>
        ))}
      </Box>
    </Box>
  )
}
