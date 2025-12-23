interface Props {
  activeTab: string
  tabs: string[]
  totalBindings: number
  conflictCount: number
}

export function Header({ activeTab, tabs, totalBindings, conflictCount }: Props) {
  return (
    <box flexDirection="column" borderBottom borderColor="#3b3b3b" paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1}>
        <text>
          <span fg="#60a5fa">Keybinding Reference</span>
          <span fg="#6b7280"> | </span>
          <span fg="#a1a1aa">{totalBindings} bindings</span>
          {conflictCount > 0 && (
            <>
              <span fg="#6b7280"> | </span>
              <span fg="#ef4444">{conflictCount} conflicts</span>
            </>
          )}
        </text>
        <text>
          <span fg="#6b7280">q: quit | /: search | tab: switch view</span>
        </text>
      </box>
      <box flexDirection="row" gap={2} paddingLeft={1} paddingTop={1}>
        {tabs.map((tab) => (
          <text key={tab}>
            <span
              fg={activeTab === tab ? "#000" : "#a1a1aa"}
              bg={activeTab === tab ? "#60a5fa" : undefined}
            >
              {` ${tab} `}
            </span>
          </text>
        ))}
      </box>
    </box>
  )
}
