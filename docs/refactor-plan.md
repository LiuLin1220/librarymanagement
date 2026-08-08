# 工程化重构记录

## 目标与边界

在不修改现有页面、核心流程和 SQL 结构的前提下，提高可维护性、错误处理、依赖
卫生和自动化验证能力。本批次保留原 API 路径。Vue 3/Vite 迁移属于独立架构变更，
不和行为保持型重构混在一起。

## 重构前基线（2026-08-08）

- 起点：`origin/master` 的 `aae5a92`。
- `npm run lint` 通过，但只提供基础前端静态检查。
- 没有自动化测试。
- `npm audit`：147 项（13 critical、48 high、68 moderate、18 low）。
- 文档要求 Node 16，但已声明的 Express 5 需要更新的运行时。
- `server/config.js` 直接跟踪了非空数据库口令。
- 数据库回调只打印并吞掉异常，会让 HTTP 请求一直不结束。
- 页面重复请求、筛选和错误处理代码，并保留未使用的文章/脚手架示例。

## 第一批：工程基线（已完成）

- [x] 增加简短仓库指南、架构/API 文档和统一检查命令。
- [x] 用经过校验的环境变量替代受 Git 跟踪的数据库凭据。
- [x] 分离应用组装、路由、输入校验、仓库、连接池和进程启动。
- [x] 增加统一 JSON 错误结构和正确的 HTTP 状态码。
- [x] 增加不依赖数据库的 API 契约与仓库映射测试。
- [x] 收口前端 HTTP 调用，删除未使用的文章/脚手架页面。
- [x] 升级 Vue 2 兼容工具链并删除未使用的直依赖。
- [x] 重新执行 lint、测试、语法检查和依赖审计。

## 完成证据（2026-08-08）

- `npm run check`：通过；全仓 lint 无错误，16 个测试断言全部通过。
- `node --check`：后端入口、应用、路由和仓库文件均通过。
- `npm ci --dry-run --ignore-scripts`：通过，lockfile 可用于干净安装。
- `npm audit`：20 项（0 critical、6 high、12 moderate、2 low）。
- `npm audit --omit=dev`：生产依赖只剩 Vue 2 链上的 2 项 low。
- 源码扫描：`src/`、`server/`、`test/` 中没有 `$http`、`console.log`、旧
  Mongo 依赖或已删除示例组件引用。
- 未启动真实服务、未连接或修改 MySQL，因此数据库端到端行为不在完成证据内。

## 验收结果

1. `npm run check` 通过，且测试不需要 MySQL。
2. 成功、空集合、输入错误、数值边界、记录不存在、JSON 错误、未知接口和仓库
   异常均有契约测试。
3. 当前受跟踪源码不再包含数据库口令。
4. 数据库异常会结束为 JSON 5xx 响应，不再悬空。
5. 空集合接口返回 HTTP 200 和 `[]`。
6. 前端只有一个 Axios 实例，页面不直接使用 `$http`。
7. 原页面路径和 API 路径仍然存在。
8. 剩余依赖问题和未验证数据库行为已明确记录。

## 后续债务

- **若旧口令仍在使用则为 Critical：** 公开 Git 历史中仍有一个非空数据库口令。
  当前代码已不读取它，但需要在真实数据库侧轮换；重写公开历史必须另行协调。
- **High：** Vue 2 已结束官方维护。应在当前契约稳定后单独迁移 Vue 3 + Vite。
- **High（开发链）：** 仍有 6 项 high 审计结果来自 Vue CLI 5 的开发依赖；npm
  给出的自动修复会破坏性降级或跨大版本升级，不能直接执行。
- **High：** 数据库未阻止库存变为负数。是否拒绝超卖需要事务安全的业务规则或
  数据库约束，这是单独的产品/结构决策。
- **Medium：** 增加一次性 MySQL 集成环境，验证视图、触发器和存储过程。
- **Medium：** API 如果要暴露到可信本机之外，需要认证和授权。
- **Low：** 通过版本化 `/api/v1` 迁移统一旧接口命名。

## 第二批：容器化一键部署（2026-08-08）

