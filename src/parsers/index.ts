import { readFileSync, existsSync, statSync } from "fs"
import type { Keybinding, ConflictGroup } from "./types"
import type { SourceConfig, Config, Cache, CacheEntry, CustomParserConfig } from "../config/types"
import { resolveSourcePath, hashFile, saveCache } from "../config/manager"
import { parseSkhdrc } from "./skhd"
import { parseTmuxConf } from "./tmux"
import { parseNvimKeymaps } from "./nvim"
import { parseZshAliases } from "./zsh"
import { parseKarabiner } from "./karabiner"
import { parseHammerspoon } from "./hammerspoon"
import { parseCustomConfig } from "./custom"

export type { Keybinding, ConflictGroup }
export { parseSkhdrc } from "./skhd"
export { parseTmuxConf } from "./tmux"
export { parseNvimKeymaps } from "./nvim"
export { parseZshAliases } from "./zsh"
export { parseKarabiner } from "./karabiner"
export { parseHammerspoon } from "./hammerspoon"
export { parseCustomConfig } from "./custom"

const PARSERS: Record<string, (content: string) => Keybinding[]> = {
  skhd: parseSkhdrc,
  tmux: parseTmuxConf,
  "nvim-keymap": parseNvimKeymaps,
  "zsh-alias": parseZshAliases,
  karabiner: parseKarabiner,
  hammerspoon: parseHammerspoon,
}

export function parseSource(source: SourceConfig, content: string): Keybinding[] {
  if (source.type === "custom") {
    return parseCustomConfig(content, source as CustomParserConfig)
  }
  
  const parser = PARSERS[source.type]
  if (!parser) {
    console.warn(`No parser for type: ${source.type}`)
    return []
  }
  
  return parser(content)
}

export function loadAllKeybindings(config: Config): { bindings: Keybinding[]; cache: Cache } {
  const bindings: Keybinding[] = []
  const entries: CacheEntry[] = []

  for (const source of config.sources) {
    if ("enabled" in source && source.enabled === false) continue
    
    const resolvedPath = resolveSourcePath(source, config.basePaths)
    if (!resolvedPath || !existsSync(resolvedPath)) continue

    try {
      const content = readFileSync(resolvedPath, "utf-8")
      const parsed = parseSource(source, content)
      bindings.push(...parsed)
      
      const stat = statSync(resolvedPath)
      entries.push({
        path: resolvedPath,
        hash: hashFile(resolvedPath),
        mtime: stat.mtimeMs,
        bindingsCount: parsed.length,
      })
    } catch (err) {
      console.warn(`Failed to parse ${resolvedPath}:`, err)
    }
  }

  const cache: Cache = {
    version: 1,
    lastSync: new Date().toISOString(),
    entries,
    bindings,
  }

  return { bindings, cache }
}

export function loadFromCache(cache: Cache): Keybinding[] {
  return cache.bindings
}

export function detectConflicts(bindings: Keybinding[]): ConflictGroup[] {
  const groups = new Map<string, Keybinding[]>()

  for (const binding of bindings) {
    const existing = groups.get(binding.normalizedKeys) || []
    existing.push(binding)
    groups.set(binding.normalizedKeys, existing)
  }

  const conflicts: ConflictGroup[] = []
  for (const [normalizedKeys, groupBindings] of groups) {
    if (groupBindings.length > 1) {
      const tools = new Set(groupBindings.map((b) => b.tool))
      if (tools.size > 1) {
        conflicts.push({ normalizedKeys, bindings: groupBindings })
      }
    }
  }

  return conflicts.sort((a, b) => b.bindings.length - a.bindings.length)
}

export function groupByTool(bindings: Keybinding[]): Map<string, Keybinding[]> {
  const groups = new Map<string, Keybinding[]>()
  for (const binding of bindings) {
    const existing = groups.get(binding.tool) || []
    existing.push(binding)
    groups.set(binding.tool, existing)
  }
  return groups
}
