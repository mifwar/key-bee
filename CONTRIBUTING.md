# Contributing to Key Bee

Thanks for your interest in contributing! Here's how you can help.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mifwar/key-bee.git
cd key-bee

# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run built version
node dist/cli.js
```

## Adding a New Parser

1. Create a new parser file in `src/parsers/`:

```typescript
// src/parsers/myapp.ts
import type { Keybinding } from "./types.js"

export function parseMyApp(content: string): Keybinding[] {
  const bindings: Keybinding[] = []
  // Your parsing logic here
  return bindings
}
```

2. Register it in `src/parsers/index.ts`:

```typescript
import { parseMyApp } from "./myapp.js"

const PARSERS: Record<string, (content: string) => Keybinding[]> = {
  // ... existing parsers
  myapp: parseMyApp
}
```

3. Add discovery patterns in `src/config/types.ts`:

```typescript
export const BUILTIN_PATTERNS = {
  // ... existing patterns
  myapp: [{ glob: "**/.myapprc", type: "myapp" }]
}
```

4. Add a color in `src/utils/colors.ts`:

```typescript
export const BUILTIN_TOOL_COLORS: Record<string, string> = {
  // ... existing colors
  myapp: "#your-color"
}
```

## Pull Request Guidelines

1. Fork the repo and create your branch from `main`
2. Test your changes locally with `npm run build`
3. Run `npm run format` before committing
4. Submit a PR with a clear description

## Ideas for Contributions

- [ ] More built-in parsers (aerospace, raycast, wezterm, etc.)
- [ ] Export to markdown/PDF
- [ ] Practice mode (quiz yourself on keybindings)
- [ ] Themes/color customization
- [ ] Mouse support

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep components small and focused
- Use `.js` extensions in imports (for ESM compatibility)

## Questions?

Open an issue if you have questions or need help!
