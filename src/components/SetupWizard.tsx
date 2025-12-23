import { useState, useEffect } from "react"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { homedir } from "os"
import { 
  discoverConfigs, 
  saveConfig, 
  expandPath,
  getConfigPath 
} from "../config/manager"
import type { Config, SourceConfig } from "../config/types"

interface Props {
  onComplete: (config: Config) => void
}

type Step = "welcome" | "paths" | "discover" | "review" | "complete"

const DEFAULT_PATHS = [
  "~/code/dotfiles",
  "~/.config",
  "~/.dotfiles",
  "~/dotfiles",
]

export function SetupWizard({ onComplete }: Props) {
  const { width, height } = useTerminalDimensions()
  const [step, setStep] = useState<Step>("welcome")
  const [basePaths, setBasePaths] = useState<string[]>([])
  const [pathInput, setPathInput] = useState("")
  const [discovered, setDiscovered] = useState<SourceConfig[]>([])
  const [selectedSources, setSelectedSources] = useState<Set<number>>(new Set())
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (step === "discover" && basePaths.length > 0 && !isDiscovering) {
      setIsDiscovering(true)
      discoverConfigs(basePaths).then((configs) => {
        setDiscovered(configs)
        setSelectedSources(new Set(configs.map((_, i) => i)))
        setIsDiscovering(false)
        if (configs.length > 0) {
          setStep("review")
        }
      })
    }
  }, [step, basePaths])

  useKeyboard((key) => {
    if (step === "welcome") {
      if (key.name === "return" || key.name === "space") {
        setStep("paths")
      }
      if (key.name === "q") process.exit(0)
      return
    }

    if (step === "paths") {
      if (key.name === "return" && pathInput) {
        setBasePaths((prev) => [...prev, pathInput])
        setPathInput("")
      } else if (key.name === "return" && basePaths.length > 0) {
        setStep("discover")
      } else if (key.name === "backspace") {
        setPathInput((p) => p.slice(0, -1))
      } else if (key.raw && key.raw.length === 1 && !key.ctrl && !key.meta) {
        setPathInput((p) => p + key.raw)
      } else if (key.name === "tab") {
        const remaining = DEFAULT_PATHS.filter((p) => !basePaths.includes(p))
        if (remaining.length > 0) {
          setBasePaths((prev) => [...prev, remaining[0]])
        }
      } else if (key.name === "d" && key.ctrl && basePaths.length > 0) {
        setBasePaths((prev) => prev.slice(0, -1))
      }
      if (key.name === "q" && key.ctrl) process.exit(0)
      return
    }

    if (step === "review") {
      if (key.name === "j" || key.name === "down") {
        setSelectedIndex((i) => Math.min(i + 1, discovered.length - 1))
      } else if (key.name === "k" || key.name === "up") {
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (key.name === "space") {
        setSelectedSources((prev) => {
          const next = new Set(prev)
          if (next.has(selectedIndex)) {
            next.delete(selectedIndex)
          } else {
            next.add(selectedIndex)
          }
          return next
        })
      } else if (key.name === "a") {
        if (selectedSources.size === discovered.length) {
          setSelectedSources(new Set())
        } else {
          setSelectedSources(new Set(discovered.map((_, i) => i)))
        }
      } else if (key.name === "return") {
        const config: Config = {
          basePaths,
          sources: discovered.filter((_, i) => selectedSources.has(i)),
          autoSync: true,
          showWelcome: false,
        }
        saveConfig(config)
        onComplete(config)
      }
      if (key.name === "q") process.exit(0)
      return
    }
  })

  return (
    <box flexDirection="column" width={width} height={height} padding={2}>
      {step === "welcome" && (
        <box flexDirection="column" gap={1}>
          <text>
            <span fg="#60a5fa">Welcome to Keybind TUI!</span>
          </text>
          <text>
            <span fg="#a1a1aa">
              This tool helps you browse and search all your keybindings across different tools.
            </span>
          </text>
          <box paddingTop={1}>
            <text>
              <span fg="#6b7280">Supported tools: </span>
              <span fg="#22c55e">skhd, tmux, nvim, karabiner, zsh, hammerspoon</span>
            </text>
          </box>
          <box paddingTop={2}>
            <text>
              <span fg="#fbbf24">Press ENTER to start setup...</span>
            </text>
          </box>
        </box>
      )}

      {step === "paths" && (
        <box flexDirection="column" gap={1}>
          <text>
            <span fg="#60a5fa">Step 1: Add search paths</span>
          </text>
          <text>
            <span fg="#a1a1aa">Where are your dotfiles/config files located?</span>
          </text>
          
          <box paddingTop={1} flexDirection="column">
            <text>
              <span fg="#6b7280">Added paths:</span>
            </text>
            {basePaths.map((p, i) => (
              <text key={i}>
                <span fg="#22c55e">  ✓ {p}</span>
              </text>
            ))}
          </box>

          <box paddingTop={1} flexDirection="row">
            <text>
              <span fg="#fbbf24">Path: </span>
              <span fg="#fff">{pathInput}</span>
              <span fg="#60a5fa">|</span>
            </text>
          </box>

          <box paddingTop={2}>
            <text>
              <span fg="#6b7280">
                TAB: add suggestion | ENTER: add path | Ctrl+D: remove last | ENTER (empty): continue
              </span>
            </text>
          </box>

          {basePaths.length === 0 && (
            <box paddingTop={1}>
              <text>
                <span fg="#6b7280">Suggestions: </span>
                <span fg="#a1a1aa">{DEFAULT_PATHS.join(", ")}</span>
              </text>
            </box>
          )}
        </box>
      )}

      {step === "discover" && (
        <box flexDirection="column" gap={1}>
          <text>
            <span fg="#60a5fa">Discovering config files...</span>
          </text>
          <text>
            <span fg="#a1a1aa">Searching in: {basePaths.join(", ")}</span>
          </text>
        </box>
      )}

      {step === "review" && (
        <box flexDirection="column" gap={1}>
          <text>
            <span fg="#60a5fa">Step 2: Select config files to include</span>
          </text>
          <text>
            <span fg="#a1a1aa">Found {discovered.length} config files</span>
          </text>

          <box paddingTop={1} flexDirection="column" flexGrow={1}>
            {discovered.slice(0, height - 12).map((source, i) => {
              const isSelected = selectedSources.has(i)
              const isCurrent = i === selectedIndex
              return (
                <box key={i} flexDirection="row" backgroundColor={isCurrent ? "#3b3b3b" : undefined}>
                  <text>
                    <span fg={isSelected ? "#22c55e" : "#6b7280"}>
                      {isSelected ? " [✓] " : " [ ] "}
                    </span>
                    <span fg="#f97316">{source.type.padEnd(12)}</span>
                    <span fg="#a1a1aa">{source.path}</span>
                  </text>
                </box>
              )
            })}
          </box>

          <box paddingTop={1} borderTop borderColor="#3b3b3b">
            <text>
              <span fg="#6b7280">
                j/k: navigate | SPACE: toggle | a: toggle all | ENTER: confirm | q: quit
              </span>
            </text>
          </box>
        </box>
      )}

      <box position="absolute" bottom={1} left={2}>
        <text>
          <span fg="#3b3b3b">Config will be saved to: {getConfigPath()}</span>
        </text>
      </box>
    </box>
  )
}
