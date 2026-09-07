# Cordis 学习知识点路线

> 整理日期：2026-09-07  
> 范围：本仓库 `cordis`（meta-framework）+ 官方入门材料  
> 目标：弄清「要学什么、按什么顺序学」，不是教程正文

Cordis 是**时空可组合性**元框架：插件可动态挂载 / 卸载 / 热替换，且副作用可逆、依赖可声明并反应式管理。API 仍在演进中。

---

## 1. 范式层（先建立心智模型）

| 知识点 | 学什么 | 为何重要 |
| --- | --- | --- |
| Spatiotemporal composability | 动态组合的两个正交轴 | 后面所有 API 都在落实这两件事 |
| **Temporal** 可组合性 | 组件移除时，其副作用须**完全可逆**（revertible effects） | 解释为何 `ctx.on` / `ctx.effect` 会自动 teardown，以及 HMR 不泄漏 |
| **Spatial** 可组合性 | 组件声明依赖，运行时按依赖**反应式**启停（reactive coeffects） | 解释 `inject`、服务就绪等待、依赖丢失时卸载 |
| Context 范式 | effect 上下文与 coeffect 上下文统一为同一 `Context` | 所有注册与查找都经 `ctx`，组件彼此可交错而不互相污染 |
| Component = Plugin | 插件 = 带 effect + coeffect 规格的组件 | 代码里的「插件」对应论文里的 component |

