import { Context } from '../../packages/core/lib/index.js'

function heartbeat(ctx) {
  console.log('[heartbeat] loading')

  // External resource (setInterval) is not tracked by Cordis unless wrapped.
  ctx.effect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 200)

    return () => {
      clearInterval(timer)
      console.log('[heartbeat] cleaned up')
    }
  }, 'heartbeat-timer')
}

const app = new Context()
const fiber = await app.plugin(heartbeat)

await new Promise((resolve) => setTimeout(resolve, 700))
await fiber.dispose()
console.log('[main] fiber disposed')
