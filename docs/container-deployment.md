# 容器化部署

## 唯一入口

部署模块的接口只有一条命令：

```sh
docker compose up -d
```

不需要仓库脚本、`.env`、本地密码文件或宿主机 Node.js/MySQL。Compose 会构建应用、
生成数据库密码、创建 MySQL 数据卷、导入课程 SQL，并按健康状态启动应用。

## WSL 工作区

在 Ubuntu WSL 2 的 Linux 文件系统中克隆当前分支，避免 `/mnt/c` 的权限和文件系统
开销：

```sh
mkdir -p "$HOME/src" && \
HTTPS_PROXY=http://127.0.0.1:12334 git clone --branch refactor/engineering-baseline --single-branch https://github.com/LiuLin1220/librarymanagement.git "$HOME/src/librarymanagement" && \
cd "$HOME/src/librarymanagement"
```

目标目录已存在时使用快进更新：

```sh
cd "$HOME/src/librarymanagement" && \
HTTPS_PROXY=http://127.0.0.1:12334 git pull --ff-only
```

前置条件是 WSL 内已经运行 Docker Engine 和 Compose plugin。Docker 守护进程拉取
Alpine、Node 和 MySQL 镜像时使用 systemd 中的
`HTTP_PROXY=http://127.0.0.1:12334`；可只读确认：

```sh
systemctl show docker.service -p Environment
```

