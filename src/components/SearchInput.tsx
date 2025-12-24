import React from "react"
import { Box, Text } from "ink"

interface Props {
  value: string
  focused: boolean
}

export function SearchInput({ value, focused }: Props) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderBottom
      borderTop={false}
      borderLeft={false}
      borderRight={false}
      borderColor={focused ? "#60a5fa" : "#3b3b3b"}
      paddingLeft={1}
    >
      <Text>
        <Text color="#60a5fa">Search: </Text>
        <Text color="#fff">{value}</Text>
        {focused && <Text color="#60a5fa">|</Text>}
      </Text>
      {focused && (
        <Text>
          <Text color="#6b7280">ESC: cancel</Text>
          <Text color="#3b3b3b"> - </Text>
          <Text color="#6b7280">ENTER: accept</Text>
          <Text color="#3b3b3b"> - </Text>
          <Text color="#6b7280">Backspace: delete</Text>
        </Text>
      )}
    </Box>
  )
}
