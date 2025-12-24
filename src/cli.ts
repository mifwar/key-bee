#!/usr/bin/env node
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { runApp } from "./index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "package.json")
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    return pkg.version
  } catch {
    return "unknown"
  }
}

function showHelp(): void {
  console.log(`
Key Bee - Browse and search keybindings across tools

Usage: kb [options]

Options:
  -v, --version    Show version number
  -h, --help       Show this help message

Navigation:
  j/k              Navigate up/down
  h/l or Tab       Switch tabs
  / or f           Search
  e                Edit selected config
  s                Sync (reload configs)
  g/G              Go to top/bottom
  Ctrl+R           Re-run setup
  q                Quit

Config: ~/.config/key-bee/config.json
`)
}

const args = process.argv.slice(2)

if (args.includes("-v") || args.includes("--version")) {
  console.log(getVersion())
  process.exit(0)
}

if (args.includes("-h") || args.includes("--help")) {
  showHelp()
  process.exit(0)
}

runApp().catch((err) => {
  console.error(err)
  process.exit(1)
})
