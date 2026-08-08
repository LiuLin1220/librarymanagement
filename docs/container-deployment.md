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
