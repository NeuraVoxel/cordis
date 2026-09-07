import { Context } from 'cordis'

declare module 'cordis' {
  interface Events {
    hello(name: string): void
  }
}

function greeter(ctx: Context) {
  ctx.on('hello', (name) => {
    console.log(`Hello, ${name}!`)
  })
}

const app = new Context()
await app.plugin(greeter)
app.emit('hello', 'Cordis')
