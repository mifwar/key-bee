import { readFileSync, existsSync, statSync } from "fs"
import type { Keybinding, ConflictGroup } from "./types.js"
import type {
  SourceConfig,
  Config,
  Cache,
  CacheEntry,
  CustomParserConfig
} from "../config/types.js"
import { resolveSourcePath, hashFile, saveCache } from "../config/manager.js"
import { parseSkhdrc } from "./skhd.js"
import { parseTmuxConf } from "./tmux.js"
import { parseNvimKeymaps } from "./nvim.js"
import { parseZshAliases } from "./zsh.js"
import { parseKarabiner } from "./karabiner.js"
import { parseHammerspoon } from "./hammerspoon.js"
import { parseCustomConfig } from "./custom.js"

export type { Keybinding, ConflictGroup }
export { parseSkhdrc } from "./skhd.js"
export { parseTmuxConf } from "./tmux.js"
export { parseNvimKeymaps } from "./nvim.js"
export { parseZshAliases } from "./zsh.js"
export { parseKarabiner } from "./karabiner.js"
export { parseHammerspoon } from "./hammerspoon.js"
export { parseCustomConfig } from "./custom.js"

const PARSERS: Record<string, (content: string) => Keybinding[]> = {
  skhd: parseSkhdrc,
  tmux: parseTmuxConf,
  "nvim-keymap": parseNvimKeymaps,
  "zsh-alias": parseZshAliases,
  karabiner: parseKarabiner,
  hammerspoon: parseHammerspoon
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
      const parsed = parseSource(source, content).map((binding) => ({
        ...binding,
        sourcePath: resolvedPath
      }))
      bindings.push(...parsed)

      const stat = statSync(resolvedPath)
      entries.push({
        path: resolvedPath,
        hash: hashFile(resolvedPath),
        mtime: stat.mtimeMs,
        bindingsCount: parsed.length
      })
    } catch (err) {
      console.warn(`Failed to parse ${resolvedPath}:`, err)
    }
  }

  const cache: Cache = {
    version: 1,
    lastSync: new Date().toISOString(),
    entries,
    bindings
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
      const tools = new Map<string, Keybinding[]>()
      for (const binding of groupBindings) {
        const existing = tools.get(binding.tool) || []
        existing.push(binding)
        tools.set(binding.tool, existing)
      }

      const hasCrossToolConflict = tools.size > 1
      let hasSameToolSameModeConflict = false

      if (!hasCrossToolConflict) {
        for (const toolBindings of tools.values()) {
          const modes = new Map<string, number>()
          for (const binding of toolBindings) {
            const modeKey = binding.mode || "__default__"
            modes.set(modeKey, (modes.get(modeKey) || 0) + 1)
          }
          if ([...modes.values()].some((count) => count > 1)) {
            hasSameToolSameModeConflict = true
            break
          }
        }
      }

      if (hasCrossToolConflict || hasSameToolSameModeConflict) {
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
