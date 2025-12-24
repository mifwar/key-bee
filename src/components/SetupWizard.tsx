import React, { useState, useEffect } from "react"
import { Box, Text, useInput, useStdout } from "ink"
import { discoverConfigs, saveConfig, getConfigPath } from "../config/manager.js"
import type { Config, SourceConfig } from "../config/types.js"

interface Props {
  onComplete: (config: Config) => void
  onExit: (code?: number) => void
}

type Step = "welcome" | "paths" | "discover" | "review" | "complete"

const DEFAULT_PATHS = ["~/code/dotfiles", "~/.config", "~/.dotfiles", "~/dotfiles"]

export function SetupWizard({ onComplete, onExit }: Props) {
  const { stdout } = useStdout()
  const width = stdout?.columns || 80
  const height = stdout?.rows || 24

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
  }, [step, basePaths, isDiscovering])

  useInput((input, key) => {
    if (step === "welcome") {
      if (key.return || input === " ") {
        setStep("paths")
      }
      if (input === "q") onExit(0)
      return
    }

    if (step === "paths") {
      if (key.return && pathInput) {
        setBasePaths((prev) => [...prev, pathInput])
        setPathInput("")
      } else if (key.return && basePaths.length > 0) {
        setStep("discover")
      } else if (key.backspace || key.delete) {
        setPathInput((p) => p.slice(0, -1))
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        setPathInput((p) => p + input)
      } else if (key.tab) {
        const remaining = DEFAULT_PATHS.filter((p) => !basePaths.includes(p))
        if (remaining.length > 0) {
          setBasePaths((prev) => [...prev, remaining[0]])
        }
      } else if (input === "d" && key.ctrl && basePaths.length > 0) {
        setBasePaths((prev) => prev.slice(0, -1))
      }
      if (input === "q" && key.ctrl) onExit(0)
      return
    }

    if (step === "review") {
      if (key.escape) {
        setStep("paths")
        setDiscovered([])
        setSelectedSources(new Set())
        setSelectedIndex(0)
        return
      }
      if (input === "j" || key.downArrow) {
        setSelectedIndex((i) => Math.min(i + 1, discovered.length - 1))
      } else if (input === "k" || key.upArrow) {
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (input === " ") {
        setSelectedSources((prev) => {
          const next = new Set(prev)
          if (next.has(selectedIndex)) {
            next.delete(selectedIndex)
          } else {
            next.add(selectedIndex)
          }
          return next
        })
      } else if (input === "a") {
        if (selectedSources.size === discovered.length) {
          setSelectedSources(new Set())
        } else {
          setSelectedSources(new Set(discovered.map((_, i) => i)))
        }
      } else if (key.return) {
        const config: Config = {
          basePaths,
          sources: discovered.filter((_, i) => selectedSources.has(i)),
          autoSync: true,
          showWelcome: false
        }
        saveConfig(config)
        onComplete(config)
      }
      if (input === "q") onExit(0)
      return
    }
  })

  return (
    <Box flexDirection="column" width={width} height={height} padding={2}>
      {step === "welcome" && (
        <Box flexDirection="column" gap={1}>
          <Text color="#60a5fa">Welcome to Key Bee!</Text>
          <Text color="#a1a1aa">
            This tool helps you browse and search all your keybindings across different tools.
          </Text>
          <Box marginTop={1}>
            <Text>
              <Text color="#6b7280">Supported tools: </Text>
              <Text color="#22c55e">skhd, tmux, nvim, karabiner, zsh, hammerspoon</Text>
            </Text>
          </Box>
          <Box marginTop={2}>
            <Text color="#fbbf24">Press ENTER to start setup...</Text>
          </Box>
        </Box>
      )}

      {step === "paths" && (
        <Box flexDirection="column" gap={1}>
          <Text color="#60a5fa">Step 1: Add search paths</Text>
          <Text color="#a1a1aa">Where are your dotfiles/config files located?</Text>

          <Box marginTop={1} flexDirection="column">
            <Text color="#6b7280">Added paths:</Text>
            {basePaths.map((p, i) => (
              <Text key={i} color="#22c55e">
                {" "}
                {"\u2713"} {p}
              </Text>
            ))}
          </Box>

          <Box marginTop={1} flexDirection="row">
            <Text>
              <Text color="#fbbf24">Path: </Text>
              <Text color="#fff">{pathInput}</Text>
              <Text color="#60a5fa">|</Text>
            </Text>
          </Box>

          <Box marginTop={2}>
            <Text color="#6b7280">
              TAB: add suggestion | ENTER: add path | Ctrl+D: remove last | ENTER (empty): continue
            </Text>
          </Box>

          {basePaths.length === 0 && (
            <Box marginTop={1}>
              <Text>
                <Text color="#6b7280">Suggestions: </Text>
                <Text color="#a1a1aa">{DEFAULT_PATHS.join(", ")}</Text>
              </Text>
            </Box>
          )}
        </Box>
      )}

      {step === "discover" && (
        <Box flexDirection="column" gap={1}>
          <Text color="#60a5fa">Discovering config files...</Text>
          <Text color="#a1a1aa">Searching in: {basePaths.join(", ")}</Text>
        </Box>
      )}

      {step === "review" && (
        <Box flexDirection="column" gap={1}>
          <Text color="#60a5fa">Step 2: Select config files to include</Text>
          <Text color="#a1a1aa">Found {discovered.length} config files</Text>

          <Box marginTop={1} flexDirection="column" flexGrow={1}>
            {discovered.slice(0, height - 12).map((source, i) => {
              const isSelected = selectedSources.has(i)
              const isCurrent = i === selectedIndex
              return (
                <Box key={i} flexDirection="row">
                  <Text
                    color={isSelected ? "#22c55e" : "#6b7280"}
                    backgroundColor={isCurrent ? "#3b3b3b" : undefined}
                  >
                    {isSelected ? " [\u2713] " : " [ ] "}
                  </Text>
                  <Text color="#f97316" backgroundColor={isCurrent ? "#3b3b3b" : undefined}>
                    {source.type.padEnd(12)}
                  </Text>
                  <Text color="#a1a1aa" backgroundColor={isCurrent ? "#3b3b3b" : undefined}>
                    {source.path}
                  </Text>
                </Box>
              )
            })}
          </Box>

          <Box
            marginTop={1}
            borderStyle="single"
            borderTop
            borderBottom={false}
            borderLeft={false}
            borderRight={false}
            borderColor="#3b3b3b"
          >
            <Text color="#6b7280">
              j/k: navigate | SPACE: toggle | a: toggle all | ENTER: confirm | ESC: back | q: quit
            </Text>
          </Box>
        </Box>
      )}

      <Box position="absolute" marginTop={height - 3} marginLeft={2}>
        <Text color="#3b3b3b">Config will be saved to: {getConfigPath()}</Text>
      </Box>
    </Box>
  )
}
