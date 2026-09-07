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
