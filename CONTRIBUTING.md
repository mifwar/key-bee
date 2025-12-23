# Contributing to Keybind TUI

Thanks for your interest in contributing! Here's how you can help.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mifwar/keybind-tui.git
cd keybind-tui

# Install dependencies
bun install

# Run in development
bun run dev
```

## Adding a New Parser

1. Create a new parser file in `src/parsers/`:

```typescript
// src/parsers/myapp.ts
import type { Keybinding } from "./types"

export function parseMyApp(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  // Your parsing logic here
  return bindings
}
```

2. Register it in `src/parsers/index.ts`:

```typescript
import { parseMyApp } from "./myapp"

const PARSERS: Record<string, (content: string) => Keybinding[]> = {
  // ... existing parsers
  "myapp": parseMyApp,
}
```

3. Add discovery patterns in `src/config/types.ts`:

```typescript
export const BUILTIN_PATTERNS = {
  // ... existing patterns
  myapp: [
    { glob: "**/.myapprc", type: "myapp" },
  ],
}
```

## Pull Request Guidelines

1. Fork the repo and create your branch from `main`
2. Test your changes locally
3. Update documentation if needed
4. Submit a PR with a clear description

## Ideas for Contributions

- [ ] More built-in parsers (aerospace, raycast, wezterm, etc.)
- [ ] Export to markdown/PDF
- [ ] Practice mode (quiz yourself on keybindings)
- [ ] Watch mode (auto-reload on file change)
- [ ] Themes/color customization
- [ ] Mouse support

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep components small and focused

## Questions?

Open an issue if you have questions or need help!
