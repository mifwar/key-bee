interface Props {
  value: string
  focused: boolean
}

export function SearchInput({ value, focused }: Props) {
  return (
    <box
      flexDirection="row"
      borderBottom
      borderColor={focused ? "#60a5fa" : "#3b3b3b"}
      paddingLeft={1}
      paddingBottom={1}
    >
      <text>
        <span fg="#60a5fa">Search: </span>
        <span fg="#fff">{value}</span>
        {focused && <span fg="#60a5fa">|</span>}
      </text>
    </box>
  )
}