Docker 的 [Ubuntu 安装](https://docs.docker.com/engine/install/ubuntu/)和
[daemon 代理配置](https://docs.docker.com/engine/daemon/proxy/)应按官方文档完成，
不由本仓库修改宿主机。

## WSL 生命周期前置条件

当 Docker Engine 直接运行在 WSL 中，而不是由 Docker Desktop 托管时，后台
systemd 服务和容器本身不足以阻止 WSL 发行版空闲退出。发行版退出会让 Docker
daemon 向容器发送停止信号；下次进入 WSL 时，`restart: unless-stopped` 才会把原
容器重新启动。这不是应用崩溃，也不是 Compose 健康检查触发的重启。

WSL 有两层空闲生命周期：共享 WSL 2 虚拟机和具体发行版实例。微软文档记录了
`vmIdleTimeout` 的默认值为 60000 毫秒；微软 WSL 维护者进一步说明，长期运行发行版
还需要 `[general]` 下的 `instanceIdleTimeout=-1`。在 Windows 用户目录的
`%UserProfile%\.wslconfig` 中合并以下两项，不要覆盖已有的网络、内存或 DNS 配置：

```ini
[general]
instanceIdleTimeout=-1

[wsl2]
vmIdleTimeout=-1
```

参考：[WSL 高级配置](https://learn.microsoft.com/windows/wsl/wsl-config)和
[microsoft/WSL#13291](https://github.com/microsoft/WSL/issues/13291)。

影响：这两个设置作用于当前 Windows 用户的所有 WSL 2 发行版；空闲时不再自动
释放发行版和共享虚拟机，可能持续占用内存。配置生效需要在 Windows PowerShell
执行 `wsl --shutdown`，它会立即停止所有 WSL 发行版及其中的容器，所以应先保存
工作并确认没有其他任务依赖 WSL。

回滚：从 `.wslconfig` 删除这两项，再执行一次 `wsl --shutdown`，即可恢复默认空闲
回收行为。验证时先执行 `docker compose up -d`，关闭所有 WSL 终端；随后从 Windows
确认发行版仍为 `Running`，并确认应用仍可访问：

```powershell
wsl --list --verbose
```

```powershell
curl.exe --fail --silent --show-error http://127.0.0.1:8080/health/ready
```

这是一次性的宿主机前置配置。项目部署接口仍然只有 `docker compose up -d`，Compose
文件不会尝试修改 WSL 全局设置。

## Compose 内部流程

`docker compose up -d` 隐藏了以下实现细节：

1. `secret-init` 使用固定版本的 Alpine，从 `/dev/urandom` 生成两个 64 字符
   （256 位）十六进制密码，保存到 `deployment-secrets` 命名卷；已有有效密码不会
   被覆盖。
2. `db` 只有在 `secret-init` 成功退出后才启动。首次创建 `db-data` 卷时，MySQL
   官方入口导入 `other/librarymanagement.sql`。
3. `app` 的 [`pull_policy: build`](https://docs.docker.com/reference/compose-file/services/#pull_policy)
   让普通 `docker compose up -d` 每次都根据当前 Git 工作区重建镜像，不要求额外
   添加 `--build`。
4. 应用构建使用 host 网络，并把 `127.0.0.1:12334` 作为 npm 的 HTTP/HTTPS 代理。
5. Compose 使用
   [`service_completed_successfully` 和 `service_healthy`](https://docs.docker.com/compose/how-tos/startup-order/)
   控制启动顺序；`app` 还通过 `/health/ready` 持续检查数据库可用性。

数据库端口没有映射到宿主机。应用默认只监听 `127.0.0.1:8080`，当前项目没有登录
鉴权，不应在未增加认证与防火墙策略前改为 `0.0.0.0`。

## 可选覆盖

不创建 `.env` 时使用适合当前 WSL 的默认值。确需覆盖时，可从 `.env.example` 选择
相关变量写入不受 Git 跟踪的 `.env`：

- `APP_HOST`、`APP_PORT`：应用监听地址和端口。
- `MYSQL_IMAGE`、`MYSQL_DATABASE`、`MYSQL_USER`：新数据卷的 MySQL 初始化参数。
- `BUILD_NETWORK`：本机回环代理要求保持为 `host`。
- `BUILD_HTTP_PROXY`、`BUILD_HTTPS_PROXY`：默认都是
  `http://127.0.0.1:12334`；显式设置为空值可关闭构建代理。

已有 MySQL 数据卷创建后，修改数据库名、用户名或密码来源不会自动修改数据库内部
账号；不能把 Compose 变量变化当成密码轮换。

## 状态与健康检查

先查询实际容器：

```sh
docker ps
```

再查看本项目状态和日志：

```sh
docker compose ps --all
```

```sh
docker compose logs --tail 200
```

HTTP 验收：

```sh
curl --fail --silent --show-error http://127.0.0.1:8080/health/ready
```

```sh
curl --fail --silent --show-error http://127.0.0.1:8080/api/get_books
```

图书接口返回 JSON 数组；`[]` 也是合法业务响应。

## 停止、更新和回滚

普通停止保留数据库和密码卷：

```sh
docker compose down
```

拉取新提交后仍使用同一个入口；Compose 会重建应用并复用命名卷：

```sh
HTTPS_PROXY=http://127.0.0.1:12334 git pull --ff-only && \
docker compose up -d
```

应用版本回滚以 Git 提交为准，不需要专用脚本。切换到已确认的提交后再次执行
Compose；数据库卷不会被删除：

```sh
git switch --detach <known-good-commit> && \
docker compose up -d
```

应用镜像回滚不等于数据库结构回滚。当前 SQL 只在空卷初始化；未来若加入迁移，
必须另外设计向前/向后兼容和数据库备份恢复流程。

## 数据持久化与删除边界

`db-data` 保存 MySQL 数据，`deployment-secrets` 保存随机密码。普通 `up`、`down`、
应用重建和 Git 回滚都会保留它们。

下面的命令会删除两个命名卷，数据库内容和密码不可恢复，只能在明确要重建演示
数据库且已确认无需保留数据时执行：

```sh
docker compose down -v
```

## 验收分层

1. `npm run check`：lint、API/配置测试和 Compose 交付资产约束。
2. `docker compose config --quiet`：变量插值和 Compose 模型解析。
3. `docker compose up -d`：真实构建、secret 初始化、MySQL 导入和服务启动。
4. `docker ps`、`docker compose ps --all`、HTTP 与数据库结构查询：运行态证据。
5. 写入一条可识别的测试记录，执行 `down`/`up -d` 后确认仍存在并清理：持久化
   证据。

前两层通过不能代替真实构建、容器健康、数据库结构和持久化证据。
