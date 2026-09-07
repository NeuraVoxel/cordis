# Cordis HMR（+ group / timer）

演示**热模块替换**：改插件源码 → 旧 fiber **卸载**（effect / interval 可逆清理）→ 新模块 **再挂载**。  
顺带使用 `@cordisjs/plugin-timer`、`@cordisjs/plugin-group`。

直接引用仓库内已构建的 `packages/*/lib`。

## 理念：热更 = 卸载 + 再挂载

HMR 不是「原地打补丁」。对 Cordis 而言：

```text
文件变更 (chokidar)
  → 找出受影响的插件 Entry
  → dispose 旧 fiber（跑完所有 disposer / interval / on）
  → 重新 import 模块
  → 用新 exports 再 plugin（新 fiber）
```

因此 **时间可组合性**（`effect-lifecycle`）是 HMR 正确的前提：外部资源必须挂在 effect 上。本示例用 `ctx.interval`（timer 服务内部已 `ctx.effect`）验证——卸载后不应再出现旧 `value` 的 tick。

| 组件 | 角色 |
| --- | --- |
| **timer** | 提供 `ctx.interval` / `timeout`（可逆定时器） |
| **hmr** | 监视 `root`，防抖后 partial reload；**依赖 timer + loader** |
| **group** | 配置树分组（本示例把业务插件挂在 `app` 组下） |
| **heartbeat** | 业务插件：`load` / `tick` / `unload` 日志 + `demo/get` |

## 前置条件

```bash
yarn install
yarn build
```

**必须**用 `--expose-internals` 启动（`package.json` 的 `start` 已带上）。否则 Loader 拿不到 Node module internals，插件模块热更会禁用（仅配置文件 refresh 可能仍可用）。

## 运行

```bash
yarn workspace cordis-example-hmr-reload start
```

或：

```bash
node --expose-internals examples/hmr-reload/index.js
```

示例会**临时改写** `plugins/heartbeat.js` 中的 `value`，热更结束后在 `finally` 里还原。

预期日志（节选，tick 次数可能略有出入）：

```
[I] hmr watching [ '.' ]
[heartbeat] load v1
[main] booted with v1
[heartbeat] unload v1
[I] hmr reload plugin at plugins/heartbeat.js
[heartbeat] load v2
[main] after hmr: v2
[heartbeat] tick v2
…
[heartbeat] unload v2
[main] done (plugin file restored)
```

关键观察：`unload v1` 出现在 `load v2` **之前**；热更后只有 `tick v2`，没有残留的 `tick v1`。

## 代码说明

1. `cordis.yml`：timer → hmr → group(`heartbeat` + `inject: [timer]`)  
2. `heartbeat.js`：`interval` 打 tick；额外 `effect` 打印 unload  
3. `index.js`：等到 `demo/get === 'v1'` → 改文件为 `v2` → 等到热更 → 还原文件并 dispose  

## 和前序示例的差别

| | `effect-lifecycle` | `loader-include` | 本示例 |
| --- | --- | --- | --- |
| 卸载触发 | 手动 `fiber.dispose()` | 进程结束 | **文件变更 → HMR** |
| 定时器 | 手写 `setInterval` + `effect` | 无 | **`ctx.interval`（timer 插件）** |
| 配置树 | 无 | YAML + patches | YAML + **group** + hmr |

## 延伸阅读

- 学习路线：`docs/notes/cordis-learning-roadmap.md`（§4 ⑥ HMR）
- `packages/hmr` 源码与 `packages/hmr/tests`
- 时间轴基础：`examples/effect-lifecycle`
