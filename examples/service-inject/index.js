import { Context, Service } from '../../packages/core/lib/index.js'

class Clock extends Service {
  constructor(ctx) {
    super(ctx, 'clock')
    console.log('[clock] provided')
  }

  now() {
    return new Date().toISOString()
  }
}

class Greeter extends Service {
  static inject = ['clock']

  constructor(ctx) {
    super(ctx, 'greeter')
    console.log('[greeter] activated')
  }

  hello(name) {
    console.log(`Hello, ${name}! @ ${this.ctx.clock.now()}`)
  }
}

const app = new Context()

// Mount consumer first — fiber stays PENDING until `clock` exists.
console.log('[greeter] waiting for clock…')
const greeterFiber = app.plugin(Greeter)

await app.plugin(Clock)
await greeterFiber

await app.inject(['greeter'], (ctx) => {
  ctx.greeter.hello('Cordis')
})
