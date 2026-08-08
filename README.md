# 图书销售管理系统

这是一个数据库课程设计项目，包含 Vue 管理页面、Express API 和 MySQL
数据模型。系统支持图书基础信息维护、采购/销售登记、库存查看和月度销售统计。

![图书基础信息页面](images/01.jpg)

![月度销售统计页面](images/02.jpg)

## 技术结构

- 前端：Vue 2.7、Vue Router、Element UI、Axios
- 后端：Node.js、Express 5、`mysql2/promise`
- 数据库：MySQL 8，结构和样例数据见 `other/librarymanagement.sql`

模块边界和数据流见 [docs/architecture.md](docs/architecture.md)，接口约定见
[docs/api.md](docs/api.md)，重构进度和剩余债务见
[docs/refactor-plan.md](docs/refactor-plan.md)。

## 环境要求

- Node.js 22 LTS（`.nvmrc` 和 CI 使用该版本）
- npm 10 或更高版本
- MySQL 8（仅真实数据库运行需要；lint 和单元测试不需要数据库）

## 安装

```powershell
npm ci
```

## 配置

复制环境变量模板：

```powershell
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
```

然后编辑 `.env.local`，至少填写 `DB_USER`、`DB_PASSWORD` 和 `DB_NAME`。
真实凭据只放在本地环境文件中，不要提交到 Git。

数据库结构不会由应用自动创建。请在确认实际 MySQL 实例和目标数据库后，将
`other/librarymanagement.sql` 导入与 `DB_NAME` 一致的数据库。该脚本会删除并重建
同名表、视图、存储过程和触发器，不能对未知或已有重要数据的数据库直接执行。

## 运行

启动后端 API：

```powershell
npm start
```

另开终端启动前端开发服务器：

```powershell
npm run serve
```

默认地址：前端 `http://localhost:8080`，后端 `http://localhost:3001`。如需修改，
使用 `.env.local` 中的 `PORT`、`CORS_ORIGIN` 和 `VUE_APP_API_BASE_URL`。

## 验证

运行 lint 和不依赖数据库的 API 契约测试：

```powershell
npm run check
```

测试通过注入假的数据仓库验证成功、空列表、输入错误、记录不存在和数据库异常等
响应。它不代表 MySQL 视图、触发器和存储过程已经完成真实环境验证。

## 主要目录

```text
src/api/                 前端 HTTP 边界
src/components/          可复用表单组件
src/views/               页面组件
server/config/           环境配置和连接池
server/routes/           HTTP 输入与响应
server/repositories/     SQL 和字段映射
test/server/             数据库无关测试
other/librarymanagement.sql  数据库结构与样例数据
```

## 当前边界

本轮重构保留了原页面路径和后端 API 路径。Vue 2 已结束官方维护，因此 Vue 3 +
Vite 迁移被记录为独立后续工作；它不与本轮行为保持型重构混在一起。
