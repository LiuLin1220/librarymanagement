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

## 容器运行拓扑

生产容器把 Vue 构建结果和 Express 放在同一个非 root `app` 镜像中。浏览器只访问
一个宿主机端口，静态页面和 `/api` 同源；`app` 通过 Compose 服务名 `db` 访问
MySQL。MySQL 没有宿主机端口，数据写入命名卷 `db-data`，密码通过只授予对应
服务的文件型 secret 挂载。

MySQL 健康检查以目标表已经创建为准，应用就绪检查还会执行 `SELECT 1`。因此进程
存活、数据库初始化完成和端到端 HTTP 验收是三个独立状态，不互相冒充。

## 后端组装

- `server/index.js` 是生产入口：读取配置、创建连接池/仓库/应用、监听端口并处理
  进程退出；容器模式还注入数据库就绪检查和静态文件目录。
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
`PORT`、`CORS_ORIGIN`、`STATIC_DIRECTORY` 和 `DB_*` 变量。`DB_PASSWORD_FILE`
用于从容器 secret 读取密码，不能和非空 `DB_PASSWORD` 同时设置。

容器构建时把前端 API 根固定为相对路径 `/api`，运行时由 Express 提供静态页面；
本地开发仍保留两个开发服务器和可配置的绝对 API 地址。

## 验证模型

`npm run check` 不需要数据库：它会检查 `src/`、`server/`、`test/`，并用假仓库
和进程内临时 HTTP 监听验证 API 契约。真实 MySQL 的视图、触发器和存储过程需要
单独的集成环境验证。

Compose 静态解析、镜像构建、容器健康和数据重启持久化属于逐层增加的证据。完整
运行验收见 [container-deployment.md](container-deployment.md)。
