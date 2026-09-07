export let value = 'v1'

export const name = 'heartbeat'

export function apply(ctx) {
  console.log(`[heartbeat] load ${value}`)

  ctx.on('demo/get', () => value)

  // timer.interval is already an effect — cleared automatically on unload / HMR.
  ctx.interval(() => {
    console.log(`[heartbeat] tick ${value}`)
  }, 200)

  ctx.effect(() => () => {
    console.log(`[heartbeat] unload ${value}`)
  }, 'heartbeat-unload-marker')
}
