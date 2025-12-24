import React, { useState, useMemo, useEffect, useCallback, useRef, useReducer } from "react"
import { watchFile, unwatchFile } from "fs"
import { Box, Text, useInput, useStdout } from "ink"
import Fuse from "fuse.js"
import { loadAllKeybindings, detectConflicts, groupByTool } from "./parsers/index.js"
import type { Config, Cache, CustomParserConfig } from "./config/types.js"
import {
  loadConfig,
  loadCache,
  saveCache,
  isFirstRun,
  detectChanges,
  resolveSourcePath,
  getConfigPath
} from "./config/manager.js"
import { Header } from "./components/Header.js"
import { KeybindingList } from "./components/KeybindingList.js"
import { ConflictView } from "./components/ConflictView.js"
import { SearchInput } from "./components/SearchInput.js"
import { SetupWizard } from "./components/SetupWizard.js"
import { SyncStatus } from "./components/SyncStatus.js"

interface Props {
  onExit: (code?: number) => void
  onOpenFile: (filePath: string) => void
}

interface UiState {
  viewport: { width: number; height: number }
  activeTab: string
  selectedIndex: number
  scrollOffset: number
  searchMode: boolean
  searchQuery: string
}

type UiAction =
  | { type: "resize"; width: number; height: number }
  | { type: "setActiveTab"; tab: string }
  | { type: "setSearchQuery"; query: string }
  | { type: "startSearch" }
  | { type: "cancelSearch" }
  | { type: "confirmSearch" }
  | { type: "appendSearch"; char: string }
  | { type: "backspaceSearch" }
  | { type: "navigateDown"; listLength: number; maxVisible: number }
  | { type: "navigateUp"; maxVisible: number }
  | { type: "jumpTop" }
  | { type: "jumpBottom"; listLength: number; maxVisible: number }

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "resize":
      return { ...state, viewport: { width: action.width, height: action.height } }
    case "setActiveTab":
      return { ...state, activeTab: action.tab, selectedIndex: 0, scrollOffset: 0 }
    case "setSearchQuery":
      return { ...state, searchQuery: action.query, selectedIndex: 0, scrollOffset: 0 }
    case "startSearch":
      return {
        ...state,
        searchMode: true,
        searchQuery: "",
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "cancelSearch":
      return {
        ...state,
        searchMode: false,
        searchQuery: "",
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "confirmSearch":
      return { ...state, searchMode: false }
    case "appendSearch":
      return {
        ...state,
        searchQuery: state.searchQuery + action.char,
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "backspaceSearch":
      return {
        ...state,
        searchQuery: state.searchQuery.slice(0, -1),
        selectedIndex: 0,
        scrollOffset: 0
      }
    case "navigateDown": {
      const { listLength, maxVisible } = action
      if (state.selectedIndex >= listLength - 1) return state
      const nextIndex = state.selectedIndex + 1
      const nextScroll =
        nextIndex >= state.scrollOffset + maxVisible - 1
          ? state.scrollOffset + 1
          : state.scrollOffset
      return { ...state, selectedIndex: nextIndex, scrollOffset: nextScroll }
    }
    case "navigateUp": {
      if (state.selectedIndex <= 0) return state
      const nextIndex = state.selectedIndex - 1
      const nextScroll =
        nextIndex <= state.scrollOffset ? Math.max(0, state.scrollOffset - 1) : state.scrollOffset
      return { ...state, selectedIndex: nextIndex, scrollOffset: nextScroll }
    }
    case "jumpTop":
      return { ...state, selectedIndex: 0, scrollOffset: 0 }
    case "jumpBottom": {
      const { listLength, maxVisible } = action
      const lastIndex = Math.max(0, listLength - 1)
      return {
        ...state,
        selectedIndex: lastIndex,
        scrollOffset: Math.max(0, listLength - maxVisible)
      }
    }
    default:
      return state
  }
}

export function App({ onExit, onOpenFile }: Props) {
  const { stdout } = useStdout()
  const width = stdout?.columns || 80
  const height = stdout?.rows || 24

  const [config, setConfig] = useState<Config | null>(null)
  const [cache, setCache] = useState<Cache | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [changedFiles, setChangedFiles] = useState(0)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const [ui, dispatch] = useReducer(uiReducer, {
    viewport: { width, height },
    activeTab: "All",
    selectedIndex: 0,
    scrollOffset: 0,
    searchMode: false,
    searchQuery: ""
  })
  const cacheRef = useRef<Cache | null>(null)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uiSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncInFlightRef = useRef(false)
  const pendingConfigRef = useRef<Config | null>(null)

  useEffect(() => {
    const resizeTimer = setTimeout(() => {
      dispatch({ type: "resize", width, height })
    }, 80)
    return () => clearTimeout(resizeTimer)
  }, [width, height])

  useEffect(() => {
    cacheRef.current = cache
  }, [cache])

  const runSync = useCallback((cfg: Config) => {
    syncInFlightRef.current = true
    setIsSyncing(true)
    setSyncMessage(null)
    setTimeout(() => {
      const { cache: newCache } = loadAllKeybindings(cfg)
      saveCache(newCache)
      setCache(newCache)
      cacheRef.current = newCache
      setChangedFiles(0)
      setIsSyncing(false)
      syncInFlightRef.current = false
      setSyncMessage(`Synced! ${newCache.bindings.length} bindings loaded`)
      setTimeout(() => setSyncMessage(null), 2000)

      const pending = pendingConfigRef.current
      if (pending && pending !== cfg) {
        pendingConfigRef.current = null
        runSync(pending)
      }
    }, 0)
  }, [])

  const requestSync = useCallback(
    (cfg: Config, options?: { immediate?: boolean }) => {
      pendingConfigRef.current = cfg
      if (syncInFlightRef.current) return
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
      if (options?.immediate) {
        pendingConfigRef.current = null
        runSync(cfg)
        return
      }
      syncTimerRef.current = setTimeout(() => {
        const next = pendingConfigRef.current
        pendingConfigRef.current = null
        if (next) runSync(next)
      }, 250)
    },
    [runSync]
  )

  useEffect(() => {
    if (isFirstRun()) {
      setNeedsSetup(true)
      setIsLoading(false)
      return
    }

    const savedConfig = loadConfig()
    const savedCache = loadCache()

    setConfig(savedConfig)
    setCache(savedCache)
    cacheRef.current = savedCache

    if (savedCache?.ui?.activeTab) {
      dispatch({ type: "setActiveTab", tab: savedCache.ui.activeTab })
    }
    if (savedCache?.ui?.searchQuery) {
      dispatch({ type: "setSearchQuery", query: savedCache.ui.searchQuery })
    }

    if (savedCache) {
      const changes = detectChanges(savedConfig, savedCache)
      const totalChanges = changes.changed.length + changes.added.length + changes.removed.length
      setChangedFiles(totalChanges)

      if (savedConfig.autoSync && totalChanges > 0) {
        requestSync(savedConfig)
      }
    } else {
      requestSync(savedConfig)
    }

    setIsLoading(false)
  }, [requestSync])

  const handleSetupComplete = useCallback(
    (newConfig: Config) => {
      setConfig(newConfig)
      setNeedsSetup(false)
      requestSync(newConfig, { immediate: true })
    },
    [requestSync]
  )

  const allBindings = useMemo(() => cache?.bindings || [], [cache])
  const conflicts = useMemo(() => detectConflicts(allBindings), [allBindings])
  const byTool = useMemo(() => groupByTool(allBindings), [allBindings])

  const customColors = useMemo(() => {
    if (!config) return {}
    const colors: Record<string, string> = {}
    for (const source of config.sources) {
      if (source.type === "custom") {
        const customSource = source as CustomParserConfig
        if (customSource.color) {
          colors[customSource.name] = customSource.color
        }
      }
    }
    return colors
  }, [config])

  const TABS = useMemo(() => {
    const tools = Array.from(byTool.keys())
    return ["All", ...tools, "Conflicts"]
  }, [byTool])

  useEffect(() => {
    if (!TABS.includes(ui.activeTab)) {
      dispatch({ type: "setActiveTab", tab: "All" })
    }
  }, [TABS, ui.activeTab])

  const fuse = useMemo(
    () =>
      new Fuse(allBindings, {
        keys: ["keys", "description", "action", "tool"],
        threshold: 0.4,
        includeScore: true
      }),
    [allBindings]
  )

  const filteredBindings = useMemo(() => {
    if (ui.searchQuery) {
      return fuse.search(ui.searchQuery).map((r) => r.item)
    }
    if (ui.activeTab === "All") return allBindings
    if (ui.activeTab === "Conflicts") return []
    return byTool.get(ui.activeTab.toLowerCase()) || []
  }, [ui.activeTab, ui.searchQuery, allBindings, byTool, fuse])

  const maxVisible = Math.max(1, ui.viewport.height - 8)

  const currentListLength =
    ui.activeTab === "Conflicts" ? conflicts.length : filteredBindings.length

  useEffect(() => {
    if (uiSaveTimerRef.current) {
      clearTimeout(uiSaveTimerRef.current)
    }
    uiSaveTimerRef.current = setTimeout(() => {
      if (!cacheRef.current) return
      const nextCache = {
        ...cacheRef.current,
        ui: {
          ...cacheRef.current.ui,
          activeTab: ui.activeTab,
          searchQuery: ui.searchQuery
        }
      }
      saveCache(nextCache)
      setCache(nextCache)
      cacheRef.current = nextCache
    }, 300)
  }, [ui.activeTab, ui.searchQuery])

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      if (uiSaveTimerRef.current) clearTimeout(uiSaveTimerRef.current)
    }
  }, [])

  // Watch config file for external changes
  useEffect(() => {
    if (needsSetup) return

    const configPath = getConfigPath()
    watchFile(configPath, { interval: 1000 }, () => {
      const newConfig = loadConfig()
      setConfig(newConfig)
      requestSync(newConfig, { immediate: true })
    })

    return () => {
      unwatchFile(configPath)
    }
  }, [needsSetup, requestSync])

  useInput((input, key) => {
    if (needsSetup || isLoading) return

    if (ui.searchMode) {
      if (key.escape) {
        dispatch({ type: "cancelSearch" })
      } else if (key.return) {
        dispatch({ type: "confirmSearch" })
      } else if (key.backspace || key.delete) {
        dispatch({ type: "backspaceSearch" })
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        dispatch({ type: "appendSearch", char: input })
      }
      return
    }

    if (key.escape && ui.searchQuery) {
      dispatch({ type: "cancelSearch" })
      return
    }

    if (input === "q" || (input === "c" && key.ctrl)) {
      onExit(0)
    }

    if (input === "e") {
      const selectedBinding =
        ui.activeTab === "Conflicts"
          ? conflicts[ui.selectedIndex]?.bindings[0]
          : filteredBindings[ui.selectedIndex]
      let targetPath = selectedBinding?.sourcePath
      if (!targetPath && config && selectedBinding) {
        const matchingSource = config.sources.find((source) => {
          if (source.type === "custom") return source.name === selectedBinding.tool
          return source.type === selectedBinding.tool
        })
        if (matchingSource) {
          targetPath = resolveSourcePath(matchingSource, config.basePaths) || undefined
        }
      }
      if (targetPath) {
        onOpenFile(targetPath)
        if (config) {
          requestSync(config, { immediate: true })
        }
      }
      return
    }

    if (input === "s" && config) {
      requestSync(config, { immediate: true })
      return
    }

    if (input === "r" && key.ctrl) {
      setNeedsSetup(true)
      return
    }

    if (input === "/" || input === "f") {
      dispatch({ type: "startSearch" })
      return
    }

    if (key.tab || input === "l") {
      const currentIndex = TABS.indexOf(ui.activeTab)
      const nextIndex = (currentIndex + 1) % TABS.length
      dispatch({ type: "setActiveTab", tab: TABS[nextIndex] })
    }

    if (input === "h" || (key.tab && key.shift)) {
      const currentIndex = TABS.indexOf(ui.activeTab)
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length
      dispatch({ type: "setActiveTab", tab: TABS[prevIndex] })
    }

    if (input === "j" || key.downArrow) {
      dispatch({ type: "navigateDown", listLength: currentListLength, maxVisible })
    }

    if (input === "k" || key.upArrow) {
      dispatch({ type: "navigateUp", maxVisible })
    }

    if (input === "g") {
      dispatch({ type: "jumpTop" })
    }

    if (input === "G" || (input === "g" && key.shift)) {
      dispatch({ type: "jumpBottom", listLength: currentListLength, maxVisible })
    }
  })

  if (needsSetup) {
    return <SetupWizard onComplete={handleSetupComplete} onExit={onExit} />
  }

  if (isLoading) {
    return (
      <Box flexDirection="column" width={ui.viewport.width} height={ui.viewport.height} padding={2}>
        <Text color="#60a5fa">Loading keybindings...</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" width={ui.viewport.width} height={ui.viewport.height}>
      <Header
        activeTab={ui.activeTab}
        tabs={TABS}
        totalBindings={allBindings.length}
        conflictCount={conflicts.length}
      />

      {ui.searchMode && <SearchInput value={ui.searchQuery} focused={ui.searchMode} />}

      {ui.searchQuery && !ui.searchMode && (
        <Box
          paddingLeft={1}
          borderStyle="single"
          borderBottom
          borderTop={false}
          borderLeft={false}
          borderRight={false}
          borderColor="#3b3b3b"
        >
          <Text>
            <Text color="#6b7280">Results for: </Text>
            <Text color="#fbbf24">"{ui.searchQuery}"</Text>
            <Text color="#6b7280"> ({filteredBindings.length} matches)</Text>
          </Text>
        </Box>
      )}

      <Box flexGrow={1} flexDirection="column" marginTop={1}>
        {ui.activeTab === "Conflicts" ? (
          <ConflictView
            conflicts={conflicts}
            selectedIndex={ui.selectedIndex}
            scrollOffset={ui.scrollOffset}
            maxVisible={Math.floor(maxVisible / 4)}
            customColors={customColors}
          />
        ) : (
          <KeybindingList
            bindings={filteredBindings}
            selectedIndex={ui.selectedIndex}
            scrollOffset={ui.scrollOffset}
            maxVisible={maxVisible}
            customColors={customColors}
          />
        )}
      </Box>

      <Box
        borderStyle="single"
        borderTop
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor="#3b3b3b"
        paddingLeft={1}
        marginTop={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <Text color="#6b7280">
          j/k: navigate | h/l/tab: switch tab | /: search | e: edit | s: sync | g/G: top/bottom | q:
          quit
        </Text>
        <SyncStatus
          lastSync={cache?.lastSync || null}
          changedFiles={changedFiles}
          isSyncing={isSyncing}
          syncMessage={syncMessage}
        />
      </Box>
    </Box>
  )
}
