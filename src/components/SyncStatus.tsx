interface Props {
  lastSync: string | null
  changedFiles: number
  issyncing: boolean
}

export function SyncStatus({ lastSync, changedFiles, issyncing }: Props) {
  const formatTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleTimeString()
  }

  return (
    <box flexDirection="row" gap={2}>
      {issyncing ? (
        <text>
          <span fg="#fbbf24">Syncing...</span>
        </text>
      ) : (
        <>
          {lastSync && (
            <text>
              <span fg="#6b7280">Last sync: {formatTime(lastSync)}</span>
            </text>
          )}
          {changedFiles > 0 && (
            <text>
              <span fg="#f97316">{changedFiles} file(s) changed - press 's' to sync</span>
            </text>
          )}
        </>
      )}
    </box>
  )
}
