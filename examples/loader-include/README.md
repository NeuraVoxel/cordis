# Cordis loader + include

演示**声明式配置**：用 YAML 驱动插件挂载，`!!js` 计算 config，以及 **overlay（patches）** 在不改基座文件的情况下覆盖条目。

直接引用仓库内已构建的 `packages/*/lib`。

## 理念：配置驱动挂载

前几个示例都在代码里 `app.plugin(...)`。真实应用更多是：

```text
cordis.yml（基座树）
    +  patches / overlay（环境、机房、本地覆盖）
    →  Loader 解析成 Entry 树
    →  每个 Entry 变成 fiber（可 inject / dispose）
```

| 角色 | 包 | 做什么 |
| --- | --- | --- |
| **Loader** | `@cordisjs/plugin-loader` | 配置树运行时：创建 / update / 解析模块 / 挂 fiber |
| **Include** | `@cordisjs/plugin-include` | 读 YAML/JSON、解析 `!!js`、应用 patches、与文件协调 |

`index.js` 只负责引导：`new Context()` → `plugin(Loader)` → `loader.create(include…)`。业务插件写在 `cordis.yml` 里。

## `!!js` 表达式

Include 把 YAML 标签 `!!js` 收成表达式节点；Loader 在**把 config 交给插件之前**用当前上下文插值（`interpolate`）。

本示例：

```yaml
greeting: !!js process.env.DEMO_GREETING ?? 'Hello'
```

- 未设环境变量 → `Hello, Cordis!`
- `DEMO_GREETING=Hi` → `Hi, Cordis!`

实务约定（与 primer 一致）：

- **`config` 内**适合 `!!js`（依赖就绪后再插值）
- **`disabled`**：本仓库 Entry 对 `disabled: !!js` 尚未按表达式求值（对象会当 truthy）；**用 patches 演示禁用**更准确
- `id` / `name` / `inject` 等元数据保持字面量

## Overlay（patches）

基座文件可以提交到仓库；机房 / 本地差异用 **按 `id` 寻址的补丁列表**叠上去，不改 YAML：

```js
patches: [
  { id: 'noisy', disabled: true },
]
```

本示例中 `cordis.yml` **启用** `noisy`，overlay **关掉**它——所以正常运行不应出现 `[noisy] loaded`。

常见 patch 能力：`disabled`、整段替换 `config`、`insert` 追加条目等（详见 `packages/include`）。

## 前置条件

```bash
yarn install
yarn build
```

## 运行

```bash
yarn workspace cordis-example-loader-include start
```

或：

```bash
node examples/loader-include/index.js
```

带表达式：

```bash
DEMO_GREETING=Hi yarn workspace cordis-example-loader-include start
```

预期输出（默认）：

```
[greeter] Hello, Cordis!
[main] greeter reported: Hello
```

`DEMO_GREETING=Hi` 时问候变为 `Hi`。不应出现 `[noisy] loaded`。

## 代码说明

1. `index.js`：设置 `baseUrl` 为示例目录，挂 Loader，再 create Include  
2. `cordis.yml`：声明 `greeter`（含 `!!js`）与 `noisy`  
3. `patches`：按 id 禁用 `noisy`  
4. `plugins/greeter.js`：打印 `config.greeting`，并用 `bail('demo/greeting')` 回传便于主流程检查  

## 和前序示例的差别

| | 代码挂载示例 | 本示例 |
| --- | --- | --- |
| 插件列表 | 写在 `index.js` | 写在 `cordis.yml` |
| 配置 | 构造参数 / 闭包 | YAML + `!!js` |
| 环境差异 | 改代码或 if | **patches overlay** |
| 引导 | `plugin(fn)` | `Loader` + `Include` |

下一步常见延伸：文件变更 `refresh`（热配）、HMR（下一学习项）。

## 延伸阅读

- 学习路线：`docs/notes/cordis-learning-roadmap.md`（§3 loader / include）
- [cordis-primer · Loader 配置](https://deepseek-harness.github.io/deepseek-harness/reference/cordis-primer)
- 仓库入口参考：`packages/core/bin.js`
