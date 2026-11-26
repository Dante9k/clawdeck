# Enterprise roadmap / 企业能力路线图

ClawDeck is positioned as an enterprise OpenClaw management platform for IT operations and AI platform teams. It aims to bring instance operations, configuration management, identity and policy into a consistent administration workflow on the organization's own infrastructure.

ClawDeck 定位为企业级龙虾管理平台，面向企业 IT 运维与 AI 平台团队。产品围绕实例运维、配置管理、身份权限与策略治理持续建设，支持部署在企业自己的基础设施上。

This roadmap describes priorities, not delivery dates or capabilities already available. The current release is a single-host pilot candidate; no compliance certification, tenant isolation or availability SLA is claimed.

下列内容是建设优先级，不构成交付时间承诺。当前版本为单机试点候选版，不宣称具备合规认证、多租户隔离或可用性 SLA。

## Available now / 当前已交付

- Single-host discovery, lifecycle operations, Docker health, resources and recent logs / 单机实例发现、启停、健康状态、资源和日志。
- Per-instance models, providers, API keys and channels / 按实例管理模型、提供商、密钥与渠道。
- Masked change previews, native validation, backups and editable-scope recovery / 脱敏差异预览、原生校验、备份与可编辑范围恢复。
- Shared administrator login and durable operation results / 共享管理员登录与持久操作结果记录。These records do not identify individual users / 当前记录不支持个人身份归因。

## Phase 1: validate enterprise pilots / 第一阶段：验证企业试点

- Verify actual OpenClaw images with recorded tags/digests and reproducible acceptance results.
- Validate directory mounts, HTTPS proxies, ARM64 and rootless Docker in target environments.
- Complete desktop/mobile accessibility and browser acceptance; add English dashboard localization.
- Document backup retention, incident recovery and operational responsibility.

先完成真实镜像与企业部署环境验收、桌面/移动端交互验证、英文界面和运维恢复手册，建立可重复的试点验收标准。

## Phase 2: identity and change governance / 第二阶段：身份与变更治理

**Planned; not implemented / 规划中，尚未实现。**

- Individual identities, organization membership, RBAC and enterprise SSO.
- Per-user audit records, searchable history and export with integrity and retention requirements.
- Approval workflows for sensitive configuration and bulk operations.
- Encrypted credential storage, secret access boundaries, key rotation and recovery procedures.

建设独立身份、企业 SSO、角色权限、按用户归因的审计、敏感变更审批和加密凭据管理。身份、密钥与审计需要一起设计；仅加一个角色字段不能形成企业权限边界。

## Phase 3: multi-server operations and policy / 第三阶段：多服务器与策略管理

**Planned; not implemented / 规划中，尚未实现。**

- Explicit server enrollment, authenticated agent communication and revocable access.
- Fleet grouping, configuration templates, staged rollout and failure recovery across hosts.
- Policy enforcement, alert routing, audit export integrations and usage/cost visibility.
- A documented availability model, backup/restore objectives and an operational support model before any SLA commitment.

建设可撤销的服务器接入、安全代理通信、分组与配置模板、分批发布及恢复、告警和策略管理。在跨主机控制面、故障模型及恢复目标验证之前，不承诺高可用或 SLA。

## Contribution priorities / 共建优先级

Real deployment feedback, image compatibility, dashboard localization, accessibility and clear operational documentation are useful now. Discuss the threat model, migration path and testable acceptance criteria before implementing identity, secret storage or multi-server control.

欢迎优先提交真实部署反馈、兼容性测试、界面国际化与可访问性改进。涉及身份、密钥和多服务器控制的功能，请先讨论权限边界、迁移方案和可验证的验收标准。
