import { Context } from '../../packages/core/lib/index.js'
import Loader from '../../packages/loader/lib/index.js'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

const app = new Context()
app.baseUrl = pathToFileURL(join(root, './')).href

await app.plugin(Loader)

// Include reads cordis.yml, evaluates !!js in config, then applies overlay patches.
const includeId = await app.loader.create({
  name: '@cordisjs/plugin-include',
  config: {
    path: './cordis.yml',
    // Overlay: base file enables `noisy`; patch disables it without editing YAML.
    patches: [
      { id: 'noisy', disabled: true },
    ],
  },
})

await app.loader.store[includeId].fiber.await()
await app.loader.await()
await new Promise((r) => setTimeout(r, 200))

const greeting = app.bail('demo/greeting')
if (greeting == null) {
  console.error('[main] greeter did not load')
  process.exitCode = 1
} else {
  console.log(`[main] greeter reported: ${greeting}`)
}