**建议阅读**：论文摘要与引言（[arXiv:2608.25512](https://arxiv.org/abs/2608.25512)），再对照 primer 的「五个核心概念」。

---

## 2. 核心运行时（`packages/core`）

### 2.1 Context — 统一容器

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| `new Context()` | `context.ts` | 根上下文如何创建；`root` / Proxy 访问服务 |
| `ctx.extend` / `isolate` / `intercept` | `context.ts` | 派生上下文、服务隔离标签、配置拦截链 |
| 通过 key 用服务 | Reflect + Context 声明合并 | `ctx.foo` 是查找，不是 import 实现 |

### 2.2 Plugin 与 Fiber — 挂载与生命周期

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| 函数插件 / 对象插件 / `Service` 子类 | `registry.ts` | 三种插件形态；`apply(ctx)` vs 直接函数 |
| `ctx.plugin(...)` | `registry.ts` / `fiber.ts` | 挂载返回 **fiber**（单次插件实例句柄） |
| Fiber 状态机 | `fiber.ts` → `FiberState` | `PENDING → LOADING → ACTIVE → … → DISPOSED` |
| `fiber.dispose()` | `fiber.ts` | 卸载自身及子插件；async disposer 语义 |
| Config 校验 | `fiber.ts` + Standard Schema | 插件 `Config`、校验失败 `ValidationError` |

### 2.3 Effect — 可逆副作用（时间轴）

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| `ctx.effect()` | `fiber.ts` | 注册副作用并返回 disposer；unload 时自动调用 |
| 内建即 effect | `events` / `plugin` / provide | `on`、子插件、服务注册默认已纳入跟踪 |
| 外部资源包裹 | 实践约定 | timer、连接、文件监听等须包进 `effect` |
| 释放顺序 | 教程 / fiber | 同步 disposer 逆序；多个 **async** disposer 并发——需严格顺序时放进同一个 disposer |

### 2.4 Service 与 inject — 空间依赖（空间轴）

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| `Service` 基类 | `service.ts` | `provide` 名、`ctx.xxx` 稳定槽位、callable service |
| `inject` / `@Inject` | `registry.ts` | 声明依赖；就绪才启动；依赖变化触发启停 |
| Reflect / provide | `reflect.ts` | 服务如何挂到 Context、filter / isolate 可见性 |
| `Service[symbols.resolveConfig]` | `service.ts` | intercept 配置合并 |

### 2.5 Events — 类型化通信

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| 声明合并 `Events` | `events.ts` | 事件名与签名的 TypeScript 扩展 |
| `on` / `once` | `events.ts` | 监听即 effect；`prepend` / `global` |
| 五种分发模式 | `DispatchMode` | 每种事件只能用对应方法分发（约定的一部分） |

| 模式 | await？ | 顺序 | 返回值 |
| --- | --- | --- | --- |
| `emit` | 否 | 注册序观察 | 无 |
| `waterfall` | 否 | 中间件环绕（`next`） | 有 |
| `parallel` | 是 | 并行 | 无 |
| `serial` | 是 | 注册序 | 有 |
| `bail` | 否 | 到首个 bail 值停止 | 有 |

**Waterfall 要点**：监听器收 `(...args, next)`；调 `next()` 进下游；不调则短路。策略可短路；纯观察必须委托。

### 2.6 其余核心模块

| 知识点 | 对应源码 | 学什么 |
| --- | --- | --- |
| Registry | `registry.ts` | 插件运行时表、Inject 解析 |
| Logger | `logger.ts` | `ctx.logger`、level、exporter |
| Utils / symbols | `utils.ts` | tracker、traceable、DisposableList、内部 symbols |
| 内建事件 | `events.ts` | 如 `internal/update`、`internal/listener`、`internal/dispatch` |

---

## 3. 生态包（仓库 `packages/*`）

| 包 | npm 名 | 学什么 |
| --- | --- | --- |
| `loader` | `@cordisjs/plugin-loader` | 声明式配置加载、插件树、配置协调 |
| `include` | `@cordisjs/plugin-include` | 配置片段 / `!!js` 表达式、嵌套行与 overlay |
| `hmr` | `@cordisjs/plugin-hmr` | 热替换如何依赖可逆 effect |
| `group` | `@cordisjs/plugin-group` | 插件分组 |
| `timer` | `@cordisjs/plugin-timer` | 定时服务（典型 effect 封装） |
| `logger-console` | `@cordisjs/plugin-logger-console` | 控制台 exporter（Node / browser） |
| `create` | `create-cordis` | 脚手架起步应用 |
| `utils` | `@cordisjs/utils` | 内部工具（私有包） |

Loader / Include 实务：依赖注入激活后再插值 `config`；`disabled` 基于 loader 上下文；环境相关选择用 overlay。

---

## 4. 建议学习顺序

```text
① 跑通 examples/hello-world
      Context + 函数插件 + on/emit
        ↓
② Service 提供与 inject 依赖
      空间可组合性；加载顺序由依赖表达
        ↓
③ effect / fiber 生命周期 / dispose
      时间可组合性；外部资源必须可逆
        ↓
④ 五种事件分发 + waterfall 中间件语义
      服务方法 vs 事件拦截的分工
        ↓
⑤ loader + include 声明式配置
      配置驱动挂载、表达式与 overlay
        ↓
⑥ HMR（+ group / timer 等）
      热更 = 卸载 + 再挂载，验证 effect 正确性
        ↓
⑦ 论文 + 源码对照（core 模块）
      把 API 映射回形式化定义
```

**最小实践检查清单**

- [ ] 能手写函数插件并用 `plugin` / `emit` 跑通
- [ ] 能写 `Service` + `inject`，理解「等依赖就绪」
- [ ] 能用 `ctx.effect` 包一层外部资源，确认 unload 后无泄漏
- [ ] 能区分 `emit` / `serial` / `bail` / `waterfall` 选用场景
- [ ] 能读懂一份 loader 风格的插件配置（含 disabled / inject）

---

## 5. 实践规则（写插件时记住）

1. **行为进插件**：能力挂在稳定服务槽（如 `ctx.tools`），不要散落全局单例。
2. **拦截用事件，直接能力用服务方法**。
3. **每个注册都有 disposer**：`effect` 返回，或用框架 API 自动跟踪。
4. **teardown 有序时合并进同一 effect**（尤其多个 async 清理）。
5. **只在必须早于普通监听时用 `prepend: true`**。

---

## 6. 资源索引

| 资源 | 链接 / 路径 | 用途 |
| --- | --- | --- |
| 本仓库示例 | `examples/hello-world/` | 最小 Context + 插件 + 事件 |
| 核心源码 | `packages/core/src/` | API 真相来源 |
| Cordis Primer | [cordis-primer](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer) | 五概念 + 分发模式速查 |
| Harness 教程 | [deepseek-harness `docs/cordis-tutorial`](https://github.com/deepseek-ai/deepseek-harness/tree/master/docs/cordis-tutorial) | 分章实践（lifecycle、events 等） |
| 论文 | [arXiv:2608.25512](https://arxiv.org/abs/2608.25512) · [paper repo](https://github.com/cordiverse/paper) | 形式化时空可组合性 |
| 本仓库设计笔记 | `docs/superpowers/specs/2026-09-07-hello-world-example-design.md` | 示例边界（刻意不含 Service/loader） |

---

## 7. 与「还不用先学」的边界

当前仓库 hello-world **有意不覆盖**：Service / inject、loader 配置、HMR。这些是进阶主线，不要和第一步混在一起。

官方文档仍在建设中；以 **primer + 源码 + 论文** 三角对照最稳。
