#!/usr/bin/env node
import React from "react"
import { render } from "ink"
import { App } from "./App.js"
import { spawnSync } from "child_process"

export async function runApp() {
  let instance: ReturnType<typeof render> | null = null
  let hasExited = false

  const cleanupAndExit = (code = 0) => {
    if (hasExited) return
    hasExited = true
    try {
      if (instance) {
        instance.unmount()
      }
    } finally {
      process.exit(code)
    }
  }

  const openInEditor = (filePath: string) => {
    const editor = process.env.EDITOR || process.env.VISUAL || "vim"
    if (instance) {
      instance.unmount()
    }
    try {
      const escapedPath = filePath.replace(/"/g, '\\"')
      const result = spawnSync(`${editor} "${escapedPath}"`, {
        stdio: "inherit",
        shell: true
      })
      if (result.error) {
        console.error(result.error)
      }
    } finally {
      instance = render(<App onExit={cleanupAndExit} onOpenFile={openInEditor} />)
    }
  }

  process.on("SIGINT", () => cleanupAndExit(0))
  process.on("SIGTERM", () => cleanupAndExit(0))
  process.on("uncaughtException", (err: Error) => {
    console.error(err)
    cleanupAndExit(1)
  })
  process.on("unhandledRejection", (err: unknown) => {
    console.error(err)
    cleanupAndExit(1)
  })

  instance = render(<App onExit={cleanupAndExit} onOpenFile={openInEditor} />)
  await instance.waitUntilExit()
}
