# Design: Cordis Hello-World Example

**Date:** 2026-09-07  
**Status:** Approved for planning  
**Scope:** Minimal runnable usage example under `examples/hello-world`

## Goal

Add a contributor-facing hello-world that demonstrates Cordis basics:

- `Context`
- A functional plugin
- Simple typed events (`on` / `emit`)

The example consumes the workspace `cordis` package only. It must not require changes to `packages/*` source.

## Non-goals

- `Service` / `inject`
- Loader / config-driven plugins
- HMR
- Tests for the example
- Publishing the example as an npm package
- Modifying framework source to support the example

## Layout

```
examples/hello-world/
  package.json
  index.ts
  README.md
```

Root `package.json` `workspaces` gains `examples/*` so Yarn can resolve `"cordis": "workspace:*"`.

## Runtime behavior

`index.ts`:

1. Create `new Context()`
2. Define function plugin `greeter(ctx)` that registers `ctx.on('hello', …)` and logs `Hello, ${name}!`
3. `await ctx.plugin(greeter)`
4. `ctx.emit('hello', 'Cordis')`
5. Declare a minimal `Events` module augmentation for `'hello'(name: string): void`

Expected stdout: `Hello, Cordis!`

## package.json

- `name`: `cordis-example-hello-world`
- `private`: true
- `type`: `module`
- `dependencies.cordis`: `workspace:*`
- `devDependencies.tsx`: align with root (e.g. `npm:@cordiverse/tsx@4.19.3-fix.3`)
- `scripts.start`: `tsx index.ts`

## README

Short Chinese notes covering:

- What the example shows
- Prerequisite: build `cordis` if `packages/core/lib` is missing (`yarn build` from repo root)
- Run: from repo root, `yarn install` then `yarn workspace cordis-example-hello-world start`

## Acceptance

1. `yarn install` at repo root resolves `cordis@workspace:*` for the example
2. `yarn workspace cordis-example-hello-world start` prints `Hello, Cordis!`
3. No edits under `packages/*` are required for the example to work (aside from an already-built `lib` output)

## Out of scope follow-ups

Deeper examples (Service/inject, loader) can be separate `examples/*` packages later.
