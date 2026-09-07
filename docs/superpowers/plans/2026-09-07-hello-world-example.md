# Hello-World Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal runnable `examples/hello-world` that shows Cordis `Context`, a functional plugin, and typed `on`/`emit` events.

**Architecture:** Register `examples/*` as a Yarn workspace package that depends on `cordis` via `workspace:*`. A single `index.ts` creates a root context, loads a function plugin that listens for `hello`, then emits once. No framework source changes.

**Tech Stack:** TypeScript, Yarn 4 workspaces, `cordis` (workspace), `tsx` for running the entry file.

**Spec:** `docs/superpowers/specs/2026-09-07-hello-world-example-design.md`

---

## File map

| File | Responsibility |
|------|----------------|
| `package.json` (root) | Add `examples/*` to `workspaces` |
| `examples/hello-world/package.json` | Package metadata, `cordis` workspace dep, `start` script |
| `examples/hello-world/index.ts` | Runnable demo: Context + plugin + event |
| `examples/hello-world/README.md` | Chinese usage notes |

---

### Task 1: Wire example into Yarn workspaces

**Files:**
- Modify: `package.json` (root `workspaces` array)
- Create: `examples/hello-world/package.json`

- [ ] **Step 1: Add `examples/*` to root workspaces**

In `/home/jeff/Documents/AI/coding-agent/cordis/package.json`, change:

```json
"workspaces": [
  "external/*",
  "packages/*"
]
```

to:

```json
"workspaces": [
  "external/*",
  "packages/*",
  "examples/*"
]
```

- [ ] **Step 2: Create example package.json**

Create `examples/hello-world/package.json`:

```json
{
  "name": "cordis-example-hello-world",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "start": "tsx index.ts"
  },
  "dependencies": {
    "cordis": "workspace:*"
  },
  "devDependencies": {
    "tsx": "npm:@cordiverse/tsx@4.19.3-fix.3"
  }
}
```

- [ ] **Step 3: Install so the workspace link resolves**

Run from repo root:

```bash
yarn install
```

Expected: exits 0; `examples/hello-world` is linked; `cordis` resolves to `packages/core`.

- [ ] **Step 4: Commit** (only if the user asked to commit)

```bash
git add package.json examples/hello-world/package.json yarn.lock
git commit -m "$(cat <<'EOF'
chore: add hello-world example workspace package

EOF
)"
```

---

### Task 2: Implement and verify the hello-world entry

**Files:**
- Create: `examples/hello-world/index.ts`
- Create: `examples/hello-world/README.md`

- [ ] **Step 1: Ensure `cordis` lib is built**

Run:

```bash
test -f packages/core/lib/index.js || yarn build
```

Expected: `packages/core/lib/index.js` exists afterward.

- [ ] **Step 2: Create `examples/hello-world/index.ts`**

```ts
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
```

- [ ] **Step 3: Run the example**

```bash
yarn workspace cordis-example-hello-world start
```

Expected stdout (exact line):

```
Hello, Cordis!
```

Expected exit code: 0.

If TypeScript/module augmentation fails on event name `'hello'`, switch the declared key to quoted form matching Cordis event style:

```ts
declare module 'cordis' {
  interface Events {
    'hello'(name: string): void
  }
}
```

and keep `ctx.on('hello', …)` / `ctx.emit('hello', 'Cordis')`.

- [ ] **Step 4: Create `examples/hello-world/README.md`**

```markdown
# Cordis Hello World

最小可运行示例：`Context`、函数插件、以及 `on` / `emit` 事件。

## 前置条件

在仓库根目录安装依赖，并确保已构建 `cordis`：

```bash
yarn install
yarn build
```

## 运行

```bash
yarn workspace cordis-example-hello-world start
```

预期输出：

```
Hello, Cordis!
```

## 代码说明

1. `new Context()` 创建根上下文
2. 函数插件 `greeter` 内用 `ctx.on('hello', …)` 注册监听
3. `await app.plugin(greeter)` 挂载插件
4. `app.emit('hello', 'Cordis')` 触发事件并打印问候语
```

- [ ] **Step 5: Commit** (only if the user asked to commit)

```bash
git add examples/hello-world/index.ts examples/hello-world/README.md
git commit -m "$(cat <<'EOF'
docs: add cordis hello-world runnable example

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `examples/hello-world/` layout | Task 1–2 |
| Root `workspaces` += `examples/*` | Task 1 |
| `workspace:*` dependency on `cordis` | Task 1 |
| Context + functional plugin + on/emit | Task 2 |
| Events module augmentation | Task 2 Step 2 |
| Chinese README + build/run notes | Task 2 Step 4 |
| Acceptance: install + start prints Hello | Task 1 Step 3, Task 2 Step 3 |
| No `packages/*` source edits | All tasks |
