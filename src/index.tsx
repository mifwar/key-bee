#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App"

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    targetFps: 60,
  })

  const root = createRoot(renderer)
  root.render(<App />)
}

main().catch(console.error)
