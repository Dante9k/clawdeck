const repository = 'https://github.com/Dante9k/clawdeck';
const origin = 'https://clawdeck.jupyter-community.chatgpt.site';
const translations = {
  en: {
    language: 'English',
    switch: '中文',
    switchPath: 'zh/',
    title: 'ClawDeck — Enterprise OpenClaw Management',
    description:
      'Enterprise OpenClaw management on your infrastructure. Centralize instance operations, model configuration, channels and change records. Start with the single-host pilot edition.',
    nav: ['For enterprises', 'Change management', 'Start a pilot'],
    eyebrow: 'ENTERPRISE OPENCLAW MANAGEMENT · OPEN SOURCE',
    headline: 'OpenClaw.<br><em>Managed for business.</em>',
    intro:
      'Bring your organization’s OpenClaw operations into one place. Centralize instances, models and channels, review configuration changes, and keep a record of every panel operation on your own infrastructure.',
    cta: 'Explore the demo',
    secondary: 'View on GitHub',
    note: 'No sign-up. Sample data. Changes stay in your browser.',
    scope: ['Self-hosted deployment', 'Centralized operations', 'Change records & recovery'],
    preview: 'One operational view for your OpenClaw instances.',
    sample: 'ILLUSTRATIVE PREVIEW',
    fleet: 'Fleet overview',
    model: 'Models & keys',
    changes: 'Review changes',
    online: 'Running',
    attention: 'Needs attention',
    masked: 'Keys stay masked in the editor',
    caption: 'A single view of containers, resources and the details that need your attention.',
    problem: 'FOR IT OPERATIONS AND AI PLATFORM TEAMS',
    benefitTitle: 'Operational clarity.<br>Across your OpenClaw fleet.',
    benefits: [
      [
        '01',
        'Centralize daily operations.',
        'Container status, Docker health, CPU, memory and recent logs. Find a specific instance or filter your fleet in seconds.',
      ],
      [
        '02',
        'Standardize configuration.',
        'Edit provider models, API keys and channel configuration per instance. Apply a shared default model while keeping each instance’s own credentials.',
      ],
      [
        '03',
        'Make changes traceable.',
        'Review a masked diff, run the native validator and save with a backup. Operation records distinguish success, failure and unknown outcomes. The current shared-admin edition does not attribute actions to individual people.',
      ],
    ],
    flowEyebrow: 'DESIGNED FOR REAL OPERATIONS',
    flowTitle: 'Inspect. Review. Apply.',
    flowText: 'Changes are deliberate, and the path back is visible.',
    steps: [
      ['Inspect', 'Read the current revision.'],
      ['Review', 'Check a diff with secrets hidden.'],
      ['Validate', 'Use OpenClaw’s own validator.'],
      ['Apply', 'Back up, save and record the result.'],
    ],
    flowNote:
      'Batch changes stop on the first write failure. Earlier successes remain applied; backups let you restore each instance.',
    startEyebrow: 'START WITH A CONTROLLED ENTERPRISE PILOT',
    startTitle: 'Deploy on your infrastructure.',
    startIntro:
      'Start with one Linux Docker host and a small set of OpenClaw instances. Keep your existing Compose deployments, validate the workflow, then decide how to expand.',
    install: 'Install on your Linux server',
    copy: 'Copy commands',
    copied: 'Copied',
    copyFailed: 'Select and copy the commands below.',
    setupSteps: [
      [
        'Deploy',
        'Run the installer on a Linux host with Docker Engine and Compose. It generates a random admin password in .env.',
      ],
      [
        'Connect',
        'Use an SSH tunnel to localhost:3210. Add io.clawdeck.managed: "true" to the containers you want to manage.',
      ],
      [
        'Verify',
        'Run instance diagnostics and the acceptance checklist against your exact OpenClaw image before wider rollout.',
      ],
    ],
    guide: 'Read the deployment guide',
    guideFile: 'docs/GETTING_STARTED.md',
    boundariesTitle: 'A clear boundary of trust.',
    boundaries:
      'ClawDeck is for trusted administrators on one server. Docker socket access grants host-level power. Keep the console on localhost, a private network or behind authenticated HTTPS. It is not a multi-tenant service.',
    stage: 'Single-host pilot · 1.0.0-rc.2',
    stageText:
      'The dashboard interface is currently Chinese. This website and the setup guide are bilingual. Real OpenClaw image compatibility is verified by the deployer; the demo does not test Docker or upstream providers.',
    enterpriseEyebrow: 'PRODUCT DIRECTION, WITH CLEAR DELIVERY STATUS',
    enterpriseTitle: 'From a focused pilot<br>to organizational governance.',
    availableTitle: 'Available in the current candidate',
    available: [
      'Single-host fleet operations and configuration management',
      'Masked diffs, native validation, backups and recovery',
      'Shared administrator login and operation result records',
    ],
    plannedTitle: 'Enterprise roadmap · not yet available',
    planned: [
      'Individual identities, RBAC, SSO and approval workflows',
      'Encrypted credential storage, rotation and per-user audit trails',
      'Multi-server management, policies, alerts and audit export',
    ],
    enterpriseNote:
      'Enterprise management is the product direction. The current candidate is a single-host pilot for trusted administrators; it does not provide tenant isolation, compliance certification or an availability SLA.',
    closing: 'Put OpenClaw operations in order.',
    closeText: 'Start a pilot. Validate the workflow. Build with us.',
    contribute: 'Contribute on GitHub',
    security: 'Security policy',
    roadmap: 'Roadmap',
    footer: 'An independent community project. Not affiliated with or endorsed by OpenClaw.',
  },
  zh: {
    language: '简体中文',
    switch: 'EN',
    switchPath: '../',
    title: 'ClawDeck · 企业级龙虾管理平台',
    description:
      '面向企业 IT 运维与 AI 平台团队的 OpenClaw 管理平台，集中管理实例、模型、密钥和渠道，记录配置变更。当前提供单机试点候选版。',
    nav: ['企业价值', '变更管理', '部署试点'],
    eyebrow: '企业级 OPENCLAW 管理 · 开源 · 私有化部署',
    headline: '企业级<br><em>龙虾管理平台。</em>',
    intro:
      '为企业集中管理 OpenClaw 实例、模型与消息渠道。统一日常运维，确认配置变更，留存操作结果，让龙虾管理融入企业的 IT 运维流程。',
    cta: '体验交互演示',
    secondary: '在 GitHub 查看',
    note: '无需注册 · 示例数据 · 修改仅保留在当前浏览器内存中',
    scope: ['私有化部署', '集中运维管理', '变更记录与恢复'],
    preview: '企业 OpenClaw 实例的统一运维视图。',
    sample: '界面示意 · 示例数据',
    fleet: '实例总览',
    model: '模型与密钥',
    changes: '查看修改',
    online: '运行中',
    attention: '需关注',
    masked: '编辑器内的密钥保持遮罩',
    caption: '实例状态、资源使用与需要关注的问题，在同一个视图里。',
    problem: '面向企业 IT 运维与 AI 平台团队',
    benefitTitle: '统一管理龙虾，<br>让运维有章可循。',
    benefits: [
      [
        '01',
        '运维集中，状态清晰。',
        '容器状态、Docker 健康检查、CPU、内存与近期日志。按名称搜索、按状态筛选，快速找到需要你的实例。',
      ],
      [
        '02',
        '配置统一，保留实例差异。',
        '按实例配置模型、API Key 和消息渠道。批量统一默认模型，同时保留每个实例自己的凭据和渠道设置。',
      ],
      [
        '03',
        '变更有记录，恢复有依据。',
        '修改前确认差异并执行原生校验，保存前创建备份。记录成功、失败与未知结果。当前共享管理员版本不提供个人身份归因审计。',
      ],
    ],
    flowEyebrow: '为真实的日常管理设计',
    flowTitle: '读取。确认。应用。',
    flowText: '每次修改都经过确认，需要恢复时也有路可走。',
    steps: [
      ['读取', '取得当前配置与版本。'],
      ['确认', '检查不暴露密钥的差异。'],
      ['校验', '调用 OpenClaw 原生校验。'],
      ['应用', '备份、保存并记录结果。'],
    ],
    flowNote: '批量修改遇到首个写入失败即停止；此前成功的修改会保留，可按实例从备份恢复。',
    startEyebrow: '从可控范围的企业试点开始',
    startTitle: '部署到你的企业环境。',
    startIntro:
      '先选择一台 Linux Docker 主机和少量 OpenClaw 实例，保留原有 Compose 部署，验证管理流程后再规划扩大使用范围。',
    install: '在 Linux 服务器上安装',
    copy: '复制命令',
    copied: '已复制',
    copyFailed: '请选中下方命令手动复制。',
    setupSteps: [
      [
        '部署',
        '在具备 Docker Engine 与 Compose 的 Linux 主机上执行安装脚本；随机管理密码写入 .env。',
      ],
      [
        '接入',
        '通过 SSH 隧道访问 localhost:3210。为需要管理的容器添加 io.clawdeck.managed: "true" 标签。',
      ],
      ['验收', '先运行实例接入自检，再按清单验证你使用的 OpenClaw 镜像，验收后逐步推广。'],
    ],
    guide: '阅读完整部署指南',
    guideFile: 'README.zh-CN.md',
    boundariesTitle: '明确的权限边界。',
    boundaries:
      'ClawDeck 面向单台服务器上的可信管理员。Docker socket 具有宿主机级权限，请使用本机访问、私有网络或带认证的 HTTPS 代理。它不提供多租户隔离。',
    stage: '单机试点版 · 1.0.0-rc.2',
    stageText:
      '控制台当前为中文界面，官网与部署指南提供中英双语。真实 OpenClaw 镜像兼容性由部署方验收；演示不会测试 Docker 或上游服务。',
    enterpriseEyebrow: '明确产品方向，也明确交付状态',
    enterpriseTitle: '从企业试点，<br>走向组织级治理。',
    availableTitle: '当前候选版已提供',
    available: [
      '单台服务器的实例运维与模型、渠道配置管理',
      '密钥遮罩、变更预览、原生校验与备份恢复',
      '共享管理员登录、操作记录与执行结果追踪',
    ],
    plannedTitle: '企业能力规划 · 尚未提供',
    planned: [
      '独立用户身份、RBAC、SSO 与变更审批',
      '加密凭据存储、密钥轮换与个人操作审计',
      '多服务器纳管、策略管理、告警与审计导出',
    ],
    enterpriseNote:
      '企业级管理是产品方向；当前交付为面向可信管理员的单机试点候选版，不提供多租户隔离、合规认证或可用性 SLA 承诺。',
    closing: '让龙虾管理，成为企业能力。',
    closeText: '从试点开始，验证流程，共同完善。',
    contribute: '参与 GitHub 开源共建',
    security: '安全政策',
    roadmap: '路线图',
    footer: '独立社区项目，与 OpenClaw 无隶属关系，未获得其官方背书。',
  },
};

