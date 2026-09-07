# Cordis 事件分发与 waterfall

演示五种事件分发模式、`waterfall` 中间件语义，以及**服务方法 vs 事件拦截**的分工。

直接引用仓库内已构建的 `packages/core/lib`。

## 理念：能力走服务，拦截走事件

| | 服务方法（Service） | 事件（Events） |
| --- | --- | --- |
| 适合 | 稳定能力：打招呼、查库、调模型 | 观察、策略、包装、多方扩展 |
| 形态 | `ctx.greeter.hello(name)` | `emit` / `waterfall` / `bail` … |
| 扩展方式 | 换实现（同一 key）或再 inject | 再挂监听器，不必改原服务 |

本示例 Part B：`Greeter.hello` 只负责「打印问候」；改名、拦截用 `greet/before` 的 waterfall。策略插件不 import Greeter 实现，只声明事件约定。

## 五种分发模式

每种事件应固定一种分发方式，调用方与监听方共用同一约定。

| 模式 | await？ | 顺序 | 返回值 | 典型用途 |
| --- | --- | --- | --- | --- |
| `emit` | 否 | 注册序依次观察 | 无 | 通知、日志、副作用广播 |
| `parallel` | 是 | **并行** | 无（失败聚合成 `AggregateError`） | 彼此独立的异步观察 |
| `serial` | 是 | 注册序，可 await | 遇到 bail 值则返回 | 异步流水线，可中途停 |
| `bail` | 否 | 注册序 | 首个 bail 值 | 同步「谁处理谁返回」 |
| `waterfall` | 否* | 洋葱环绕（`next`） | 有 | 中间件：包装 / 改写 / 短路 |

\*监听器本身可以是 async，此时需 `await ctx.waterfall(...)`。

### bail 值

`null`、`false`、`undefined` **不算** bail；其它返回值会让 `bail` / `serial` 停止并作为结果。本示例 Part B 用 `null` 表示「策略拒绝」，由主流程自行判断跳过（不是 bail 语义）。

### waterfall 要点

- 签名：`ctx.waterfall(name, ...args, terminal)`——**最后一个参数是终端函数**（最内层）。
- 监听器收到 `(...args, next)`：调用 `next()` 进入下游；**不调用**则短路，下游（含 terminal）不跑。
- `next()` 的返回值可被当前层包装后再向外返回。
- 策略层可短路；纯观察 / 标注层必须 `next()`，否则会吞掉后面的逻辑。
- `next()` 不可重复调用。

## 前置条件

```bash
yarn install
yarn build
```

## 运行

```bash
yarn workspace cordis-example-event-dispatch start
```

或：

```bash
node examples/event-dispatch/index.js
```

预期输出（节选，顺序以实际为准）：

```
=== Part A: dispatch modes ===
[emit] listener-1: ping
[emit] listener-2: ping
[bail] miss (undefined is not bail)
[bail] hit
[bail] result = answer
[waterfall] middle short-circuits on "raw"
[waterfall] outer saw "short:raw"
[waterfall] short result = wrapped(short:raw)
[waterfall] coop result = HI-!
[parallel] fast: ping
[parallel] slow: ping
[parallel] all settled
[serial] step-1 (no bail)
[serial] step-2 returns bail value
[serial] result = stopped-here
=== Part B: service vs event ===
[policy] allow "Cordis"
Hello, Cordis!
[policy] allow "Guest"
Hello, Guest!
[policy] blocked guest — short-circuit
[main] greet skipped
```

## 代码说明

**Part A**

1. `emit`：两个监听依次打印  
2. `bail`：跳过 `undefined`，命中 `'answer'` 后停止  
3. `waterfall`：外层包装 + 中层短路；另一条链协作拼出 `HI-!`  
4. `parallel`：快/慢监听并行，主流程 await 全部结束  
5. `serial`：第二步返回字符串后第三步不执行  

**Part B**

1. `Greeter` 提供 `ctx.greeter.hello`  
2. `policy` 挂在 `greet/before`：可改名（`anon`→`Guest`）或短路（`blocked`）  
3. `greetViaPipeline`：先 waterfall 策略，再调服务方法  

## 和前序示例的差别

| | `hello-world` | `service-inject` | `effect-lifecycle` | 本示例 |
| --- | --- | --- | --- | --- |
| 焦点 | 基础 `on`/`emit` | 空间依赖 | 可逆副作用 | **分发模式 + 拦截分工** |
| 事件 | 单一 emit | 无 | 无 | 五种模式 + waterfall |
| 服务 | 无 | provide/inject | 无 | 方法 = 能力，事件 = 策略 |

## 延伸阅读

- 学习路线：`docs/notes/cordis-learning-roadmap.md`（§2.5 Events）
- [cordis-primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer) 分发模式与 Waterfall 语义