- [x] 增加多阶段应用镜像，构建 Vue 后只安装生产依赖并以 `node` 用户运行。
- [x] 增加 Compose 应用/MySQL 拓扑、卷内随机 secret、数据卷和日志轮转。
- [x] MySQL 初始化完成后再启动应用；增加数据库感知的 `/health/ready`。
- [x] 生产进程同源托管 Vue 静态文件，保留 `/api` 和健康接口的 JSON 404 边界。
- [x] 将部署接口收口为 `docker compose up -d`，不再要求仓库脚本或本地密码文件。
- [x] 增加不依赖 Docker 的交付资产测试，以及 CI Compose 配置解析门禁。
- [x] 在 Compose 中接入本机 `12334` 构建代理，并让普通 `up -d` 始终构建当前代码。
- [x] 将重构分支推送到 GitHub，并在 WSL 原生 ext4 文件系统完成独立克隆和预检。
- [x] 在 WSL Docker Engine 上用准确的 `docker compose up -d` 完成构建和真实启动。
- [x] 抽查页面、存活/就绪接口、样例图书 API 和真实 MySQL 表结构。
- [x] 记录实际镜像 ID/摘要、容器健康状态、密钥属性和只读数据库证据。
- [ ] 写入可识别的测试记录，验证 `down`/`up -d` 后仍存在，再删除测试记录。
- [ ] 配置并验证无人持有 WSL 终端时发行版和容器仍持续运行。

当前开发机的 Ubuntu 26.04 WSL 已安装 Docker Engine/CLI 29.7.2、containerd 2.3.3、
Buildx 0.36.1 和 Compose 5.4.0。Docker 守护进程通过本机 `12334` HTTP 代理成功
拉取并运行 `hello-world`；新 WSL 会话可直接访问 Docker，执行前后的 `docker ps`
均未发现项目容器。

上一版证据：`npm run check` 通过，共执行 30 个测试；
Compose Specification 提交 `11296e3` 的官方 JSON Schema 校验继续通过（Schema
SHA-256：`73ca5878c77570ba222a558016c7b3c6770ba5f3377786593e32180666512f8f`）。真实
Compose CLI 已完成 `host + 127.0.0.1:12334` 构建代理配置的变量展开与模型归一化。

分支 `refactor/engineering-baseline` 已推送到 `origin`，并通过进程级 Git HTTPS 代理
克隆到 `/home/ll/src/librarymanagement`；该路径位于 WSL ext4 根文件系统。原生副本
Docker 与 npm 依赖源均通过 `127.0.0.1:12334` 可达。已预拉取固定基础镜像：
`node:22.23.1-bookworm-slim` 摘要
`sha256:6c74791e557ce11fc957704f6d4fe134a7bc8d6f5ca4403205b2966bd488f6b3`，
`mysql:8.4.11` 摘要
`sha256:b3b90af2a6552ae30c266fdb7d5dd55f3afb72404bb78d37fe8a23eb857fd3fb`。
纯 Compose 接口已完成一次真实运行：准确执行 `docker compose up -d` 返回 0，构建
出的 `librarymanagement-app:local` 镜像 ID 为
`sha256:38a2f80aca62486d50dfb6fcabae28bdea901836ab63801e85b4e29deeea11fc`，
应用和 MySQL 容器均进入 `healthy`。应用只映射
`127.0.0.1:8080->3001/tcp`，数据库没有宿主端口。

运行态抽查中，首页返回 HTTP 200 和“图书销售管理系统”静态页面；`/health`、
`/health/ready` 和 `/api/get_books` 均返回 HTTP 200。真实数据库发现顺序为
`SHOW DATABASES` → `SHOW TABLES` → `DESCRIBE bookbaseinfo` → `SELECT`；
`librarymanagement.bookbaseinfo` 有 5 个预期列和 12 条样例记录。两个卷内密码文件
都是 root 所有、0444、64 字节，未输出密码内容。

随后从同一 WSL 原生工作区再次准确执行 `docker compose up -d`，7.5 秒内返回 0；
构建层全部命中缓存，`secret-init` 重新执行但两个密码哈希均保持不变，图书接口仍为
12 条。应用和数据库容器未被无意义地重建，且继续保持 `healthy`。构建产生了新的
证明/索引清单，但实际运行平台镜像清单仍为
`sha256:65beea0991706b1d4f2779823f198ad5f3492af0943d9449e115d66a91e65a14`，
与容器的 `com.docker.compose.image` 标签一致；因此这是内容幂等，不是 Compose 漏掉
代码更新。

排障同时确认了一项宿主边界：当前 `%UserProfile%\.wslconfig` 未配置实例空闲超时，
关闭最后一个 WSL 会话后，发行版会退出并让 Docker 优雅停止两个容器。保持临时用户
会话时容器持续健康，说明这不是应用或 MySQL 崩溃。长期运行需要合并
`[general] instanceIdleTimeout=-1` 与 `[wsl2] vmIdleTimeout=-1`；这是影响所有 WSL 2
发行版的宿主配置，需单独批准后再修改并验证。数据库写入/清理和持久化验证也需在
明确允许测试数据变更后完成。
