# Keybind TUI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?logo=bun&logoColor=white)](https://bun.sh)

A terminal user interface for browsing and searching all your keybindings across different tools.

Built with [OpenTUI](https://github.com/sst/opentui) + React.

<!-- TODO: Add screenshot/gif here -->
<!-- ![Demo](./demo.gif) -->

## Features

- **Multi-tool support**: skhd, tmux, nvim, karabiner, zsh, hammerspoon
- **Fuzzy search**: Find any keybinding instantly
- **Conflict detection**: Identify overlapping keybindings across tools  
- **Auto-discovery**: Automatically finds config files in your dotfiles
- **Change detection**: Detects when config files change
- **Custom parsers**: Add your own tools via regex patterns
- **Multiple paths**: Search across multiple dotfiles locations

## Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/keybind-tui.git
cd keybind-tui

# Install dependencies
bun install

# Run
bun run dev

# Or install globally
bun link --global
kb  # Run from anywhere
```

## Usage

### First Run

On first run, a setup wizard will guide you through:

1. **Add search paths** - Where are your dotfiles? (e.g., `~/code/dotfiles`, `~/.config`)
2. **Select configs** - Choose which discovered config files to include

### Navigation

| Key | Action |
|-----|--------|
| `j/k` | Navigate up/down |
| `h/l` or `Tab` | Switch tabs |
| `/` or `f` | Search |
| `s` | Sync (reload configs) |
| `g/G` | Go to top/bottom |
| `Ctrl+R` | Re-run setup |
| `q` | Quit |

### Tabs

- **All** - All keybindings from all tools
- **[tool]** - Filter by specific tool (skhd, tmux, nvim, etc.)
- **Conflicts** - Show keybindings that conflict across tools

## Configuration

Config is stored at `~/.config/keybind-tui/config.json`:

```json
{
  "basePaths": [
    "~/code/dotfiles",
    "~/.config"
  ],
  "sources": [
    { "type": "skhd", "path": "skhd/skhdrc" },
    { "type": "tmux", "path": "~/.tmux.conf" },
    { "type": "nvim-keymap", "path": "nvim/lua/config/keymaps.lua" }
  ],
  "autoSync": true
}
```

### Custom Parsers

Add custom tools using regex patterns:

```json
{
  "sources": [
    {
      "type": "custom",
      "name": "aerospace",
      "path": "~/.aerospace.toml",
      "pattern": "^([a-z-]+)\\s*=\\s*['\"]([^'\"]+)['\"]",
      "keyGroup": 1,
      "actionGroup": 2,
      "commentPrefix": "#"
    }
  ]
}
```

### Supported Path Formats

```json
{
  "sources": [
    { "type": "skhd", "path": "skhd/skhdrc" },
    { "type": "tmux", "path": "~/.tmux.conf" },
    { "type": "karabiner", "path": "/absolute/path/to/karabiner.json" }
  ]
}
```

- **Relative paths** - Searched in all `basePaths`
- **Tilde paths** - Expanded to home directory
- **Absolute paths** - Used as-is

## Built-in Parsers

| Type | Files | Description |
|------|-------|-------------|
| `skhd` | `skhdrc`, `.skhdrc` | skhd hotkey daemon |
| `tmux` | `.tmux.conf`, `tmux.conf` | tmux keybindings |
| `nvim-keymap` | `keymaps.lua`, `keys.lua` | Neovim Lua keymaps |
| `karabiner` | `karabiner.json` | Karabiner-Elements |
| `zsh-alias` | `.zshrc` | Zsh aliases & bindkeys |
| `hammerspoon` | `init.lua` | Hammerspoon hotkeys |

## Tech Stack

- [OpenTUI](https://github.com/sst/opentui) - Terminal UI framework
- [React](https://react.dev) - UI components
- [Bun](https://bun.sh) - JavaScript runtime
- [Fuse.js](https://fusejs.io) - Fuzzy search

## Contributing

PRs welcome! Some ideas:

- [ ] More built-in parsers (aerospace, raycast, etc.)
- [ ] Export to markdown/PDF
- [ ] Practice mode (quiz yourself)
- [ ] Watch mode (auto-reload on file change)

## License

MIT
