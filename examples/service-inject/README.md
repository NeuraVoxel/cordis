# Cordis Service + inject

演示**空间可组合性**：`Service` 提供能力，`inject` 声明依赖；加载顺序由依赖表达，而非手写启动序列。

直接引用仓库内已构建的 `packages/core/lib`。

## 理念：空间可组合性

Cordis 把动态组合拆成两轴。本示例只讲**空间轴**（spatial composability）：

| | 含义 |
| --- | --- |
| 问题 | 插件 A 提供能力，插件 B 要用它——谁先启动？依赖没了谁先停？ |
| 传统做法 | 手写启动顺序、全局单例、`require` 具体实现 |
| Cordis | 在 `Context` 上用**稳定 key** 提供服务；消费方用 `inject` **声明**所需 key；运行时按声明反应式启停 |

要点：

1. **按 key 协作，不按实现协作**  
   其他插件写 `ctx.clock`，而不是 `import { Clock } from './clock.js'`。实现可替换，槽位名不变。

2. **依赖是 coeffect（所需上下文），不是手动编排**  
   `static inject = ['clock']` 告诉运行时：「没有 `clock` 就不要激活我」。提供方出现、消失或被替换时，消费方会随之激活 / 卸载 / 重载。

3. **加载顺序由依赖图表达**  
   本示例故意**先挂 Greeter、再挂 Clock**。Greeter 的 fiber 先处于 PENDING；`clock` 就绪后才构造并进入 ACTIVE。你不必写 `startClock().then(startGreeter)`。

4. **Service 是「带生命周期的提供方」**  
   `extends Service` + `super(ctx, 'name')` 会把实例挂到 `ctx.name`，并纳入插件 fiber：卸载时提供一并撤销。

时间轴（可逆副作用 / `effect`）是下一示例主题；这里只需记住：provide / inject 解决的是「组件之间怎么摆、何时就绪」。

## 核心 API 对照

| 概念 | 本示例写法 | 作用 |
| --- | --- | --- |
| 提供（provide） | `super(ctx, 'clock')` | 在 Context 上占据 `ctx.clock` |
| 声明依赖（inject） | `static inject = ['clock']` | 等依赖就绪才启动；可访问 `this.ctx.clock` |
| 挂载 | `app.plugin(Clock)` / `app.plugin(Greeter)` | 每个插件实例对应一个 fiber |
| 注入作用域 | `app.inject(['greeter'], (ctx) => …)` | 临时 fiber：在回调内合法使用已声明的服务 |

访问规则（简化）：在声明了 `inject` 的 fiber 内访问 `ctx.xxx`；根上随意摸未注入的服务会不符合 Cordis 的追踪模型。日常插件代码里：**要用哪个服务，就写进 `inject`**。

## 前置条件

```bash
yarn install
yarn build
```

## 运行

```bash
yarn workspace cordis-example-service-inject start
```

或：

```bash
node examples/service-inject/index.js
```

预期输出（时间戳会变）：

```
[greeter] waiting for clock…
[clock] provided
[greeter] activated
Hello, Cordis! @ 2026-09-07T02:00:00.000Z
```

注意日志顺序：先出现「waiting」，再 `clock` provided，最后 `greeter` activated——说明消费方挂得更早，但真正执行构造是在依赖满足之后。

## 代码说明

1. `Clock` 以 `super(ctx, 'clock')` 提供 `ctx.clock` 与 `now()`
2. `Greeter` 用 `static inject = ['clock']`，经 `this.ctx.clock` 拼出问候语
3. **先** `plugin(Greeter)`（不 `await`）——fiber PENDING，等 `clock`
4. **再** `plugin(Clock)`——提供就绪后 Greeter 才构造 / 激活；再 `await greeterFiber`
5. `app.inject(['greeter'], …)` 在注入作用域内调用 `hello`

## 和 hello-world 的差别

| | `hello-world` | 本示例 |
| --- | --- | --- |
| 形态 | 函数插件 | `Service` 子类 |
| 协作 | 事件 `on` / `emit` | 服务槽 + `inject` |
| 强调 | Context 与事件 | 空间依赖与反应式启停 |

事件适合广播 / 拦截；稳定能力（时钟、数据库、LLM 客户端）更适合做成 Service，用 `inject` 串起来。

## 延伸阅读

- 仓库学习路线：`docs/notes/cordis-learning-roadmap.md`（§2.4 Service 与 inject）
- [cordis-primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)「五个核心概念」中的上下文与 inject
