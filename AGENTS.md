# 仓库协作指南

## 项目用途

这是一个图书销售管理课程项目：前端使用 Vue 2 + Element UI，后端使用
Express + MySQL。除非任务明确要求变更，否则保留现有用户流程和
`other/librarymanagement.sql` 中的数据库结构。

## 目录地图

- `src/views/`：路由级页面，不直接拼 HTTP 请求。
- `src/api/`：前端唯一允许调用 Axios 的目录。
- `server/app.js`：只组装 Express，不监听端口、不创建数据库连接。
- `server/routes/`：HTTP 输入校验和响应映射。
- `server/repositories/`：SQL 和数据库结果映射。
- `server/config/`：环境变量解析和 MySQL 连接池。
- `test/`：不依赖真实数据库的契约测试与单元测试。
- `docs/architecture.md`：模块边界、数据流和运行配置。
- `docs/api.md`：兼容接口及错误响应约定。
- `docs/refactor-plan.md`：当前债务、决策和完成证据。
- `docs/container-deployment.md`：容器拓扑、生命周期、持久化、回滚和验收边界。
- `scripts/container.*`：唯一的一键容器操作入口；默认停止不会删除数据卷。
- `scripts/setup-docker-wsl.sh`：仅用于明确选择 WSL 部署时安装官方 Docker Engine；
  必须先审计发行版、冲突包、代理、监听和现有 Docker 配置。

## 必须保持的规则

1. 不在受 Git 跟踪的文件中写凭据；新增环境变量时同步 `.env.example`。
2. Express 应用通过参数接收仓库，API 测试不能依赖 MySQL。
3. 数据库异常交给统一错误中间件，不能只打印后吞掉。
4. 集合接口在没有记录时也返回数组 `[]`。
5. 调用仓库前完成输入校验和类型归一化。
6. 只使用参数化 SQL，SQL 统一放在 `server/repositories/`。
7. 前端请求统一经过 `src/api/`；页面只管理界面状态与提示。
8. 在有版本化兼容迁移方案前，保留现有 API 路径。
9. 纯重构提交不要混入无关功能。
10. 容器数据库默认不映射宿主机端口；secret 不写进 Compose 环境值或镜像层。
11. 进程存活、数据库就绪、Compose 配置和真实运行状态必须分别验证。
12. WSL 安装脚本不得自动卸载冲突包或删除 `/var/lib/docker`、
    `/var/lib/containerd`；`docker` 组权限等同 WSL root，必须明确说明。

## 验证入口

- `npm run check`：必跑的快速门禁，包含全仓 lint 和数据库无关测试。
- `node --check server/index.js`：可选的后端入口语法检查。
- `docker compose --env-file .env.docker config --quiet`：有 Docker 时验证 Compose
  插值与模型，但不能代替镜像和运行态验证。
- 真实数据库验证必须另外记录所用结构和环境，不能用单元测试代替。
- 本机自动化不得执行 `npm run build`，除非任务明确放宽限制。

## 数据库安全

执行数据库命令前，先确认真实服务、数据库、表和列。普通测试不得自动导入或
修改 `other/librarymanagement.sql`；没有明确批准时，使用注入的假仓库测试。

`scripts/container.* down` 必须保留命名卷和 secret。不得把 `down --volumes`、清空
数据卷或重新导入 SQL 纳入普通停止、更新或回滚流程。
