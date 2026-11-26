const repository = 'https://github.com/Dante9k/clawdeck';
const origin = 'https://clawdeck.jupyter-community.chatgpt.site';
const translations = {
  en: {
    language: 'English',
    switch: '中文',
    switchPath: 'zh/',
    title: 'ClawDeck — One server. All your claws.',
    description:
      'A self-hosted console for your OpenClaw containers. Manage models, API keys, channels and configuration from one place.',
    nav: ['Why ClawDeck', 'How it works', 'Get started'],
    eyebrow: 'OPEN SOURCE · SELF-HOSTED · BUILT FOR OPENCLAW',
    headline: 'One server.<br>All your <em>claws.</em>',
    intro:
      'Your OpenClaw fleet, finally in one place. See what’s running, organize models and channels, and make changes with confidence.',
    cta: 'Explore the demo',
    secondary: 'View on GitHub',
    note: 'No sign-up. Sample data. Changes stay in your browser.',
    scope: ['Your infrastructure', 'Zero runtime dependencies', 'MIT licensed'],
    preview: 'A calmer place to run your fleet.',
    sample: 'ILLUSTRATIVE PREVIEW',
    fleet: 'Fleet overview',
    model: 'Models & keys',
    changes: 'Review changes',
    online: 'Running',
    attention: 'Needs attention',
    masked: 'Keys stay masked in the editor',
    caption: 'A single view of containers, resources and the details that need your attention.',
    problem: 'MORE CLAWS. LESS CONTEXT SWITCHING.',
    benefitTitle: 'From scattered containers<br>to a clear overview.',
    benefits: [
      [
        '01',
        'Know what needs you.',
        'Container status, Docker health, CPU, memory and recent logs. Find a specific instance or filter your fleet in seconds.',
      ],
      [
        '02',
        'Keep every claw in tune.',
        'Edit provider models, API keys and channel configuration per instance. Apply a shared default model while keeping each instance’s own credentials.',
      ],
      [
        '03',
        'See a change before it lands.',
        'Review a masked diff, run the native OpenClaw validator, then save with a backup. Stale revisions are rejected; interrupted operations show an unknown result.',
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
    startEyebrow: 'YOUR HOST. YOUR CONTROL.',
    startTitle: 'Bring your own claws.',
    startIntro:
      'Already running OpenClaw with Docker Compose? Add the console alongside it. No migration to a hosted service.',
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
    stage: '1.0.0-rc.2 · Release candidate',
    stageText:
      'The dashboard interface is currently Chinese. This website and the setup guide are bilingual. Real OpenClaw image compatibility is verified by the deployer; the demo does not test Docker or upstream providers.',
    closing: 'Make room for your next claw.',
    closeText: 'Try it, deploy it, help make it better.',
    contribute: 'Contribute on GitHub',
    security: 'Security policy',
    roadmap: 'Roadmap',
    footer: 'An independent community project. Not affiliated with or endorsed by OpenClaw.',
  },
  zh: {
    language: '简体中文',
    switch: 'EN',
    switchPath: '../',
    title: 'ClawDeck · 一台服务器，所有龙虾尽在掌握',
    description: '自托管的 OpenClaw 容器总览面板，统一管理模型、API Key、消息渠道和配置。',
    nav: ['为什么用 ClawDeck', '工作流程', '开始部署'],
    eyebrow: '开源 · 自托管 · 为 OPENCLAW 而生',
    headline: '一台服务器。<br><em>龙虾，尽在掌握。</em>',
    intro:
      '给你的 OpenClaw 找一个共同的控制台。看清运行状态，整理模型与渠道，让每一次配置修改都有据可依。',
    cta: '体验交互演示',
    secondary: '在 GitHub 查看',
    note: '无需注册 · 示例数据 · 修改仅保留在当前浏览器内存中',
    scope: ['部署在你的服务器', '零第三方运行依赖', 'MIT 开源许可'],
    preview: '让一群龙虾，井井有条。',
    sample: '界面示意 · 示例数据',
    fleet: '实例总览',
    model: '模型与密钥',
    changes: '查看修改',
    online: '运行中',
    attention: '需关注',
    masked: '编辑器内的密钥保持遮罩',
    caption: '实例状态、资源使用与需要关注的问题，在同一个视图里。',
    problem: '龙虾越多，越需要一个清晰的总览。',
    benefitTitle: '从分散的容器，<br>到有条理的控制台。',
    benefits: [
      [
        '01',
        '先看清，再动手。',
        '容器状态、Docker 健康检查、CPU、内存与近期日志。按名称搜索、按状态筛选，快速找到需要你的实例。',
      ],
      [
        '02',
        '让每只龙虾，各司其职。',
        '按实例配置模型、API Key 和消息渠道。批量统一默认模型，同时保留每个实例自己的凭据和渠道设置。',
      ],
      [
        '03',
        '修改之前，心中有数。',
        '先看隐藏密钥后的差异，再执行 OpenClaw 原生校验，保存前创建备份。拒绝过期版本；中断的操作明确标记为结果未知。',
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
    startEyebrow: '你的主机。你的控制权。',
    startTitle: '带上你的龙虾，开始吧。',
    startIntro:
      '已经用 Docker Compose 部署了 OpenClaw？把控制台部署在旁边，就能开始接入，无需迁移到托管平台。',
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
    stage: '1.0.0-rc.2 · 发布候选版',
    stageText:
      '控制台当前为中文界面，官网与部署指南提供中英双语。真实 OpenClaw 镜像兼容性由部署方验收；演示不会测试 Docker 或上游服务。',
    closing: '下一只龙虾，也有好位置。',
    closeText: '体验、部署，一起把它做得更好。',
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
<section class="start wrap section" id="start"><div class="eyebrow">${t.startEyebrow}</div><h2 class="section-title">${t.startTitle}</h2><p class="start-intro">${t.startIntro}</p><div class="install-grid"><div class="terminal"><div class="terminal-title"><span><i></i><i></i><i></i></span><span>~/clawdeck</span></div><div class="terminal-content"><span class="terminal-comment"># ${t.install}</span><pre id="install-command">git clone https://github.com/Dante9k/clawdeck.git
cd clawdeck
sh scripts/install.sh</pre><button class="copy" data-copy data-copied="${t.copied}" data-failed="${t.copyFailed}">${t.copy}<span aria-hidden="true">⧉</span></button><span class="copy-status" role="status" aria-live="polite"></span></div></div><div class="setup-steps">${t.setupSteps.map(([title, text], i) => `<div><span>0${i + 1}</span><p><strong>${title}</strong>${text}</p></div>`).join('')}<a class="quiet-link" href="${repository}/blob/main/${t.guideFile}">${t.guide} ↗</a></div></div><div class="boundaries"><div><h3>${t.boundariesTitle}</h3><p>${t.boundaries}</p></div><div><span class="rc">${t.stage}</span><p>${t.stageText}</p></div></div></section>
<section class="closing wrap"><img src="${base}icon.svg" alt="" width="56" height="56"><h2>${t.closing}</h2><p>${t.closeText}</p><a class="button primary" href="${repository}">${t.contribute}<span aria-hidden="true">↗</span></a></section>
</main><footer class="wrap"><div><a class="brand" href="${base}">ClawDeck<span class="wordmark-dot">✳</span></a><p>${t.footer}</p></div><div class="footer-links"><a href="${repository}/blob/main/SECURITY.md">${t.security}</a><a href="${repository}/blob/main/docs/ROADMAP.md">${t.roadmap}</a><a href="${repository}/blob/main/LICENSE">MIT License</a></div></footer></body></html>`;
}
