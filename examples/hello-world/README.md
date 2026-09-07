# Cordis Hello World

最小可运行示例（纯 JS）：`Context`、函数插件、以及 `on` / `emit` 事件。  
直接引用仓库内已构建的 `packages/core/lib`。

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

或：

```bash
node examples/hello-world/index.js
```

预期输出：

```
Hello, Cordis!
```

## 代码说明

1. 从 `../../packages/core/lib/index.js` 导入 `Context`
2. 函数插件 `greeter` 内用 `ctx.on('hello', …)` 注册监听
3. `await app.plugin(greeter)` 挂载插件
4. `app.emit('hello', 'Cordis')` 触发事件并打印问候语
