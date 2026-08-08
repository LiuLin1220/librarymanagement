# 架构说明

## 整体数据流

浏览器运行 Vue 页面并调用 Express API。Express 校验 HTTP 输入后，把数据操作
交给仓库层；只有仓库层知道 MySQL 的表、视图、存储过程和中文列名。

```text
Vue 页面 -> src/api -> HTTP -> Express 路由 -> 数据仓库 -> MySQL
                                    |             |
                                  输入校验       SQL/字段映射
```

数据库结构、视图、存储过程、触发器和样例数据统一保存在
`other/librarymanagement.sql`。采购和销售写入后，库存由数据库触发器更新，Node
API 不重复修改库存。

## 后端组装

- `server/index.js` 是生产入口：读取配置、创建连接池/仓库/应用、监听端口并处理
  进程退出。
- `server/app.js` 只组装中间件和路由，不打开端口或数据库；测试从这里注入假仓库。
- `server/config/env.js` 解析环境变量，遇到缺失或越界值时在启动阶段直接失败。
- `server/config/database.js` 创建 `mysql2/promise` 连接池。
- `server/repositories/book-repository.js` 保存全部 SQL，并把数据库中文列名转换为
  现有 API 英文字段。
- `server/routes/books.js` 校验请求，并保留原有 API 路径。
- `server/middleware/error-handler.js` 统一公开错误结构，不把 SQL 或驱动内部信息
  返回给浏览器。

## 前端边界

- `src/api/http.js` 维护唯一 Axios 实例和 API 根地址。
- `src/api/books.js` 维护接口路径和请求/响应转换。
- 路由级 Vue 组件只负责加载状态、表单和用户提示，不直接构造 HTTP URL。

## 运行配置

把 `.env.example` 复制为 `.env.local` 后替换占位值。真实数据库凭据不得写入受
Git 跟踪的源文件。

前端在开发服务器启动时读取 `VUE_APP_API_BASE_URL`；后端在进程启动时读取
`PORT`、`CORS_ORIGIN` 和 `DB_*` 变量。

## 验证模型

`npm run check` 不需要数据库：它会检查 `src/`、`server/`、`test/`，并用假仓库
和进程内临时 HTTP 监听验证 API 契约。真实 MySQL 的视图、触发器和存储过程需要
单独的集成环境验证。
