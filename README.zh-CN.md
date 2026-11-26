# ClawDeck · 企业级龙虾管理平台

面向企业 IT 运维与 AI 平台团队的开源 OpenClaw 管理平台。通过私有化部署，集中管理龙虾实例、模型、API Key 与消息渠道，支持变更预览、备份恢复和操作结果追踪。

当前交付为 **1.0.0-rc.2 单机试点候选版**：部署在一台 Linux Docker 主机上，中文界面，Node.js 22.14+，无第三方运行依赖。企业身份、RBAC/SSO、变更审批、加密凭据存储与多服务器管理尚未实现，详见[企业能力路线图](docs/ROADMAP.md)。当前操作记录基于共享管理员会话，不提供个人身份归因审计。

本包为发布候选版，面向单台服务器上的可信管理员。可交付部署与试点使用；真实 OpenClaw 镜像兼容性、Linux Docker 联调和本次新增界面的浏览器验收由部署方按 [验收与发布说明](docs/RELEASE.md) 完成后，再转正式推广。公开源码使用 MIT 许可；不提供预构建的容器镜像。

## 已实现

- 自动发现 OpenClaw 容器，展示容器状态、Docker 健康检查、CPU、内存、端口和 Compose 项目。
- 单实例和批量启动、停止、重启；最近 300 行日志；可配置 OpenClaw 后台入口。
- 按实例管理默认模型与备用模型、提供商 Base URL / API 类型 / API Key / 模型列表。
- 飞书多账号、Telegram、Discord 的配置表单，以及其他渠道的 JSON 编辑。
- 配置差异预览、原生校验、保存前备份与界面恢复、密钥遮罩、并发修改冲突检测。
- 批量统一默认模型：逐实例预检、原生校验、差异确认、遇错停止；保留各实例自己的密钥和渠道。
- 实例接入自检，自动发现与显式管理授权分开。
- 操作编号、24 小时去重、持久执行结果；区分成功、失败和结果未知。
- 登录会话、同源请求校验、操作范围检查。真实模式无法连接 Docker 时不会回退到演示数据。

## 本地演示

