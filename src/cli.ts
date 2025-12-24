#!/usr/bin/env node
import { runApp } from "./index.js"

runApp().catch((err) => {
  console.error(err)
  process.exit(1)
})
