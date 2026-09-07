import { Context } from '../../packages/core/lib/index.js'
import Loader from '../../packages/loader/lib/index.js'
import LoggerConsole from '../../packages/logger-console/lib/index.js'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const pluginFile = join(root, 'plugins/heartbeat.js')
const original = await readFile(pluginFile, 'utf8')

function waitFor(cond, label, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeout)
    const check = setInterval(() => {
      if (!cond()) return
      clearInterval(check)
      clearTimeout(timer)
      resolve()
    }, 40)
  })
}

const app = new Context()
await app.plugin(LoggerConsole)
app.baseUrl = pathToFileURL(join(root, './')).href

const fiber = await app.plugin(Loader)
const includeId = await app.loader.create({
  name: '@cordisjs/plugin-include',
  config: {
    path: './cordis.yml',
  },
})

await app.loader.store[includeId].fiber.await()
await app.loader.await()

if (!app.loader.internal) {
  console.error('[main] loader internals unavailable; run with: node --expose-internals index.js')
  process.exitCode = 1
  await fiber.dispose()
  process.exit()
}

await waitFor(() => app.hmr && app.bail('demo/get') === 'v1', 'boot')
console.log('[main] booted with', app.bail('demo/get'))

try {
  // Touch the plugin file — HMR should unload the old fiber (clearing interval) then remount.
  await writeFile(pluginFile, original.replace("value = 'v1'", "value = 'v2'"))
  await waitFor(() => app.bail('demo/get') === 'v2', 'hmr reload')
  console.log('[main] after hmr:', app.bail('demo/get'))
  // Let a couple of v2 ticks print so we can see the new fiber is alive.
  await new Promise((r) => setTimeout(r, 500))
} finally {
  await writeFile(pluginFile, original)
  await fiber.dispose()
}

console.log('[main] done (plugin file restored)')
