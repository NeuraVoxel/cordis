import { Context } from '../../packages/core/lib/index.js'

function greeter(ctx) {
  ctx.on('event.hello', (name) => {
    console.log(`Hello, ${name}!`)
  })
}

const app = new Context()
await app.plugin(greeter)
app.emit('event.hello', 'Cordis')