[English](README.md) · [官网](https://clawdeck.jupyter-community.chatgpt.site/zh/) · [在线演示](https://clawdeck.jupyter-community.chatgpt.site/demo.html)

直接在浏览器打开 `preview.html` 可使用离线交互演示，无需启动进程；所有修改仅在当前页面内存中，刷新后重置。安装开发依赖后运行 `pnpm build:preview`，即可从同一份界面源码重新生成。

需要验证完整 HTTP 接口时运行：

```sh
node server.mjs --demo
```

打开 http://127.0.0.1:3210 。演示只监听本机；数据位于内存，重启会重置。页面中所有演示状态、模型、日志和地址均不代表真实服务器。

## 部署到服务器

将整个 `clawdeck` 目录复制到目标 Linux 服务器，然后执行：

```sh
sh scripts/install.sh
```

脚本检查 Docker 与 Compose；首次部署生成随机管理密码并以 0600 权限保存到 `.env`，不会覆盖已有文件。它通过临时 Node 镜像运行初始化，因此主机不必安装 Node。需要访问镜像仓库，并拥有本机 Docker 权限。现有 `.env` 中密码为空时会停止，请先填写至少 16 位密码。

若已有 Node.js 22.14+，也可先执行 `node scripts/setup.mjs`，按需调整 `.env`，再运行 `docker compose up -d --build --wait`。rootless Docker 在 `.env` 中设置 `DOCKER_SOCKET_PATH`；运行安装脚本时 Docker CLI 的当前 context 应对应同一服务器。

默认仅映射到服务器的 127.0.0.1。在自己的电脑运行：

```sh
ssh -N -L 3210:127.0.0.1:3210 user@your-server
```

浏览器打开 http://127.0.0.1:3210 ，使用 `.env` 中的密码登录。如已有 HTTPS 反向代理，将它指向 3210 端口并设置 `COOKIE_SECURE=true`。代理应保留原始 `Host`；不跨域开放 API。也可将 `PANEL_BIND` 设为明确的内网 IP。

面板需要读写 Docker socket 以执行管理操作，拥有相当于宿主机管理员的能力；仅供可信服务器管理员访问。socket 的 `:ro` 挂载不能限制 Docker API 的写操作，因此此处没有虚假的只读标记。rootless Docker 请将卷源路径改为对应用户的 socket 路径。

## 接入已有龙虾

容器名或镜像名包含 `openclaw`、`clawdbot`、`moltbot` 时自动发现，默认只展示状态和日志。要启停容器或读取、写入配置，必须在现有 Compose 服务中加入 `io.clawdeck.managed: "true"`：

```yaml
services:
  openclaw-gateway:
    # 保留已有 image、volumes、environment、ports 等设置
    labels:
      io.clawdeck.managed: 'true'
      io.clawdeck.name: 'Atlas · 工作助理'
      io.clawdeck.description: '日常协作与任务处理'
      io.clawdeck.url: 'https://claw.example.com'
      # 非默认配置路径才需要指定（容器内绝对路径）：
      # io.clawdeck.config-path: "/home/<container-user>/.openclaw/openclaw.json"
```

应用原 Compose 配置后刷新面板，打开实例概览执行「接入自检」。`io.clawdeck.managed: "false"` 优先排除容器。自检验证读取、临时文件写入和原生校验，不调用计费模型接口，也不检测消息渠道连通性。后台 URL 必须是 HTTP(S)，禁止含用户名、密码、查询参数或 hash token。后台登录由各 OpenClaw 自己处理，不共享 Gateway token。

## 模型、密钥和配置的边界

面板通过 Docker exec 在容器内运行固定的 Node.js 配置助手，所有配置载荷通过 stdin 传输；没有任意命令接口，也不会把 API Key 放进命令行参数。配置助手必须能调用 `openclaw config validate --json`，或官方镜像的 `/app/dist/index.js`。校验必须明确返回 `valid: true` 才允许保存。

读取路径依次采用 label、`OPENCLAW_CONFIG_PATH`、`openclaw config file --json` 和默认 state 目录。镜像需有 Node.js；JSON5 配置需能从 `/app`、工作目录或标准全局安装位置加载 `json5`。无法解析、无原生校验器、只读配置、符号链接、`$include` 配置都会明确拒绝写入，不尝试强制覆盖。容器停止时不可读写配置。

可编辑范围对应：

| 面板字段  | OpenClaw 字段         |
| --------- | --------------------- |
| model     | agents.defaults.model |
| providers | models.providers      |
| channels  | channels              |

其他字段、环境变量引用和未变更的密钥会保留。OAuth/auth-profiles、Compose 环境变量和外部 SecretRef 凭据仍由原部署管理；面板不宣称可以查看或统一替换这些外部密钥。填写 API Key 会替换当前配置中的该字段；留空表示不变。高级 JSON 中保留 `__CLAWDECK_SECRET_UNCHANGED__` 占位符表示保留密钥，删除字段表示删除对应配置。

提供商模型数组中的密钥按唯一 `id` 对应，排序不会交换凭据。缺少唯一 ID 的含密钥数组，修改结构会被拒绝，避免猜测凭据对应关系。未编辑的可选表单字段不会补写空值或默认值。配置原文件最大 1 MB，单次提交 JSON 最大 256 KB。

保存过程：读取原文件 → 检查版本 → 合并允许的配置部分 → 同目录临时文件 → 实例原生校验 → 再次检查版本 → 备份原文件 → 原子替换。备份文件与原配置同目录，名称为 `openclaw.json.clawdeck-backup-时间戳`，权限 0600。备份保留原始格式；保存后的主配置为标准 JSON，原有注释不保留。不会自动重启；是否热加载取决于实例版本和设置，需要时可手动重启。原生校验通过不等于提供商或渠道实际连通。

文件应通过整个 OpenClaw 状态目录挂载到容器；单文件 bind mount 可能无法原子替换，会返回错误，保持原文件。若进程在写入期间异常终止，可能遗留 `.clawdeck-lock`，应确认没有写入任务后手动清理。备份含原有密钥，跟随实例状态卷保管；面板不会自动删除备份。

「备份恢复」最多展示最近 50 份面板生成的备份，预览差异后恢复默认模型、提供商和渠道，包括其中的旧凭据；当前其他设置保留。恢复也执行原生校验，并先备份恢复前状态。它不是整份状态卷或会话数据的灾备恢复工具。

批量统一默认模型从实例列表勾选最多 20 项后执行。目标提供商和模型需已登记在所有所选实例中。预检全部通过后才开始依次写入；执行阶段遇到冲突、失败或结果未知就停止后续实例。已经完成的实例不会自动回滚，可分别从备份恢复。批次由当前浏览器驱动，执行期间请保持页面打开；关闭页面后未提交的实例不会继续。已提交请求的结果仍在服务器操作记录中保存。

## 数据口径

- CPU 卡片为已管理容器的 CPU 总和除以服务器核数，不是整台主机负载；容器卡片遵循 Docker 单核 100% 的口径。
- 内存为已管理容器使用量，扣除 inactive file cache；不包含未管理容器和宿主机进程。
- 未配置 Docker HEALTHCHECK 时显示“未配置”，不会当作健康检查通过。
- 渠道列表显示配置存在与否，不代表连接探测结果。点击“同步配置”才读取所有运行中实例，避免持续执行重量级 CLI。
- 操作记录只记录本面板发起的操作；真实模式保存到 `/data/audit.jsonl`，超过 5 MB 轮换，最多保留一份 previous。
- 执行结果单独存入 `/data/operations/`，保留 24 小时，每 24 小时最多 1000 项；界面展示最近 100 项。记录含请求摘要，不保存配置载荷或明文 API Key。相同 `Idempotency-Key` 与相同请求在保留期内不会重复执行。不同载荷复用编号被拒绝；没有编号的 API 客户端每次视为新请求。
- 面板重启期间未完成的操作显示「待核对」；网络中断不能证明 Docker 操作失败。此时先读取实例状态和配置，再决定是否发起新操作。审计落盘失败会显示警告，不把已经成功的操作伪装成失败。
- Docker HEALTHCHECK 只检查面板 HTTP 服务存活，Docker Engine 连通性在登录后总览中验证；健康状态不代表所有 OpenClaw 实例正常。
- 日志对常见 key/token 格式进行尽力遮罩，业务日志仍可能含敏感内容，仅管理员可读。

## 开发与验证

```sh
node --test test/*.test.mjs
```

无需安装依赖。测试覆盖 HTTP、Docker 协议、配置备份、恢复、冲突、中文分段传输、表单可选字段、异步读取竞态、密钥排序、审计故障和操作去重。离线演示由同一套界面源码生成。

`.github/workflows/ci.yml` 提供 Linux/Windows × Node 22/24 测试，以及 Docker 构建与容器协议验收脚本。本地环境只有 Windows Node 24，未执行此 CI。`scripts/docker-smoke.mjs` 使用明确标记的模拟 OpenClaw CLI 容器，验证真实 Docker exec、挂载、备份和恢复协议；它不能替代真实 OpenClaw 镜像验收。详见 [测试与上线记录](docs/RELEASE.md)。

## 运维与版本升级

见 [运维手册](docs/OPERATIONS.md)。从 v0.1 升级时，自动发现但未显式授权的实例会变为只读展示，请补齐 labels。升级会使现有登录会话失效，需要重新登录。保持安装目录或 Compose 项目名一致，保留 `.env`、面板数据卷及各实例状态卷。

## 官方接口依据

- [OpenClaw Docker 部署](https://docs.openclaw.ai/install/docker)
- [OpenClaw 配置 CLI](https://docs.openclaw.ai/cli/config)
- [模型配置](https://docs.openclaw.ai/models)
- [飞书配置参考](https://docs.openclaw.ai/channels/feishu/configuration-reference)
- [Docker Engine API](https://docs.docker.com/reference/api/engine/version/v1.47/)
