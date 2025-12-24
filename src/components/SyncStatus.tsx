import React from "react"
import { Box, Text } from "ink"

interface Props {
  lastSync: string | null
  changedFiles: number
  isSyncing: boolean
  syncMessage: string | null
}

export function SyncStatus({ lastSync, changedFiles, isSyncing, syncMessage }: Props) {
  const formatTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleTimeString()
  }

  return (
    <Box flexDirection="row" gap={2}>
      {syncMessage ? (
        <Text color="#22c55e">{syncMessage}</Text>
      ) : isSyncing ? (
        <Text color="#fbbf24">Syncing...</Text>
      ) : (
        <>
          {lastSync && <Text color="#6b7280">Last sync: {formatTime(lastSync)}</Text>}
          {changedFiles > 0 && (
            <Text color="#f97316">{changedFiles} file(s) changed - press 's' to sync</Text>
          )}
        </>
      )}
    </Box>
  )
}
