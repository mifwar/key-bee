export interface CustomParserConfig {
  type: "custom"
  name: string
  path: string
  pattern: string
  keyGroup: number
  actionGroup: number
  descriptionGroup?: number
  modeGroup?: number
  commentPrefix?: string
  color?: string
}

export interface BuiltinSourceConfig {
  type: "skhd" | "tmux" | "nvim-keymap" | "karabiner" | "zsh-alias" | "hammerspoon"
  path: string
  enabled?: boolean
}

export type SourceConfig = BuiltinSourceConfig | CustomParserConfig

export interface Config {
  basePaths: string[]
  sources: SourceConfig[]
  autoSync: boolean
  showWelcome?: boolean
}

export interface CacheEntry {
  path: string
  hash: string
  mtime: number
  bindingsCount: number
}

export interface Cache {
  version: number
  lastSync: string
  entries: CacheEntry[]
  bindings: import("../parsers/types.js").Keybinding[]
  ui?: {
    activeTab?: string
    searchQuery?: string
  }
}

export const DEFAULT_CONFIG: Config = {
  basePaths: [],
  sources: [],
  autoSync: true,
  showWelcome: true
}

export const BUILTIN_PATTERNS: Record<
  string,
  { glob: string; type: BuiltinSourceConfig["type"] }[]
> = {
  skhd: [
    { glob: "**/skhd/skhdrc", type: "skhd" },
    { glob: "**/.skhdrc", type: "skhd" }
  ],
  tmux: [
    { glob: "**/tmux/.tmux.conf", type: "tmux" },
    { glob: "**/tmux/tmux.conf", type: "tmux" },
    { glob: "**/.tmux.conf", type: "tmux" }
  ],
  nvim: [
    { glob: "**/nvim/lua/**/keymaps.lua", type: "nvim-keymap" },
    { glob: "**/nvim/lua/**/keys.lua", type: "nvim-keymap" }
  ],
  karabiner: [
    { glob: "**/.config/karabiner/karabiner.json", type: "karabiner" },
    { glob: "**/karabiner/karabiner.json", type: "karabiner" }
  ],
  zsh: [
    { glob: "**/.zshrc", type: "zsh-alias" },
    { glob: "**/zsh/.zshrc", type: "zsh-alias" }
  ],
  hammerspoon: [
    { glob: "**/.hammerspoon/init.lua", type: "hammerspoon" },
    { glob: "**/hammerspoon/init.lua", type: "hammerspoon" }
  ]
}
