import { Context } from '../../packages/core/lib/index.js'

/**
 * Cordis 四种核心事件分发模式
 *   emit      — 广播观察，无返回值
 *   bail      — 同步，首个 bail 值即返回
 *   serial    — 异步串行，首个 bail 值即返回
 *   waterfall — 洋葱中间件：next() 进下游，可包装 / 短路
 *
 * bail 值：null / false / undefined 不算；其它返回值会停住 bail / serial。
 */

// --- 1. emit：通知 / 副作用，不关心返回值 ---------------------------------------

function demoEmit(ctx) {
  console.log('\n=== emit ===')
  ctx.on('demo/emit', (msg) => console.log(`[emit] A: ${msg}`))
  ctx.on('demo/emit', (msg) => console.log(`[emit] B: ${msg}`))
  ctx.emit('demo/emit', 'ping')
}

// --- 2. bail：同步「谁先给出有效结果谁赢」---------------------------------------

function demoBail(ctx) {
  console.log('\n=== bail ===')
  ctx.on('demo/bail', () => {
    console.log('[bail] miss (undefined 不算 bail)')
  })
  ctx.on('demo/bail', () => {
    console.log('[bail] hit')
    return 'answer'
  })
  ctx.on('demo/bail', () => {
    console.log('[bail] 不应执行')
  })
  console.log(`[bail] result = ${ctx.bail('demo/bail')}`)
}

// --- 3. serial：异步流水线，遇 bail 值中途停 ------------------------------------

async function demoSerial(ctx) {
  console.log('\n=== serial ===')
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-1 (无 bail，继续)')
  })
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-2 返回 bail 值')
    return 'stopped-here'
  })
  ctx.on('demo/serial', async () => {
    console.log('[serial] step-3 不应执行')
  })
  const result = await ctx.serial('demo/serial')
  console.log(`[serial] result = ${result}`)
}

// --- 4. waterfall：洋葱环绕；不调 next() 则短路 ---------------------------------

function demoWaterfall(ctx) {
  console.log('\n=== waterfall（短路）===')
  // 注册序：先注册的更外层
  ctx.on('demo/waterfall', (value, next) => {
    const out = next()
    console.log(`[waterfall] outer 看到 "${out}"`)
    return `wrapped(${out})`
  })
  ctx.on('demo/waterfall', (value, next) => {
    console.log(`[waterfall] middle 短路，value="${value}"`)
    return `short:${value}` // 不调 next → inner / terminal 不跑
  })
  ctx.on('demo/waterfall', (value, next) => {
    console.log('[waterfall] inner 不应执行')
    return next()
  })

  const short = ctx.waterfall('demo/waterfall', 'raw', () => 'terminal')
  console.log(`[waterfall] short result = ${short}`)

  console.log('\n=== waterfall（协作改写）===')
  ctx.on('demo/waterfall-coop', (value, next) => value.toUpperCase() + next())
  ctx.on('demo/waterfall-coop', (value, next) => `-${next()}`)
  const coop = ctx.waterfall('demo/waterfall-coop', 'hi', () => '!')
  console.log(`[waterfall] coop result = ${coop}`) // HI-!
}

// --- boot ------------------------------------------------------------------------

const app = new Context()

await app.plugin((ctx) => {
  demoEmit(ctx)
  demoBail(ctx)
  demoWaterfall(ctx)
})

await demoSerial(app)
console.log('')
