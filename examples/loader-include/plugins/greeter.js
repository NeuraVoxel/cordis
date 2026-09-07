export const name = 'greeter'

export function apply(ctx, config) {
  const text = `${config.greeting}, Cordis!`
  console.log(`[greeter] ${text}`)
  ctx.on('demo/greeting', () => config.greeting)
}
