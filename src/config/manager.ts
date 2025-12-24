import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs"
import { join, dirname, isAbsolute } from "path"
import { homedir } from "os"
import { createHash } from "crypto"
import fg from "fast-glob"
import type { Config, Cache, SourceConfig, CacheEntry, BuiltinSourceConfig } from "./types.js"
import { DEFAULT_CONFIG, BUILTIN_PATTERNS } from "./types.js"

const CONFIG_DIR = join(homedir(), ".config", "key-bee")
const CONFIG_PATH = join(CONFIG_DIR, "config.json")
const CACHE_PATH = join(CONFIG_DIR, "cache.json")

export function expandPath(path: string): string {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2))
  }
  return path
}

export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

export function loadConfig(): Config {
  ensureConfigDir()
  if (existsSync(CONFIG_PATH)) {
    try {
      const content = readFileSync(CONFIG_PATH, "utf-8")
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) }
    } catch {
      return DEFAULT_CONFIG
    }
  }
  return DEFAULT_CONFIG
}

export function saveConfig(config: Config): void {
  ensureConfigDir()
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

export function loadCache(): Cache | null {
  if (existsSync(CACHE_PATH)) {
    try {
      const content = readFileSync(CACHE_PATH, "utf-8")
      return JSON.parse(content)
    } catch {
      return null
    }
  }
  return null
}

export function saveCache(cache: Cache): void {
  ensureConfigDir()
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

export function hashFile(path: string): string {
  const content = readFileSync(path, "utf-8")
  return createHash("md5").update(content).digest("hex")
}

export function resolveSourcePath(source: SourceConfig, basePaths: string[]): string | null {
  const sourcePath = source.path

  if (isAbsolute(sourcePath)) {
    const expanded = expandPath(sourcePath)
    return existsSync(expanded) ? expanded : null
  }

  if (sourcePath.startsWith("~/")) {
    const expanded = expandPath(sourcePath)
    return existsSync(expanded) ? expanded : null
  }

  for (const basePath of basePaths) {
    const fullPath = join(expandPath(basePath), sourcePath)
    if (existsSync(fullPath)) {
      return fullPath
    }
  }

  return null
}

export function detectChanges(
  config: Config,
  cache: Cache | null
): {
  changed: string[]
  added: string[]
  removed: string[]
} {
  const result = { changed: [] as string[], added: [] as string[], removed: [] as string[] }

  if (!cache) {
    for (const source of config.sources) {
      const path = resolveSourcePath(source, config.basePaths)
      if (path) result.added.push(path)
    }
    return result
  }

  const cachedPaths = new Set(cache.entries.map((e) => e.path))
  const currentPaths = new Map<string, SourceConfig>()

  for (const source of config.sources) {
    const path = resolveSourcePath(source, config.basePaths)
    if (path) currentPaths.set(path, source)
  }

  for (const [path] of currentPaths) {
    if (!cachedPaths.has(path)) {
      result.added.push(path)
    } else {
      const entry = cache.entries.find((e) => e.path === path)
      if (entry) {
        try {
          const stat = statSync(path)
          if (stat.mtimeMs > entry.mtime) {
            const currentHash = hashFile(path)
            if (currentHash !== entry.hash) {
              result.changed.push(path)
            }
          }
        } catch {
          // File might have been deleted
        }
      }
    }
  }

  for (const cachedPath of cachedPaths) {
    if (!currentPaths.has(cachedPath)) {
      result.removed.push(cachedPath)
    }
  }

  return result
}

export async function discoverConfigs(searchPaths: string[]): Promise<SourceConfig[]> {
  const discovered: SourceConfig[] = []
  const seen = new Set<string>()

  for (const searchPath of searchPaths) {
    const expandedPath = expandPath(searchPath)
    if (!existsSync(expandedPath)) continue

    for (const [, patterns] of Object.entries(BUILTIN_PATTERNS)) {
      for (const { glob: pattern, type } of patterns as Array<{ glob: string; type: string }>) {
        const files = await fg(pattern, { cwd: expandedPath, absolute: true })

        for (const file of files) {
          if (seen.has(file)) continue
          seen.add(file)

          discovered.push({
            type,
            path: file,
            enabled: true
          } as BuiltinSourceConfig)
        }
      }
    }
  }

  return discovered
}

export function isFirstRun(): boolean {
  return !existsSync(CONFIG_PATH)
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

export function getCachePath(): string {
  return CACHE_PATH
}
