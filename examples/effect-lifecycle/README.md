# Cordis effect / fiber / dispose

演示**时间可组合性**：插件卸载时，其副作用须**完全可逆**；Cordis 不管的外部资源必须包进 `ctx.effect()`。

直接引用仓库内已构建的 `packages/core/lib`。

## 理念：时间可组合性

Cordis 动态组合的另一轴是**时间轴**（temporal composability）：

| | 含义 |
| --- | --- |
| 问题 | 插件被卸载、热替换或依赖丢失时，它留下的定时器、连接、监听会不会泄漏？ |
| 传统做法 | 靠约定在 `onDestroy` 里手工清理，漏一处就脏一次 |
| Cordis | 每次注册副作用时附带 **disposer**；运行时在 unload 时按账本回滚 |

要点：

1. **Effect = 带逆操作的副作用**  
   `ctx.effect(() => { /* 获取资源 */ return () => { /* 释放 */ } })`  
   加载时跑函数体，卸载时跑返回的 disposer。你通常**不必**自己调用 disposer。

2. **Fiber = 一次插件实例的生命周期句柄**  
   `ctx.plugin(fn)` 返回 fiber。它经历大致状态：

   ```
   PENDING → LOADING → ACTIVE → UNLOADING → DISPOSED
                    ↘ FAILED
   ```

   - `PENDING`：还在等 `inject` 依赖（见 `service-inject` 示例）  
   - `ACTIVE`：插件已跑完，effect 已登记  
   - `fiber.dispose()`：进入卸载，等所有清理（含 async）结束后 resolve，并递归卸掉子插件

3. **外部资源必须可逆**  
   `ctx.on`、`ctx.plugin`、Service provide 等**已经是** effect，unload 会自动撤销。  
   `setInterval` / `setTimeout` / 裸 TCP / 文件 watch 等 Cordis **不知道**——必须包进 `ctx.effect()`，否则 dispose 后仍会 tick / 占句柄。

4. **释放顺序（实用提醒）**  
   同步 disposer 大致按注册逆序执行；多个 **async** disposer 会并发。若必须严格串行，把步骤放进**同一个** disposer 里 `await`。

空间轴（`inject` / Service）解决「谁依赖谁、何时就绪」；本示例解决「走了之后世界是否恢复原样」。

## 核心 API 对照

| 概念 | 本示例写法 | 作用 |
| --- | --- | --- |
| 登记可逆副作用 | `ctx.effect(() => { …; return disposer }, label?)` | 卸载时自动清理 |
| 挂载插件 | `await app.plugin(heartbeat)` | 得到 fiber |
| 主动卸载 | `await fiber.dispose()` | 跑完所有 disposer |

## 前置条件

```bash
yarn install
yarn build
```

## 运行

```bash
yarn workspace cordis-example-effect-lifecycle start
```

或：

```bash
node examples/effect-lifecycle/index.js
```

预期输出（`tick` 次数约 3，与定时有关）：

```
[heartbeat] loading
tick
tick
tick
[heartbeat] cleaned up
[main] fiber disposed
```

若去掉 `ctx.effect`、直接 `setInterval`，`dispose` 之后仍可能继续 `tick`——那就是时间不可组合的反例。

## 代码说明

1. `heartbeat` 在 `effect` 里启动 `setInterval`，返回 `clearInterval`
2. `plugin(heartbeat)` 挂载并拿到 fiber；期间打印若干 `tick`
3. 约 700ms 后 `fiber.dispose()` → 触发 cleaned up，进程可干净结束
4. 可选第二参数 `'heartbeat-timer'` 给 effect 打标签，便于调试 `getEffects()`

## 和前两个示例的差别

| | `hello-world` | `service-inject` | 本示例 |
| --- | --- | --- | --- |
| 轴 | 入门：Context + 事件 | **空间**：provide / inject | **时间**：effect / dispose |
| 焦点 | 怎么挂上监听 | 依赖就绪才激活 | 卸载时副作用可逆 |
| 句柄 | 较少接触 fiber | fiber 多为 PENDING→ACTIVE | 显式 `fiber.dispose()` |

## 延伸阅读

- 仓库学习路线：`docs/notes/cordis-learning-roadmap.md`（§2.2 Fiber、§2.3 Effect）
- [Lifecycle and effects](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/02-lifecycle-and-effects.md)（DeepSeek Harness 教程）
- [cordis-primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)「注册是可逆的副作用」
