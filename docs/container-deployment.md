# 容器化部署

## 交付目标

一套 Compose 同时运行两个服务：

- `app`：构建 Vue 静态文件，由 Express 同源提供页面和 `/api`。
- `db`：MySQL 8.4，首次创建数据卷时导入课程 SQL。

宿主机默认只开放 `127.0.0.1:8080`。MySQL 只在 Compose 内部网络监听，未映射
到宿主机。数据库文件保存在命名卷中，普通停止、重新创建应用容器和应用镜像回滚
都不会删除数据。

## 前置条件

- Docker Engine 或 Docker Desktop 已安装并正在运行。
- 使用支持 `docker compose up --wait` 的 Compose v2。
- 第一次运行需要联网拉取 Node、MySQL 镜像和 npm 依赖。

宿主机不需要另装 Node.js 或 MySQL。一键脚本会先检查 Docker 引擎和 Compose，
不满足条件时直接停止，不会尝试安装或启动系统服务。

## WSL 2 推荐路径

本项目在 Windows 上优先使用现有 Ubuntu WSL 2 内的 Docker Engine，不依赖 Docker
Desktop。安装脚本只支持官方已覆盖的 Ubuntu 版本，并会拒绝未知发行版、非 amd64、
缺少 systemd、缺少免密 sudo、冲突软件包或异常 Docker 签名密钥。

当前网络如果需要 Hiddify，可把 Windows 回环端口 `12334` 作为 HTTP 代理。脚本只
接受无凭据的本机回环代理，并把它配置给 WSL 内的 Docker 服务：

```sh
DOCKER_PROXY_URL=http://127.0.0.1:12334 sh scripts/setup-docker-wsl.sh
```

该操作会增加 Docker 官方 APT 源和签名密钥，安装 Docker Engine、CLI、containerd、
Buildx 与 Compose plugin，启动 `docker`/`containerd` systemd 服务，并把当前 WSL
用户加入 `docker` 组。`docker` 组在 WSL 内拥有等同 root 的控制能力。脚本完成后
重新打开 WSL 终端。可以先生成本地配置并只校验 Compose；该命令不会构建镜像或
启动容器：

```sh
sh scripts/container.sh prepare
```

确认配置后再启动：

```sh
sh scripts/container.sh up
```

在 WSL 中，如果 `12334` 可用且没有显式提供其他构建代理，部署脚本会自动让镜像
构建步骤使用 host 网络和该代理；Docker 守护进程拉取基础镜像则使用安装阶段写入
的 systemd 代理。应用和 MySQL 运行时不需要外网代理。

撤销运行时但保留镜像和卷数据：先停止并禁用 `docker.service` 和
`containerd.service`，再卸载 `docker-ce`、`docker-ce-cli`、`containerd.io`、
`docker-buildx-plugin` 和 `docker-compose-plugin`，最后移除新增的 `docker.sources`、
`docker.asc` 与 Docker systemd 代理 drop-in。不要删除 `/var/lib/docker` 或
`/var/lib/containerd`，除非已确认其中没有需要保留的卷和镜像。

## 一键启动

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 up
```

Linux、macOS 或 WSL：

```sh
sh scripts/container.sh up
```

首次启动会在本地生成以下不受 Git 跟踪的文件：

- `.env.docker`：端口、镜像名、数据库名和应用数据库用户名等非秘密配置。
- WSL：`~/.local/state/librarymanagement/secrets/` 下的两份随机数据库密码。脚本会
  把绝对路径写入 `.env.docker`，并把目录和文件权限收紧为 `700`/`600`。
- 非 WSL：`.docker-secrets/` 下的两份随机数据库密码。

WSL 仓库通常位于 `/mnt/c`，这里的 Windows 挂载权限不能可靠体现 Linux 的
`chmod 600`，所以脚本拒绝把 WSL 密钥留在 `/mnt` 下。旧版若已在仓库生成密钥，
脚本会先原样复制到 WSL 文件系统且保留旧文件；确认没有容器继续使用旧路径后，
再显式清理仓库中的旧副本。

随后脚本依次执行 Compose 配置解析、保留上一版应用镜像、构建/启动、等待容器
健康，并抽查页面、数据库就绪状态和带样例数据的图书接口。全部通过后，访问
`http://localhost:8080`。

