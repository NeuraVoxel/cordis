# Cordis 四种事件分发模式

演示 `emit` / `bail` / `serial` / `waterfall` 的差异。直接引用仓库内已构建的 `packages/core/lib`。

## 对比

| 模式 | await？ | 形状 | 返回值 | 典型用途 |
| --- | --- | --- | --- | --- |
| `emit` | 否 | 注册序依次观察 | 无 | 通知、日志、副作用 |
| `bail` | 否 | 注册序，遇 bail 值停 | 首个 bail 值 | 同步「谁处理谁返回」 |
| `serial` | 是 | 注册序，可 await，遇 bail 值停 | 首个 bail 值 | 异步流水线 |
| `waterfall` | 否* | 洋葱环绕（`next`） | 有（可包装） | 中间件：改写 / 包装 / 短路 |

\*监听器若是 async，需 `await ctx.waterfall(...)`。

### bail 值

`null`、`false`、`undefined` **不算** bail；其它返回值会让 `bail` / `serial` 停止并作为结果。

### waterfall 要点

- `ctx.waterfall(name, ...args, terminal)` —— 最后一项是终端函数（最内层）。
- 监听器 `(...args, next)`：调 `next()` 进下游；不调则短路。
- `next()` 的返回值可被当前层包装后再向外返回。
- 与 `serial` 的区别：`serial` 是直线步骤；`waterfall` 是环绕包装。

## 前置条件

```bash
yarn install
yarn build
```

## 运行

```bash
node examples/event-dispatch/index.js
# 或
cd examples/event-dispatch && yarn start
```

## 预期输出（节选）

```text
=== emit ===
[emit] A: ping
[emit] B: ping

=== bail ===
[bail] miss (undefined 不算 bail)
[bail] hit
[bail] result = answer

=== waterfall（短路）===
[waterfall] middle 短路，value="raw"
[waterfall] outer 看到 "short:raw"
[waterfall] short result = wrapped(short:raw)

=== waterfall（协作改写）===
[waterfall] coop result = HI-!

=== serial ===
[serial] step-1 (无 bail，继续)
[serial] step-2 返回 bail 值
[serial] result = stopped-here
```

## 自测

- [ ] `emit` 两个监听器都执行
- [ ] `bail` 第二个返回后第三个不跑
- [ ] `serial` 异步串行，bail 后后续不跑
- [ ] `waterfall` 短路时 inner/terminal 不跑；协作链能拼出 `HI-!`
