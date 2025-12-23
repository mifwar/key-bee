import { useState, useMemo, useEffect, useCallback } from "react"
import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import Fuse from "fuse.js"
import { loadAllKeybindings, detectConflicts, groupByTool, type Keybinding } from "./parsers"
import type { Config, Cache } from "./config/types"
import { 
  loadConfig, 
  loadCache, 
  saveCache, 
  isFirstRun, 
  detectChanges,
  saveConfig 
} from "./config/manager"
import { Header } from "./components/Header"
import { KeybindingList } from "./components/KeybindingList"
import { ConflictView } from "./components/ConflictView"
import { SearchInput } from "./components/SearchInput"
import { SetupWizard } from "./components/SetupWizard"
import { SyncStatus } from "./components/SyncStatus"

export function App() {
  const { width, height } = useTerminalDimensions()
  const [config, setConfig] = useState<Config | null>(null)
  const [cache, setCache] = useState<Cache | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [changedFiles, setChangedFiles] = useState(0)
  
  const [activeTab, setActiveTab] = useState("All")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Initial load
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
    
    // Check for changes
    if (savedCache) {
      const changes = detectChanges(savedConfig, savedCache)
      const totalChanges = changes.changed.length + changes.added.length + changes.removed.length
      setChangedFiles(totalChanges)
      
      // Auto-sync if enabled and changes detected
      if (savedConfig.autoSync && totalChanges > 0) {
        syncBindings(savedConfig)
      }
    } else {
      // No cache, need to sync
      syncBindings(savedConfig)
    }
    
    setIsLoading(false)
  }, [])

  const syncBindings = useCallback((cfg: Config) => {
    setIsSyncing(true)
    const { bindings, cache: newCache } = loadAllKeybindings(cfg)
    saveCache(newCache)
    setCache(newCache)
    setChangedFiles(0)
    setIsSyncing(false)
  }, [])

  const handleSetupComplete = useCallback((newConfig: Config) => {
    setConfig(newConfig)
    setNeedsSetup(false)
    syncBindings(newConfig)
  }, [syncBindings])

  const allBindings = useMemo(() => cache?.bindings || [], [cache])
  const conflicts = useMemo(() => detectConflicts(allBindings), [allBindings])
  const byTool = useMemo(() => groupByTool(allBindings), [allBindings])
  
  // Dynamic tabs based on discovered tools
  const TABS = useMemo(() => {
    const tools = Array.from(byTool.keys())
    return ["All", ...tools, "Conflicts"]
  }, [byTool])

  const fuse = useMemo(
    () =>
      new Fuse(allBindings, {
        keys: ["keys", "description", "action", "tool"],
        threshold: 0.4,
        includeScore: true,
      }),
    [allBindings]
  )

  const filteredBindings = useMemo(() => {
    if (searchQuery) {
      return fuse.search(searchQuery).map((r) => r.item)
    }
    if (activeTab === "All") return allBindings
    if (activeTab === "Conflicts") return []
    return byTool.get(activeTab.toLowerCase()) || []
  }, [activeTab, searchQuery, allBindings, byTool, fuse])

  const maxVisible = Math.max(1, height - 8)

  const currentListLength =
    activeTab === "Conflicts" ? conflicts.length : filteredBindings.length

  useEffect(() => {
    setSelectedIndex(0)
    setScrollOffset(0)
  }, [activeTab, searchQuery])

  useKeyboard((key) => {
    // Skip keyboard handling during setup/loading
    if (needsSetup || isLoading) return
    
    if (searchMode) {
      if (key.name === "escape") {
        setSearchMode(false)
        setSearchQuery("")
      } else if (key.name === "return") {
        setSearchMode(false)
      } else if (key.name === "backspace") {
        setSearchQuery((q) => q.slice(0, -1))
      } else if (key.raw && key.raw.length === 1 && !key.ctrl && !key.meta) {
        setSearchQuery((q) => q + key.raw)
      }
      return
    }

    if (key.name === "q" || (key.name === "c" && key.ctrl)) {
      process.exit(0)
    }

    // Sync keybinding
    if (key.name === "s" && config) {
      syncBindings(config)
      return
    }

    // Reset config (re-run setup)
    if (key.name === "r" && key.ctrl) {
      setNeedsSetup(true)
      return
    }

    if (key.name === "/" || key.name === "f") {
      setSearchMode(true)
      setSearchQuery("")
      return
    }

    if (key.name === "tab" || key.name === "l") {
      const currentIndex = TABS.indexOf(activeTab)
      const nextIndex = (currentIndex + 1) % TABS.length
      setActiveTab(TABS[nextIndex])
    }

    if (key.name === "h" || (key.name === "tab" && key.shift)) {
      const currentIndex = TABS.indexOf(activeTab)
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length
      setActiveTab(TABS[prevIndex])
    }

    if (key.name === "j" || key.name === "down") {
      if (selectedIndex < currentListLength - 1) {
        setSelectedIndex((i) => i + 1)
        if (selectedIndex >= scrollOffset + maxVisible - 1) {
          setScrollOffset((o) => o + 1)
        }
      }
    }

    if (key.name === "k" || key.name === "up") {
      if (selectedIndex > 0) {
        setSelectedIndex((i) => i - 1)
        if (selectedIndex <= scrollOffset) {
          setScrollOffset((o) => Math.max(0, o - 1))
        }
      }
    }

    if (key.name === "g") {
      setSelectedIndex(0)
      setScrollOffset(0)
    }

    if (key.name === "G" || (key.name === "g" && key.shift)) {
      setSelectedIndex(currentListLength - 1)
      setScrollOffset(Math.max(0, currentListLength - maxVisible))
    }
  })

  // Show setup wizard on first run or when reset
  if (needsSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />
  }

  // Loading state
  if (isLoading) {
    return (
      <box flexDirection="column" width={width} height={height} padding={2}>
        <text>
          <span fg="#60a5fa">Loading keybindings...</span>
        </text>
      </box>
    )
  }

  return (
    <box flexDirection="column" width={width} height={height}>
      <Header
        activeTab={activeTab}
        tabs={TABS}
        totalBindings={allBindings.length}
        conflictCount={conflicts.length}
      />

      {searchMode && <SearchInput value={searchQuery} focused={searchMode} />}

      {searchQuery && !searchMode && (
        <box paddingLeft={1} paddingBottom={1} borderBottom borderColor="#3b3b3b">
          <text>
            <span fg="#6b7280">Results for: </span>
            <span fg="#fbbf24">"{searchQuery}"</span>
            <span fg="#6b7280"> ({filteredBindings.length} matches)</span>
          </text>
        </box>
      )}

      <box flexGrow={1} flexDirection="column" paddingTop={1}>
        {activeTab === "Conflicts" ? (
          <ConflictView
            conflicts={conflicts}
            selectedIndex={selectedIndex}
            scrollOffset={scrollOffset}
            maxVisible={Math.floor(maxVisible / 4)}
          />
        ) : (
          <KeybindingList
            bindings={filteredBindings}
            selectedIndex={selectedIndex}
            scrollOffset={scrollOffset}
            maxVisible={maxVisible}
          />
        )}
      </box>

      <box borderTop borderColor="#3b3b3b" paddingLeft={1} paddingTop={1} flexDirection="row" justifyContent="space-between">
        <text>
          <span fg="#6b7280">
            j/k: navigate | h/l/tab: switch tab | /: search | s: sync | g/G: top/bottom | q: quit
          </span>
        </text>
        <SyncStatus 
          lastSync={cache?.lastSync || null} 
          changedFiles={changedFiles}
          issyncing={isSyncing}
        />
      </box>
    </box>
  )
}