export function page(language) {
  const t = translations[language];
  const base = language === 'zh' ? '../' : './';
  const url = origin + (language === 'zh' ? '/zh/' : '/');
  return `<!doctype html>
<html lang="${language === 'zh' ? 'zh-CN' : 'en'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title><meta name="description" content="${t.description}">
<meta name="theme-color" content="#f6f5f0"><link rel="canonical" href="${url}">
<link rel="alternate" hreflang="en" href="${origin}/"><link rel="alternate" hreflang="zh-CN" href="${origin}/zh/"><link rel="alternate" hreflang="x-default" href="${origin}/">
<meta property="og:type" content="website"><meta property="og:title" content="${t.title}"><meta property="og:description" content="${t.description}"><meta property="og:url" content="${url}">
<link rel="icon" href="${base}icon.svg"><link rel="stylesheet" href="${base}style.css"><script src="${base}site.js" defer></script>
</head><body>
<a class="skip" href="#main">${language === 'zh' ? '跳转到正文' : 'Skip to content'}</a>
<header class="nav wrap"><a class="brand" href="${base}" aria-label="ClawDeck home"><img src="${base}icon.svg" width="36" height="36" alt="">ClawDeck<span class="wordmark-dot">✳</span></a><nav aria-label="Main"><a href="#why">${t.nav[0]}</a><a href="#workflow">${t.nav[1]}</a><a href="#start">${t.nav[2]}</a></nav><div class="nav-right"><a class="language" href="${t.switchPath}" lang="${language === 'zh' ? 'en' : 'zh-CN'}">${t.switch}</a><a class="github-link" href="${repository}">GitHub <span aria-hidden="true">↗</span></a></div></header>
<main id="main">
<section class="hero wrap"><div class="eyebrow"><span class="live-dot"></span>${t.eyebrow}</div><h1>${t.headline}</h1><div class="hero-bottom"><p class="intro">${t.intro}</p><div class="hero-action"><a class="button primary" href="${base}demo.html">${t.cta}<span aria-hidden="true">↗</span></a><a class="quiet-link" href="${repository}">${t.secondary} <span aria-hidden="true">→</span></a><small>${t.note}</small></div></div><div class="scope">${t.scope.map((s) => `<span><span aria-hidden="true">✳</span> ${s}</span>`).join('')}</div></section>
<section class="product wrap" aria-label="${t.preview}"><div class="product-top"><span class="mono">CLAWDECK / CONTROL ROOM</span><span class="sample">${t.sample}</span></div><div class="console"><aside><div class="console-brand"><img src="${base}icon.svg" alt="" width="28" height="28">ClawDeck</div><div role="tablist" aria-label="${t.preview}"><button role="tab" aria-selected="true" aria-controls="fleet" id="tab-fleet" data-tab="fleet">▦ <span>${t.fleet}</span></button><button role="tab" aria-selected="false" aria-controls="models" id="tab-models" data-tab="models" tabindex="-1">◈ <span>${t.model}</span></button><button role="tab" aria-selected="false" aria-controls="changes" id="tab-changes" data-tab="changes" tabindex="-1">≋ <span>${t.changes}</span></button></div><div class="console-server"><i class="live-dot"></i> docker-host-01<br><span>Linux · Docker Compose</span></div></aside>
<div class="console-body"><div id="fleet" role="tabpanel" aria-labelledby="tab-fleet"><div class="console-heading"><h2>${t.fleet}</h2><span class="chip">3 ${language === 'zh' ? '个示例实例' : 'sample instances'}</span></div><div class="mini-stats"><div><span>INSTANCES</span><strong>03</strong></div><div><span>RUNNING</span><strong>03<i class="green-mark">↗</i></strong></div><div><span>ATTENTION</span><strong class="coral">01</strong></div></div><div class="fleet-list">${[
    ['Atlas', 'Work assistant', 'anthropic / claude', '12', false],
    ['Coral', 'Community bot', 'openai / gpt', '7', false],
    ['Reef', 'Research agent', 'custom / model', '36', true],
  ]
    .map(
      ([name, desc, model, cpu, warning], i) =>
        `<div class="fleet-row"><span class="avatar av-${i}">✳</span><div class="instance-name"><strong>${name}</strong><small>${desc}</small></div><span class="model-name">${model}</span><div class="meter"><span>${cpu}% CPU</span><i style="--usage:${cpu}%"></i></div><span class="status ${warning ? 'warning' : ''}"><i></i>${warning ? t.attention : t.online}</span></div>`,
    )
    .join('')}</div></div>
<div id="models" role="tabpanel" aria-labelledby="tab-models" hidden><div class="console-heading"><h2>${t.model}</h2><span class="chip">Atlas</span></div><div class="model-form"><label>DEFAULT MODEL<span>anthropic / claude</span></label><label>PROVIDER<span>anthropic</span></label><label>API KEY<span class="masked">••••••••••••••••••••</span></label><p>↳ ${t.masked}</p><a href="${base}demo.html">${t.cta} →</a></div></div>
<div id="changes" role="tabpanel" aria-labelledby="tab-changes" hidden><div class="console-heading"><h2>${t.changes}</h2><span class="chip">Atlas / model.primary</span></div><div class="diff"><div class="diff-label">BEFORE</div><code class="removed">− openai / gpt</code><div class="diff-label">AFTER</div><code class="added">+ anthropic / claude</code></div><p class="diff-note">${t.steps[2][1]} ${t.steps[3][1]}</p><a class="quiet-link" href="${base}demo.html">${t.cta} →</a></div></div></div><div class="product-caption"><span>${t.caption}</span><a href="${base}demo.html">${t.cta} ↗</a></div></section>
<section class="benefits wrap section" id="why"><div class="eyebrow">${t.problem}</div><h2 class="section-title">${t.benefitTitle}</h2><div class="benefit-list">${t.benefits.map(([n, title, text]) => `<article><span class="index">${n}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
<section class="workflow" id="workflow"><div class="wrap"><div class="eyebrow">${t.flowEyebrow}</div><div class="workflow-heading"><h2 class="section-title">${t.flowTitle}</h2><p>${t.flowText}</p></div><ol class="flow">${t.steps.map(([title, text], i) => `<li><span class="step-dot">0${i + 1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol><p class="flow-note">↳ ${t.flowNote}</p></div></section>
<section class="enterprise wrap section" id="enterprise"><div class="eyebrow">${t.enterpriseEyebrow}</div><h2 class="section-title">${t.enterpriseTitle}</h2><div class="capabilities"><article><h3>${t.availableTitle}</h3><ul>${t.available.map((item) => `<li>${item}</li>`).join('')}</ul></article><article><h3>${t.plannedTitle}</h3><ul>${t.planned.map((item) => `<li>${item}</li>`).join('')}</ul></article></div><p class="enterprise-note">${t.enterpriseNote}</p><a class="quiet-link" href="${repository}/blob/main/docs/ROADMAP.md">${t.roadmap} ↗</a></section>
<section class="start wrap section" id="start"><div class="eyebrow">${t.startEyebrow}</div><h2 class="section-title">${t.startTitle}</h2><p class="start-intro">${t.startIntro}</p><div class="install-grid"><div class="terminal"><div class="terminal-title"><span><i></i><i></i><i></i></span><span>~/clawdeck</span></div><div class="terminal-content"><span class="terminal-comment"># ${t.install}</span><pre id="install-command">git clone https://github.com/Dante9k/clawdeck.git
cd clawdeck
sh scripts/install.sh</pre><button class="copy" data-copy data-copied="${t.copied}" data-failed="${t.copyFailed}">${t.copy}<span aria-hidden="true">⧉</span></button><span class="copy-status" role="status" aria-live="polite"></span></div></div><div class="setup-steps">${t.setupSteps.map(([title, text], i) => `<div><span>0${i + 1}</span><p><strong>${title}</strong>${text}</p></div>`).join('')}<a class="quiet-link" href="${repository}/blob/main/${t.guideFile}">${t.guide} ↗</a></div></div><div class="boundaries"><div><h3>${t.boundariesTitle}</h3><p>${t.boundaries}</p></div><div><span class="rc">${t.stage}</span><p>${t.stageText}</p></div></div></section>
<section class="closing wrap"><img src="${base}icon.svg" alt="" width="56" height="56"><h2>${t.closing}</h2><p>${t.closeText}</p><a class="button primary" href="${repository}">${t.contribute}<span aria-hidden="true">↗</span></a></section>
</main><footer class="wrap"><div><a class="brand" href="${base}">ClawDeck<span class="wordmark-dot">✳</span></a><p>${t.footer}</p></div><div class="footer-links"><a href="${repository}/blob/main/SECURITY.md">${t.security}</a><a href="${repository}/blob/main/docs/ROADMAP.md">${t.roadmap}</a><a href="${repository}/blob/main/LICENSE">MIT License</a></div></footer></body></html>`;
}
