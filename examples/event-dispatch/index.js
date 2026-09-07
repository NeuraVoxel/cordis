import { Context, Service } from '../../packages/core/lib/index.js'

// --- Part A: five dispatch modes -------------------------------------------------

function demoEmit(ctx) {
  ctx.on('demo/emit', (msg) => console.log(`[emit] listener-1: ${msg}`))
  ctx.on('demo/emit', (msg) => console.log(`[emit] listener-2: ${msg}`))
  ctx.emit('demo/emit', 'ping')
}

async function demoParallel(ctx) {
  ctx.on('demo/parallel', async (msg) => {
    await new Promise((r) => setTimeout(r, 30))
    console.log(`[parallel] slow: ${msg}`)
  })
  ctx.on('demo/parallel', async (msg) => {
    console.log(`[parallel] fast: ${msg}`)
  })
  await ctx.parallel('demo/parallel', 'ping')
  console.log('[parallel] all settled')
}

async function demoSerial(ctx) {
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-1 (no bail)')
  })
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-2 returns bail value')
    return 'stopped-here'
  })
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-3 (should not run)')
  })
  const result = await ctx.serial('demo/serial')
  console.log(`[serial] result = ${result}`)
}

function demoBail(ctx) {
  ctx.on('demo/bail', () => {
    console.log('[bail] miss (undefined is not bail)')
  })
  ctx.on('demo/bail', () => {
    console.log('[bail] hit')
    return 'answer'
  })
  ctx.on('demo/bail', () => {
    console.log('[bail] should not run')
  })
  console.log(`[bail] result = ${ctx.bail('demo/bail')}`)
}

function demoWaterfall(ctx) {
  // Outer: wrap / observe, must call next() to continue.
  ctx.on('demo/waterfall', (value, next) => {
    const out = next()
    console.log(`[waterfall] outer saw "${out}"`)
    return `wrapped(${out})`
  })
  // Middle: short-circuit — no next(), downstream skipped.
  ctx.on('demo/waterfall', (value, next) => {
    console.log(`[waterfall] middle short-circuits on "${value}"`)
    return `short:${value}`
  })
  ctx.on('demo/waterfall', (value, next) => {
    console.log('[waterfall] inner should not run')
    return next()
  })

  const short = ctx.waterfall('demo/waterfall', 'raw', () => 'terminal')
  console.log(`[waterfall] short result = ${short}`)

  // Second chain: cooperative rewrite (all call next).
  ctx.on('demo/waterfall-coop', (value, next) => value.toUpperCase() + next())
  ctx.on('demo/waterfall-coop', (value, next) => `-${next()}`)
  const coop = ctx.waterfall('demo/waterfall-coop', 'hi', () => '!')
  console.log(`[waterfall] coop result = ${coop}`)
}

// --- Part B: service method vs event interception --------------------------------

class Greeter extends Service {
  constructor(ctx) {
    super(ctx, 'greeter')
  }

  /** Direct capability — call this for "do the work". */
  hello(name) {
    console.log(`Hello, ${name}!`)
  }
}

function policy(ctx) {
  // Interception / policy belongs on events, not inside Greeter.hello.
  ctx.on('greet/before', (name, next) => {
    if (name === 'blocked') {
      console.log('[policy] blocked guest — short-circuit')
      return null
    }
    const resolved = next()
    console.log(`[policy] allow "${resolved}"`)
    return resolved
  })

  ctx.on('greet/before', (name, next) => {
    if (name === 'anon') return 'Guest'
    return next()
  })
}

function greetViaPipeline(ctx, name) {
  const resolved = ctx.waterfall('greet/before', name, () => name)
  if (resolved == null) {
    console.log('[main] greet skipped')
    return
  }
  ctx.greeter.hello(resolved)
}

// --- boot ------------------------------------------------------------------------

const app = new Context()

await app.plugin((ctx) => {
  console.log('=== Part A: dispatch modes ===')
  demoEmit(ctx)
  demoBail(ctx)
  demoWaterfall(ctx)
})

await demoParallel(app)
await demoSerial(app)

console.log('=== Part B: service vs event ===')
await app.plugin(Greeter)
await app.plugin(policy)

await app.inject(['greeter'], (ctx) => {
  greetViaPipeline(ctx, 'Cordis')
  greetViaPipeline(ctx, 'anon')
  greetViaPipeline(ctx, 'blocked')
})