## 常用动作

查看状态：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 status
```

跟踪日志：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 logs
```

重新执行页面、就绪状态和 API 抽查：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 verify
```

停止服务但保留数据：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 down
```

POSIX 环境把脚本替换为 `sh scripts/container.sh <动作>`。

## 健康和启动顺序

- `GET /health` 只确认 Node 进程能响应。
- `GET /health/ready` 会执行最小数据库查询；数据库不可用时返回 HTTP 503。
- MySQL 的健康检查要等 `bookbaseinfo` 建表完成，避免应用抢在初始化 SQL 前启动。
- `app` 只有在 MySQL 健康后才启动；一键脚本还会等待 `app` 健康后再验收。

## 数据初始化与持久化

`other/librarymanagement.sql` 挂载在 `/docker-entrypoint-initdb.d/`。MySQL 官方入口
只会在空数据目录的首次启动中执行它；已有 `db-data` 卷时不会重复删除、重建表，
也不会自动应用后续 SQL 修改。

验证持久化时，可以先在页面新增一条容易识别的测试图书，执行 `down`，再执行
`up` 并确认记录仍存在，最后删除测试记录。这个步骤会短暂修改部署数据库，因此不
放在默认启动脚本里。

下面的命令会连同数据卷一起删除，所有容器数据库数据不可恢复；只有明确要重建
演示数据库且已确认无需保留数据时才能执行：

```powershell
docker compose --env-file .env.docker down --volumes
```

## 配置边界

修改 `.env.docker` 后重新执行 `up`：

- `APP_HOST` 默认 `127.0.0.1`。改成 `0.0.0.0` 会允许局域网访问，应先评估认证、
  防火墙和 CORS；当前应用没有登录鉴权。
- `APP_PORT` 默认 `8080`。跨域开发场景同时调整 `CORS_ORIGIN`；容器页面和 API
  同源时不需要额外跨域配置。
- `MYSQL_IMAGE` 固定到经过记录的 MySQL 8.4 补丁标签。升级前先查看官方变更并
  备份数据。
- `DOCKER_SECRET_DIRECTORY` 由一键脚本管理。WSL 必须使用 Linux 文件系统中的
  绝对路径，不能指向 `/mnt`；切换运行环境时应继续通过对应的一键脚本执行。
- 已有数据卷创建后，单独改数据库名、用户名或 secret 文件不会自动修改 MySQL
  内部账号；不能把替换 secret 文件当成密码轮换。

## 回滚

每次 `up` 构建前，如果本地已有应用镜像，脚本会把它标记为
`librarymanagement-app:rollback`。新版本不健康时可执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\container.ps1 rollback
```

回滚只替换 `app` 镜像，不删除或重新初始化数据库卷。当前 SQL 只在新卷初始化，
因此应用镜像回滚不等于数据库结构回滚；未来若引入迁移，必须另外设计向前/向后
兼容和数据库备份恢复流程。

## 验收分层

1. `npm run check`：lint、API/配置测试和容器交付资产约束，不需要 Docker。
2. `docker compose --env-file .env.docker config --quiet`：验证变量插值和 Compose
   模型；CI 使用非生产临时 secret 执行这一层。
3. `container.ps1 up` 或 `container.sh up`：实际拉取/构建、启动、健康检查和 HTTP
   抽查。
4. 手动写入、停止、重启和清理测试记录：验证持久化，不在默认脚本中修改数据。

静态配置通过不能代替第 3、4 层的真实容器证据。
