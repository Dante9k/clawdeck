import { RequestGate, mergeFields } from './editor.js';
const configGate = new RequestGate();
const $ = (selector) => document.querySelector(selector);
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const icons = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  box: 'M21 8l-9 5-9-5m9 5v9M3 7l9-5 9 5v10l-9 5-9-5z',
  chip: 'M7 7h10v10H7zM9 1v3m6-3v3M9 20v3m6-3v3M1 9h3m-3 6h3m16-6h3m-3 6h3',
  channel: 'M21 11a8 8 0 0 1-8 8H5l-4 3 2-7a8 8 0 1 1 18-4zM7 10h10m-10 4h6',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 2l-1 3-3 1-3 4 2 3-1 3 3 4 3-1 3 3 4-2 1-3 3-1 1-4-2-3 1-3-4-3-3 1z',
  server: 'M3 3h18v7H3zM3 14h18v7H3zM7 6h.01M7 17h.01M11 6h6m-6 11h6',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  refresh: 'M20 7a9 9 0 1 0 1 8M20 2v6h-6',
  plus: 'M12 5v14M5 12h14',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  external: 'M14 3h7v7m0-7L11 13M10 3H4v17h17v-7',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M2 12h20M12 2c6 5 6 15 0 20-6-5-6-15 0-20',
  memory: 'M3 6h18v12H3zM7 10v4m5-4v4m5-4v4M6 18v3m4-3v3m4-3v3m4-3v3',
  activity: 'M2 12h5l3-8 4 16 3-8h5',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  check: 'M5 12l4 4L19 6',
  alert: 'M12 8v5m0 4h.01M10 3 1 19h22L14 3z',
  stop: 'M5 5h14v14H5z',
  play: 'M6 3l15 9-15 9z',
  key: 'M14 6a5 5 0 1 1 4 8l-8 8H5v-5l8-8M18 6h.01',
  log: 'M4 3h16v18H4zM8 7h8m-8 5h8m-8 5h5',
  close: 'M6 6l12 12M6 18 18 6',
  logout: 'M9 4H3v16h6m6-13 5 5-5 5M7 12h13',
  copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
  menu: 'M3 6h18M3 12h18M3 18h18',
  shield: 'M12 2l9 4v7c0 5-9 9-9 9s-9-4-9-9V6zM8 12l3 3 5-6',
  lobster:
    'M7 7 3 3 2 8l5 4m10-5 4-4 1 5-5 4M9 9 8 4m7 5 1-5M8 11h8v6l-4 5-4-5zM7 14l-4 2m4 2-3 3m13-7 4 2m-4 2 3 3',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.box}"/></svg>`;
const MASK = '__CLAWDECK_SECRET_UNCHANGED__';
const state = {
  view: 'overview',
  data: null,
  query: '',
  filter: 'all',
  selected: new Set(),
  drawer: null,
  config: null,
  draft: null,
  revision: null,
  tab: 'overview',
  dirty: false,
  busy: false,
  demo: false,
  refreshing: false,
  error: null,
};
const viewNames = {
  overview: '服务器总览',
  instances: '龙虾实例',
  models: '模型与密钥',
  channels: '消息渠道',
  events: '操作记录',
  settings: '服务器设置',
};
const channelName = {
  feishu: '飞书',
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  qqbot: 'QQ',
};
const bytes = (value) =>
  value == null
    ? '—'
    : value >= 1024 ** 3
      ? `${(value / 1024 ** 3).toFixed(2)} GB`
      : `${(value / 1024 ** 2).toFixed(0)} MB`;
const percent = (value) => (value == null ? '—' : `${value.toFixed(1)}%`);
const since = (value) => {
  const min = Math.max(0, (Date.now() - new Date(value)) / 6e4);
  return min < 1
    ? '刚刚'
    : min < 60
      ? `${Math.floor(min)} 分钟前`
      : min < 1440
        ? `${Math.floor(min / 60)} 小时前`
        : `${Math.floor(min / 1440)} 天前`;
};
const uptime = (c) =>
  c.state !== 'running'
    ? '已停止'
    : !c.startedAt
      ? '运行时长未知'
      : `已运行 ${Math.max(0, Math.floor((Date.now() - new Date(c.startedAt)) / 864e5))} 天`;
const issue = (c) =>
  c.health === 'unknown' || c.health === 'unhealthy' || ['restarting', 'dead'].includes(c.state);
function status(c) {
  if (issue(c)) return '<span class="badge warn"><i class="dot"></i>需关注</span>';
  if (c.state === 'running') return '<span class="badge good"><i class="dot"></i>运行中</span>';
  if (c.state === 'exited' || c.state === 'created')
    return '<span class="badge gray"><i class="dot"></i>已停止</span>';
  return `<span class="badge gray">${esc(c.state)}</span>`;
}
function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 5000);
}
async function api(url, options = {}) {
  const response = await fetch('/api' + url, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-Clawdeck-Request': '1', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !url.includes('login')) login();
    throw new Error(data.error || '请求失败，请稍后重试。');
  }
  return data;
}
const requestId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');
const post = (url, body = {}) =>
  api(url, {
    method: 'POST',
    headers: { 'Idempotency-Key': requestId() },
    body: JSON.stringify(body),
  });
function login() {
  state.data = null;
  $('#overlay').innerHTML = '';
  $('#app').innerHTML =
    `<main class="login-shell"><form class="login-card" id="login-form"><img src="${esc(document.querySelector('link[rel="icon"]').href)}" alt="ClawDeck"><h1>欢迎回到 ClawDeck</h1><p>企业 OpenClaw 统一管理 · 单机试点版。</p><label class="field"><span>管理密码</span><input name="password" type="password" autocomplete="current-password" required autofocus></label><button class="button primary" type="submit">登录控制台 ${icon('arrow')}</button><div class="login-error" role="alert"></div></form></main>`;
}
async function refresh(manual = false) {
  if (state.refreshing) return;
  state.refreshing = true;
  try {
    state.data = await api('/overview');
    state.error = null;
    state.demo = state.data.demo;
    const ids = new Set(state.data.instances.map((c) => c.id));
    for (const id of state.selected) if (!ids.has(id)) state.selected.delete(id);
    render();
    if (manual) toast('实例状态已刷新');
  } catch (error) {
    state.error = error.message;
    if (state.data) render();
    else if ($('#login-form') === null) renderFailure(error.message);
  } finally {
    state.refreshing = false;
  }
}
function renderFailure(message) {
  $('#app').innerHTML =
    `<main class="login-shell"><section class="login-card"><img src="${esc(document.querySelector('link[rel="icon"]').href)}" alt=""><h1>连接尚未就绪</h1><p>${esc(message)}</p><button class="button primary" data-action="refresh">重新连接</button></section></main>`;
}
function render() {
  if (!state.data || state.composing) return;
  const menuOpen = $('.sidebar')?.classList.contains('open');
  const focus =
    $('#search') === document.activeElement
      ? { start: $('#search').selectionStart, end: $('#search').selectionEnd }
      : null;
  const { instances, server } = state.data;
  $('#app').innerHTML =
    `<aside class="sidebar ${menuOpen ? 'open' : ''}"><a class="brand" href="#overview" aria-label="ClawDeck 首页"><img src="${esc(document.querySelector('link[rel="icon"]').href)}" alt=""><div>ClawDeck<small>OPENCLAW CONSOLE</small></div></a><div class="workspace"><div class="square">${icon('server')}</div><div>我的服务器<small>Single server workspace</small></div><span class="chevron">${icon('down')}</span></div><div class="nav-caption">WORKSPACE</div><nav class="nav" aria-label="主导航">${[
      ['overview', 'grid', '总览'],
      ['instances', 'box', '龙虾实例'],
      ['models', 'chip', '模型与密钥'],
      ['channels', 'channel', '消息渠道'],
      ['events', 'clock', '操作记录'],
    ]
      .map(
        ([key, symbol, name]) =>
          `<button data-view="${key}" aria-label="${name}" title="${name}" class="${state.view === key ? 'active' : ''}">${icon(symbol)}<span>${name}</span>${key === 'instances' ? `<span class="count">${instances.length}</span>` : ''}</button>`,
      )
      .join(
        '',
      )}</nav><div class="sidebar-bottom"><nav class="nav"><button data-view="settings" aria-label="服务器设置" title="服务器设置" class="${state.view === 'settings' ? 'active' : ''}">${icon('settings')}<span>服务器设置</span></button></nav><div class="node-status"><strong><i class="dot"></i>${state.demo ? '演示服务器' : esc(server.name)}</strong>${state.demo ? '数据仅用于界面预览' : state.error ? '连接中断 · 等待重试' : 'Docker Engine 已连接'}</div><div class="profile"><div class="avatar">AD</div><div>Administrator<small>服务器管理员</small></div><button data-action="logout" aria-label="退出登录" title="退出登录">${icon('logout')}</button></div></div></aside><main class="main"><header class="topbar"><div class="breadcrumb"><button class="mobile-menu" data-action="menu" aria-label="打开导航">${icon('menu')}</button><span>工作空间</span>${icon('chevron')}<strong>主服务器</strong></div><div class="top-actions"><span class="updated">${state.error ? '连接中断' : `更新于 ${new Date(state.data.updatedAt).toLocaleTimeString('zh-CN', { hour12: false })}`}</span><span class="divider"></span>${state.demo ? '<span class="badge demo">演示模式</span>' : '<span class="badge good"><i class="dot"></i>本机连接</span>'}<button class="icon-button" data-action="help" aria-label="接入说明" title="接入说明">${icon('shield')}</button></div></header><div class="content"><div class="page-heading"><div><div class="eyebrow">${{ overview: 'FLEET OVERVIEW', instances: 'YOUR OPENCLAW FLEET', models: 'MODEL WORKSPACE', channels: 'CHANNEL WORKSPACE', events: 'ACTIVITY LOG', settings: 'SERVER SETTINGS' }[state.view]}</div><h1>${viewNames[state.view]}</h1><p>${{ overview: '一眼掌握运行状态，让每一只龙虾各司其职。', instances: '集中管理所有 OpenClaw 容器与独立配置。', models: '为每只龙虾选择模型，集中维护提供商与访问密钥。', channels: '管理每个实例的消息渠道与机器人账号。', events: '记录从面板发起的管理操作与执行结果。', settings: '查看服务器信息，配置实例的发现与访问方式。' }[state.view]}</p></div><div class="actions"><button class="button" data-action="refresh" aria-label="刷新状态" title="刷新状态">${icon('refresh')}<span class="refresh-label">刷新状态</span></button>${['models', 'channels'].includes(state.view) ? `<button class="button primary" data-action="sync">${icon('refresh')}同步配置</button>` : `<button class="button primary" data-action="help">${icon('plus')}接入龙虾</button>`}</div></div>${state.error ? `<div class="notice error" role="alert">${esc(state.error)} · 当前展示的是最后一次成功读取的数据。</div>` : ''}${state.data.auditWarning ? `<div class="notice error" role="alert">${esc(state.data.auditWarning)}</div>` : ''}${page()}<footer class="footnote"><span><i class="dot"></i>${state.demo ? '演示环境 · 所有操作仅修改演示数据' : 'Docker Engine · 每 10 秒刷新'} · ClawDeck ${esc(state.data.version || '1.0.0-rc.2')}</span><span>Enterprise OpenClaw Management</span></footer></div></main>`;
  if (focus && $('#search')) {
    $('#search').focus();
    $('#search').setSelectionRange(focus.start, focus.end);
  }
}
function page() {
  switch (state.view) {
    case 'overview':
      return overview();
    case 'instances':
      return instanceSection(false);
    case 'models':
      return configList('models');
    case 'channels':
      return configList('channels');
    case 'events':
      return `<section class="panel"><h3>执行结果 · 最近 100 项</h3>${operationsMarkup()}</section><section class="panel"><h3>审计记录</h3>${eventsMarkup(state.data.events)}</section>`;
    case 'settings':
      return settings();
  }
}
function overview() {
  const { instances, server } = state.data;
  const running = instances.filter((c) => c.state === 'running').length;
  const attention = instances.filter(issue).length;
  const known = instances.every((c) => c.cpu !== null && c.memory !== null);
  const cpu = instances.reduce((s, c) => s + (c.cpu || 0), 0) / Math.max(1, server.cpus);
  const mem = instances.reduce((s, c) => s + (c.memory || 0), 0);
  return `<section class="hero"><div class="hero-left"><div class="hero-title"><span class="server-icon">${icon('server')}</span>${esc(server.name)}<span class="badge"><i class="dot"></i>${state.demo ? '演示服务器' : '已连接'}</span></div><div class="server-meta"><span>${icon('globe')}${esc(server.address)}</span><span>${icon('box')}${esc(server.os)}</span></div><div class="server-meta"><span>${icon('chip')}${server.cpus} vCPU</span><span>${icon('memory')}${bytes(server.memory)} 内存</span><span>${icon('server')}Docker ${esc(server.docker)}</span></div></div><div class="hero-right"><div><div class="hero-kicker">FLEET STATUS</div><div class="hero-number">${running.toString().padStart(2, '0')}<span>/ ${instances.length.toString().padStart(2, '0')}</span></div><div class="hero-caption">龙虾正在运行</div></div><div class="hero-divider"></div><div><div class="hero-kicker">NEEDS ATTENTION</div><div class="hero-number" style="color:#e7ad8b">${attention.toString().padStart(2, '0')}<span>个实例</span></div><div class="hero-caption">需要你的关注</div></div></div></section><section class="metrics" aria-label="资源摘要"><div class="metric"><div class="metric-title">龙虾实例 ${icon('box')}</div><div class="metric-value">${instances.length}<small>个</small></div><div class="metric-foot">全部已发现的 OpenClaw 容器</div></div><div class="metric"><div class="metric-title">正在运行 ${icon('activity')}</div><div class="metric-value">${running}<small>个</small></div><div class="metric-foot"><span class="green">${instances.length ? Math.round((running / instances.length) * 100) : 0}%</span> 实例处于运行状态</div><div class="metric-line"><i style="width:${instances.length ? (running / instances.length) * 100 : 0}%"></i></div></div><div class="metric"><div class="metric-title">已管理容器 CPU ${icon('chip')}</div><div class="metric-value">${cpu.toFixed(1)}<small>%${known ? '' : ' · 部分'}</small></div><div class="metric-foot">占全机 ${server.cpus} 核算力</div><div class="metric-line"><i style="width:${Math.min(cpu, 100)}%"></i></div></div><div class="metric"><div class="metric-title">已管理容器内存 ${icon('memory')}</div><div class="metric-value">${(mem / 1024 ** 3).toFixed(2)}<small>GB${known ? '' : ' · 部分'}</small></div><div class="metric-foot">全机容量 ${(server.memory / 1024 ** 3).toFixed(0)} GB · 不含文件缓存</div><div class="metric-line"><i style="width:${Math.min((mem / server.memory) * 100, 100)}%;background:#b9c4d6"></i></div></div></section>${instanceSection(true)}<div class="bottom-grid"><section class="panel"><div class="section-heading"><h2>最近动态</h2><button class="text-button" data-view="events">全部记录 ${icon('arrow')}</button></div>${eventsMarkup(state.data.events.slice(0, 3))}</section><section class="panel hint-panel"><div class="hint-icon">${icon('key')}</div><h3>每只龙虾，都有自己的专长</h3><p>为不同任务配置独立模型与消息渠道。密钥在页面中自动遮罩，修改前保留配置备份。</p><button class="button" data-view="models">管理模型与密钥 ${icon('arrow')}</button></section></div>`;
}
function visibleInstances() {
  return state.data.instances.filter((c) => {
    const q = state.query.toLowerCase();
    return (
      (!q || [c.name, c.container, c.model, c.project].some((v) => v?.toLowerCase().includes(q))) &&
      (state.filter === 'all' ||
        (state.filter === 'running' && c.state === 'running' && !issue(c)) ||
        (state.filter === 'attention' && issue(c)) ||
        (state.filter === 'stopped' && ['exited', 'created', 'paused'].includes(c.state)))
    );
  });
}
function instanceSection() {
  const all = state.data.instances;
  const filtered = visibleInstances();
  const counts = {
    all: all.length,
    running: all.filter((c) => c.state === 'running' && !issue(c)).length,
    attention: all.filter(issue).length,
    stopped: all.filter((c) => ['exited', 'created', 'paused'].includes(c.state)).length,
  };
  return `<section><div class="section-heading"><h2>我的龙虾 <small>${all.length} 个实例，井然有序</small></h2><button class="text-button" data-action="select-all">${state.selected.size ? '取消选择' : '批量管理'} ${icon('chevron')}</button></div><div class="toolbar"><div class="filters" role="group" aria-label="实例状态筛选">${[
    ['all', '全部'],
    ['running', '运行中'],
    ['attention', '需关注'],
    ['stopped', '已停止'],
  ]
    .map(
      ([key, name]) =>
        `<button class="filter ${state.filter === key ? 'active' : ''}" data-filter="${key}">${name}<span>${counts[key]}</span></button>`,
    )
    .join(
      '',
    )}</div><label class="search">${icon('search')}<input id="search" placeholder="搜索名称、模型或容器…" aria-label="搜索实例" value="${esc(state.query)}"><kbd>⌘ K</kbd></label></div>${state.selected.size ? `<div class="bulkbar"><span>已选 ${state.selected.size} 个实例</span><button class="button small" data-bulk="start">${icon('play')}启动</button><button class="button small" data-bulk="restart">${icon('refresh')}重启</button><button class="button small danger" data-bulk="stop">${icon('stop')}停止</button><button class="button small" data-action="batch-model">统一默认模型</button></div>` : ''}<div class="instances">${filtered.map((c) => card(c, all.indexOf(c))).join('') || '<div class="empty wide">没有符合条件的龙虾实例。<br>调整筛选条件，或通过「接入龙虾」查看发现规则。</div>'}</div></section>`;
}
function card(c, i) {
  return `<article class="instance ${state.selected.has(c.id) ? 'selected' : ''}"><input class="card-select" type="checkbox" aria-label="选择 ${esc(c.name)}" data-select="${esc(c.id)}" ${state.selected.has(c.id) ? 'checked' : ''}><div class="instance-head"><div class="claw-avatar a${i % 6}">${icon('lobster')}</div><div style="min-width:0"><div class="name" title="${esc(c.name)}">${esc(c.name)}</div><div class="sub mono">${esc(c.container)}</div></div>${status(c)}</div><div class="desc">${c.writable === false ? '<span class="badge gray">待接入 · 只读</span> ' : ''}${esc(c.description)}</div><div class="model-line">${icon('chip')}<span class="model" title="${esc(c.model || '尚未读取配置')}">${esc(c.model || '尚未读取配置')}</span></div><div class="model-line">${icon('channel')}${(c.channels || []).map((key) => `<span class="channel-chip">${esc(channelName[key] || key)}</span>`).join('') || '<span class="muted">配置读取后显示渠道</span>'}</div><div class="resource-row"><div><div class="resource-title"><span title="单核占满为 100%">CPU</span><strong>${percent(c.cpu)}</strong></div><div class="resource-track"><i style="width:${Math.min(c.cpu || 0, 100)}%"></i></div></div><div><div class="resource-title"><span>内存</span><strong>${bytes(c.memory)}</strong></div><div class="resource-track memory"><i style="width:${Math.min(((c.memory || 0) / Math.max(c.memoryLimit, 1)) * 100, 100)}%"></i></div></div></div><div class="instance-footer"><span>${icon('clock')}${uptime(c)}</span><div class="actions"><button class="text-button" data-open="${esc(c.id)}" data-tab="logs">日志</button><button class="text-button" data-open="${esc(c.id)}" data-tab="overview">管理 ${icon('arrow')}</button></div></div></article>`;
}
function eventsMarkup(events) {
  return events.length
    ? events
        .map(
          (e) =>
            `<div class="event"><span class="event-symbol ${esc(e.result)}">${icon(e.result === 'warning' || e.result === 'error' ? 'alert' : e.action === 'config' ? 'settings' : e.action === 'stop' ? 'stop' : e.result === 'pending' ? 'clock' : 'check')}</span><div class="event-content"><strong>${esc(e.name)}</strong><br>${esc(e.message)}${e.result === 'pending' ? ' · 请求记录' : ''}</div><time title="${esc(e.time)}">${since(e.time)}</time></div>`,
        )
        .join('')
    : '<div class="empty">暂无操作记录。后续管理操作会记录在这里。</div>';
}
function configList(mode) {
  return `<div class="notice info">${mode === 'models' ? '密钥仅在对应实例内保存。空白输入表示保留原密钥，不会将真实值返回浏览器。' : '这里展示渠道配置，不代表实时连接状态。实际连通性请查看实例日志或 OpenClaw 后台。'} 点击「同步配置」读取运行中实例的最新设置。</div><div class="table-wrap"><table><thead><tr><th>龙虾实例</th><th>${mode === 'models' ? '默认模型' : '已配置渠道'}</th><th>容器状态</th><th>操作</th></tr></thead><tbody>${state.data.instances.map((c) => `<tr><td><strong>${esc(c.name)}</strong><div class="sub mono">${esc(c.container)}</div></td><td>${mode === 'models' ? `<span class="mono">${esc(c.model || '未读取')}</span>` : (c.channels || []).map((k) => `<span class="badge gray">${esc(channelName[k] || k)}</span>`).join('') || '未读取'}</td><td>${status(c)}</td><td><button class="button small" data-open="${esc(c.id)}" data-tab="${mode === 'models' ? 'model' : 'channels'}">${icon(mode === 'models' ? 'key' : 'channel')}${mode === 'models' ? '模型与密钥' : '管理渠道'}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function settings() {
  const s = state.data.server;
  return `<div class="settings-grid"><section class="panel"><h3>服务器信息</h3>${[
    ['服务器', s.name],
    ['操作系统', s.os],
    ['CPU', s.cpus + ' 核'],
    ['物理内存', bytes(s.memory)],
    ['Docker', s.docker],
    ['接入模式', state.demo ? '演示数据' : '本机 Unix socket'],
  ]
    .map(([k, v]) => `<div class="details-row"><span>${k}</span><strong>${esc(v)}</strong></div>`)
    .join(
      '',
    )}</section><section class="panel"><h3>实例发现</h3><p>自动识别名称或镜像包含 openclaw、clawdbot、moltbot 的容器。自动发现的实例仅展示状态；添加 io.clawdeck.managed: "true" 后才允许配置管理与容器控制。</p><p>通过 <code>io.clawdeck.name</code> 设置显示名称，通过 <code>io.clawdeck.url</code> 设置可访问的后台地址。</p><button class="button" data-action="help">${icon('log')}查看 Compose 接入示例</button></section><section class="panel wide"><h3>配置管理范围</h3><p>管理默认模型、模型提供商与渠道配置。其他 OpenClaw 配置保留原样。写入使用当前实例的原生配置校验器，自动创建修改前备份，并检测配置版本冲突。停止中的容器需要启动后才能编辑。</p><p>环境变量、OAuth 登录和外部 SecretRef 的实际凭据需要在原部署环境中管理。API Key 表单写入该实例的 OpenClaw 提供商配置；不会修改 Docker Compose 的环境变量。</p></section></div>`;
}
async function openDrawer(id, tab = 'overview') {
  if (state.busy) return;
  configGate.invalidate();
  state.backups = null;
  if (state.dirty) {
    confirmDialog('放弃未保存的修改？', '切换实例后，当前尚未保存的配置会丢失。', [], () => {
      state.dirty = false;
      openDrawer(id, tab);
    });
    return;
  }
  state.drawer = id;
  state.tab = tab;
  state.draft = null;
  state.config = null;
  state.configError = null;
  state.logs = null;
  state.dirty = false;
  drawDrawer();
  if (tab === 'logs') await loadLogs();
  else if (tab !== 'overview') await loadConfig();
}
function current() {
  return state.data?.instances.find((c) => c.id === state.drawer);
}
function drawDrawer() {
  const c = current();
  if (!c) return;
  $('#overlay').innerHTML =
    `<div class="backdrop" data-backdrop="drawer"><section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-heading"><header class="drawer-header"><div class="drawer-title"><div><h2 id="drawer-heading">${esc(c.name)}</h2><p><span class="mono">${esc(c.container)}</span> &nbsp; ${status(c)}</p></div><button class="icon-button" data-action="close-drawer" aria-label="关闭详情">${icon('close')}</button></div><nav class="drawer-tabs" aria-label="实例管理标签">${[
      ['overview', '概览'],
      ['model', '模型与密钥'],
      ['channels', '消息渠道'],
      ['json', '配置 JSON'],
      ['backups', '备份恢复'],
      ['logs', '运行日志'],
    ]
      .map(
        ([key, name]) =>
          `<button data-drawer-tab="${key}" class="${state.tab === key ? 'active' : ''}">${name}</button>`,
      )
      .join(
        '',
      )}</nav></header><div class="drawer-body">${drawerContent(c)}</div><footer class="drawer-footer">${drawerFooter(c)}</footer></section></div>`;
  document.body.style.overflow = 'hidden';
  if (state.busy)
    document
      .querySelectorAll('.drawer input,.drawer textarea,.drawer button')
      .forEach((el) => (el.disabled = true));
  else if (c.writable === false)
    document.querySelectorAll('.drawer [data-control]').forEach((el) => (el.disabled = true));
}
function drawerContent(c) {
  if (state.tab === 'backups') return backupsMarkup();
  if (c.writable === false && state.tab !== 'logs')
    return '<div class="notice">此实例仅自动发现。添加 io.clawdeck.managed: true 并重新应用 Compose 后可管理。</div><button class="button" data-action="help">查看接入步骤</button>';
  if (state.tab === 'overview')
    return `${issue(c) ? '<div class="notice">容器健康检查异常。请查看日志定位原因；重启可能暂时中断处理中的任务。</div>' : ''}<section class="form-section"><h3>实例信息</h3>${[
      ['容器', c.container],
      ['镜像', c.image],
      ['Compose 项目', c.project],
      [
        '健康检查',
        {
          healthy: '检查通过',
          unhealthy: '检查失败',
          starting: '检查中',
          none: '未配置健康检查',
          unknown: '读取失败，状态未知',
        }[c.health] || c.health,
      ],
      ['CPU（单核 = 100%）', percent(c.cpu)],
      ['内存', bytes(c.memory)],
      [
        '端口映射',
        c.ports
          .filter((p) => p.public)
          .map((p) => `${p.ip || '0.0.0.0'}:${p.public} → ${p.private}`)
          .join('，') || '未公开端口',
      ],
    ]
      .map(([k, v]) => `<div class="details-row"><span>${k}</span><strong>${esc(v)}</strong></div>`)
      .join(
        '',
      )}</section><section class="form-section"><h3>接入自检与容器控制</h3><p>自检验证配置读取、临时文件写入与原生校验能力。</p><button class="button" data-action="diagnostics">运行接入自检</button><div class="actions"><button class="button" data-control="start" ${c.state === 'running' ? 'disabled' : ''}>${icon('play')}启动</button><button class="button" data-control="restart" ${c.state !== 'running' ? 'disabled' : ''}>${icon('refresh')}重启</button><button class="button danger" data-control="stop" ${c.state !== 'running' ? 'disabled' : ''}>${icon('stop')}停止</button></div></section>`;
  if (state.tab === 'logs')
    return `<div class="section-heading"><h3>最近 300 行</h3><button class="button small" data-action="reload-logs">${icon('refresh')}刷新日志</button></div><p class="config-intro">已遮罩常见密钥格式。日志可能含业务内容，请按需查看。</p><pre class="logs">${esc(state.logs ?? '正在读取日志…')}</pre>`;
  if (state.configError)
    return `<div class="notice error">${esc(state.configError)}</div><button class="button" data-action="reload-config">重新读取</button>`;
  if (!state.draft)
    return '<div class="loading"><span class="spinner"></span>正在读取实例配置…</div>';
  if (state.tab === 'json')
    return `<div class="notice info">管理字段：model、providers、channels。保留 ${MASK} 占位符可保持密钥不变。其他 OpenClaw 设置不会被覆盖。</div><label class="field"><span>配置 JSON</span><textarea id="json-editor" class="json-editor" spellcheck="false">${esc(JSON.stringify(state.draft, null, 2))}</textarea></label>`;
  if (state.tab === 'model') return modelForm();
  return channelsForm();
}
function drawerFooter(c) {
  if (['model', 'channels', 'json'].includes(state.tab) && state.draft)
    return `<span>${state.busy ? '正在校验并处理…' : state.dirty ? '有未保存的修改' : '保存前校验 · 自动备份'}</span><div class="actions"><button class="button" data-action="validate" ${state.busy ? 'disabled' : ''}>校验配置</button><button class="button primary" data-action="save" ${state.busy ? 'disabled' : ''}>${icon('check')}预览并保存</button></div>`;
  return `<span>${state.demo ? '演示实例 · 不会操作真实服务器' : '配置仅作用于当前容器'}</span>${c.url ? `<a class="button" target="_blank" rel="noopener noreferrer" href="${esc(c.url)}">打开 OpenClaw ${icon('external')}</a>` : '<span>后台入口可通过 Docker label 配置</span>'}`;
}
function field(label, path, value, options = {}) {
  const secret = options.secret;
  const actual = secret ? '' : (value ?? '');
  return `<label class="field"><span>${esc(label)}</span>${options.area ? `<textarea data-path="${esc(JSON.stringify(path))}" ${options.json ? 'data-json="true"' : ''} rows="${options.rows || 4}" spellcheck="false">${esc(options.json ? JSON.stringify(value ?? {}, null, 2) : actual)}</textarea>` : `<input data-path="${esc(JSON.stringify(path))}" ${secret ? 'data-secret="true" type="password" autocomplete="new-password"' : 'type="text"'} value="${esc(actual)}" placeholder="${esc(options.placeholder || (secret ? '留空保留原值；输入新密钥以替换' : ''))}">`}${options.help ? `<small>${esc(options.help)}</small>` : ''}</label>`;
}
function modelForm() {
  const d = state.draft;
  const model = typeof d.model === 'string' ? { primary: d.model } : d.model;
  return `<section class="form-section"><h3>默认模型</h3><p>使用 provider/model 格式。模型 ID 由你接入的提供商决定。</p>${field('主模型', ['model', 'primary'], model.primary, { placeholder: '例如 anthropic/claude-sonnet-4-5' })}${field('备用模型', ['model', 'fallbacks'], model.fallbacks || [], { area: true, json: true, rows: 2, help: '按顺序尝试的模型列表，填写 JSON 数组，例如 ["provider/model"]。' })}</section><div class="section-heading"><h3>模型提供商 <span class="muted">${Object.keys(d.providers).length}</span></h3></div>${Object.entries(
    d.providers,
  )
    .map(
      ([key, p]) =>
        `<section class="form-section"><div class="provider-head"><h3 class="mono">${esc(key)}</h3><span class="badge ${p.apiKey ? 'good' : 'gray'}">${p.apiKey ? '密钥已配置 / 引用已设置' : '未配置内联密钥'}</span></div>${field('Base URL', ['providers', key, 'baseUrl'], p.baseUrl, { placeholder: 'https://your-provider.example/v1' })}${field('API 类型', ['providers', key, 'api'], p.api, { placeholder: 'openai-completions / anthropic-messages' })}${field('API Key', ['providers', key, 'apiKey'], p.apiKey, { secret: true, help: '只写入此实例；环境变量或 OAuth 凭据仍由原部署管理。' })}${field('提供商模型列表', ['providers', key, 'models'], p.models || [], { area: true, json: true, rows: 4, help: '每个模型包含 id 与 name；以实例原生校验为准。已有的能力与上下文设置会保留。' })}</section>`,
    )
    .join(
      '',
    )}<section class="form-section"><h3>添加提供商</h3><p>为此实例添加独立的模型接入配置。</p><div class="fields-two"><label class="field"><span>提供商 ID</span><input id="new-provider" placeholder="例如 my-provider" pattern="[a-zA-Z0-9_-]+"></label><div style="align-self:center"><button class="button" data-action="add-provider">${icon('plus')}添加</button></div></div></section>`;
}
function channelsForm() {
  return `<div class="notice info">渠道设置保存后由 OpenClaw 按自身策略加载。新增飞书等渠道前，需在该实例安装对应插件。</div>${
    Object.entries(state.draft.channels)
      .map(([key, c]) => {
        if (!c || typeof c !== 'object') return '';
        return `<section class="form-section"><div class="provider-head"><h3>${esc(channelName[key] || key)}</h3><span class="badge gray">配置</span></div><label class="toggle-label">启用此渠道<input type="checkbox" data-path="${esc(JSON.stringify(['channels', key, 'enabled']))}" ${c.enabled !== false ? 'checked' : ''}></label>${
          key === 'feishu'
            ? Object.entries(c.accounts || {})
                .map(
                  ([account, a]) =>
                    `<h3 style="font-size:11px;margin:18px 0 12px">账号 · ${esc(account)}</h3>${field('App ID', ['channels', key, 'accounts', account, 'appId'], a.appId)}${field('App Secret', ['channels', key, 'accounts', account, 'appSecret'], a.appSecret, { secret: true })}`,
                )
                .join('')
            : key === 'telegram' || key === 'discord'
              ? field(
                  key === 'telegram' ? 'Bot Token' : 'Bot Token',
                  ['channels', key, key === 'telegram' ? 'botToken' : 'token'],
                  c[key === 'telegram' ? 'botToken' : 'token'],
                  { secret: true },
                )
              : ''
        }${field('完整渠道设置', ['channels', key], c, { area: true, json: true, rows: 7, help: '可编辑多账号、群组策略与其他字段。仅修改过的表单覆盖同名设置；删除字段请使用「配置 JSON」。' })}</section>`;
      })
      .join('') || '<div class="empty">此实例尚未配置消息渠道。</div>'
  }<section class="form-section"><h3>添加渠道</h3><p>创建配置草稿，填写凭据后保存。</p><div class="actions">${
    ['feishu', 'telegram', 'discord']
      .filter((k) => !state.draft.channels[k])
      .map(
        (k) =>
          `<button class="button" data-add-channel="${k}">${icon('plus')}${channelName[k]}</button>`,
      )
      .join('') || '<span class="muted">更多渠道可在配置 JSON 中添加。</span>'
  }</div></section>`;
}
function gather() {
  if (!state.draft) return true;
  try {
    if (state.tab === 'json') {
      const d = JSON.parse($('#json-editor').value);
      if (!d || typeof d !== 'object' || !d.model || !d.providers || !d.channels)
        throw new Error('需要 model、providers、channels 三个字段。');
      state.draft = d;
      return true;
    }
    state.draft = mergeFields(
      state.draft,
      [...document.querySelectorAll('.drawer [data-path]')].map((input) => ({
        path: JSON.parse(input.dataset.path),
        changed: input.dataset.changed === 'true',
        secret: !!input.dataset.secret,
        json: !!input.dataset.json,
        checkbox: input.type === 'checkbox',
        value: input.type === 'checkbox' ? input.checked : input.value,
      })),
    );
    return true;
  } catch (error) {
    toast('配置格式有误：' + error.message);
    return false;
  }
}
async function loadConfig(force = false) {
  if (state.dirty && !force) {
    confirmDialog('重新读取配置？', '未保存的草稿将被丢弃。', [], () => {
      state.dirty = false;
      loadConfig(true);
    });
    return;
  }
  const id = state.drawer,
    token = configGate.issue();
  state.configError = null;
  drawDrawer();
  try {
    const result = await api('/instances/' + id + '/config');
    if (state.drawer !== id || !configGate.accepts(token) || state.dirty) return;
    state.config = result.config;
    state.draft = structuredClone(result.config);
    state.revision = result.revision;
    state.dirty = false;
    drawDrawer();
  } catch (error) {
    if (state.drawer === id && configGate.accepts(token) && !state.dirty) {
      state.configError = error.message;
      drawDrawer();
    }
  }
}
async function loadLogs() {
  const id = state.drawer;
  try {
    const result = await api(`/instances/${id}/logs`);
    if (state.drawer !== id) return;
    state.logs = result.text || '暂无日志。';
  } catch (error) {
    state.logs = error.message;
  }
  if (state.drawer === id && state.tab === 'logs') drawDrawer();
}
async function save(validate = false) {
  if (state.busy || !gather()) return;
  const id = state.drawer,
    payload = { config: structuredClone(state.draft), revision: state.revision };
  state.busy = true;
  drawDrawer();
  try {
    if (!validate) {
      const preview = await post('/instances/' + id + '/preview', payload);
      if (!preview.changes.length) {
        toast('配置没有变化');
        return;
      }
      if (!(await reviewChanges('确认配置变更', preview.changes))) return;
    }
    const result = await post(
      '/instances/' + id + '/' + (validate ? 'validate' : 'config'),
      payload,
    );
    if (validate)
      toast(
        result.warning ||
          (state.demo ? '演示检查通过，未执行真实原生校验' : 'OpenClaw 配置校验通过'),
      );
    else {
      state.dirty = false;
      await loadConfig(true);
      await refresh();
      toast(
        result.warning ||
          (state.demo ? '演示配置已保存' : '配置已保存并备份；是否热加载取决于实例设置'),
      );
    }
  } catch (error) {
    toast(error.message);
  } finally {
    state.busy = false;
    if (state.drawer === id) drawDrawer();
  }
}
function closeDrawer() {
  if (state.busy) {
    toast('配置操作进行中，请等待结果');
    return;
  }
  if (state.dirty) {
    confirmDialog('放弃未保存的修改？', '尚未保存的配置会丢失。', [], () => {
      state.dirty = false;
      closeDrawer();
    });
    return;
  }
  configGate.invalidate();
  state.drawer = null;
  state.draft = null;
  $('#overlay').innerHTML = '';
  document.body.style.overflow = '';
}
function confirmDialog(title, description, names, confirm) {
  const wrap = document.createElement('div');
  wrap.className = 'backdrop modal-backdrop';
  wrap.style.zIndex = '60';
  wrap.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><h2>${esc(title)}</h2><p>${esc(description)}</p>${names.length ? `<ul>${names.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}<div class="actions"><button class="button" data-cancel>取消</button><button class="button primary" data-confirm>确认</button></div></section>`;
  document.body.append(wrap);
  wrap.querySelector('[data-cancel]').onclick = () => wrap.remove();
  wrap.querySelector('[data-confirm]').onclick = () => {
    wrap.remove();
    confirm();
  };
  wrap.querySelector('[data-cancel]').focus();
}
function control(action, ids) {
  if (state.busy) return;
  if (ids.length > 20) {
    toast('每批最多 20 个实例');
    return;
  }
  if (ids.some((id) => state.data.instances.find((c) => c.id === id)?.writable === false)) {
    toast('所选实例包含尚未授权管理的容器，请先完成接入');
    return;
  }
  const names = ids.map((id) => state.data.instances.find((c) => c.id === id)?.name || id);
  const name = { start: '启动', stop: '停止', restart: '重启' }[action];
  confirmDialog(
    `${name} ${ids.length > 1 ? ids.length + ' 个实例' : names[0]}？`,
    state.demo
      ? '当前为演示模式，操作只影响演示数据。'
      : action === 'start'
        ? '将依次启动所选容器，遇到异常时停止后续操作。'
        : '将依次中断所选实例正在处理的任务；遇到异常时停止后续操作。',
    ids.length > 1 ? names : [],
    async () => {
      if (state.busy) return;
      state.busy = true;
      if (state.drawer) drawDrawer();
      let completed = 0,
        message = '';
      try {
        for (const id of ids) {
          toast(`正在${name} ${completed + 1} / ${ids.length}`);
          const result = await post(`/instances/${id}/${action}`);
          completed++;
          if (result.warning) {
            message = result.warning;
            break;
          }
        }
      } catch (error) {
        message = error.message;
      } finally {
        state.busy = false;
        await refresh();
        if (state.drawer) drawDrawer();
        toast(
          `${completed} / ${ids.length} 项完成${message ? '；' + message : '；详情见操作记录'}`,
        );
      }
    },
  );
}
function help() {
  const markup = `services:\n  your-openclaw:\n    labels:\n      io.clawdeck.managed: "true"\n      io.clawdeck.name: "我的龙虾"\n      io.clawdeck.description: "日常工作助手"\n      io.clawdeck.url: "https://claw.example.com"`;
  const wrap = document.createElement('div');
  wrap.className = 'backdrop modal-backdrop';
  wrap.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><h2>把龙虾接入 ClawDeck</h2><p>面板与 OpenClaw 部署在同一台 Docker 主机上。名称或镜像包含 openclaw 的容器会自动出现。添加以下 managed label 后才可执行管理操作。</p><pre>${esc(markup)}</pre><p>添加 labels 后，重新应用该服务的 Compose 配置。后台地址使用浏览器可访问的域名，不在地址中附带 token。设置 <code>io.clawdeck.managed: "false"</code> 可排除容器。</p>${state.demo ? '<div class="notice">当前是本地演示。真实接入需将项目部署到服务器并挂载 Docker socket。</div>' : ''}<div class="actions"><button class="button" data-copy>复制示例</button><button class="button primary" data-close>知道了</button></div></section>`;
  document.body.append(wrap);
  wrap.querySelector('[data-close]').onclick = () => wrap.remove();
  wrap.querySelector('[data-copy]').onclick = async () => {
    try {
      await navigator.clipboard.writeText(markup);
      toast('Compose labels 示例已复制');
    } catch {
      toast('复制不可用，请选中示例手动复制');
    }
  };
  wrap.querySelector('[data-close]').focus();
}
async function sync() {
  toast('正在逐个读取运行中的实例配置…');
  let success = 0,
    failed = 0;
  for (const c of state.data.instances.filter((c) => c.state === 'running')) {
    try {
      await api(`/instances/${c.id}/config`);
      success++;
    } catch {
      failed++;
    }
  }
  await refresh();
  toast(
    `已同步 ${success} 个实例${failed ? `，${failed} 个读取失败，可在实例详情中查看原因` : ''}`,
  );
}
document.addEventListener('click', async (event) => {
  const button = event.target.closest('button,a');
  if (!button || button.disabled) return;
  const d = button.dataset;
  if (d.view) {
    state.view = d.view;
    state.query = '';
    state.filter = 'all';
    state.selected.clear();
    location.hash = d.view;
    render();
    return;
  }
  if (button.matches('.brand')) {
    state.view = 'overview';
    render();
    return;
  }
  if (d.filter) {
    state.filter = d.filter;
    render();
    return;
  }
  if (d.open) {
    await openDrawer(d.open, d.tab);
    return;
  }
  if (d.drawerTab) {
    if (state.busy || !gather()) return;
    state.tab = d.drawerTab;
    drawDrawer();
    if (d.drawerTab === 'logs') await loadLogs();
    else if (d.drawerTab === 'backups') await loadBackups();
    else if (d.drawerTab !== 'overview' && !state.draft) await loadConfig();
    return;
  }
  if (d.restore) {
    await restoreBackup(d.restore);
    return;
  }
  if (d.control) {
    control(d.control, [state.drawer]);
    return;
  }
  if (d.bulk) {
    control(d.bulk, [...state.selected]);
    return;
  }
  if (d.addChannel) {
    if (!gather()) return;
    state.draft.channels[d.addChannel] =
      d.addChannel === 'feishu'
        ? {
            enabled: true,
            defaultAccount: 'main',
            accounts: { main: { appId: '', appSecret: '' } },
            groupPolicy: 'allowlist',
          }
        : { enabled: true, dmPolicy: 'pairing' };
    state.dirty = true;
    drawDrawer();
    return;
  }
  switch (d.action) {
    case 'diagnostics':
      await diagnostics();
      break;
    case 'batch-model':
      await batchModel();
      break;
    case 'refresh':
      await refresh(true);
      break;
    case 'help':
      help();
      break;
    case 'menu':
      $('.sidebar').classList.toggle('open');
      break;
    case 'select-all':
      if (state.selected.size) state.selected.clear();
      else visibleInstances().forEach((c) => state.selected.add(c.id));
      render();
      break;
    case 'close-drawer':
      closeDrawer();
      break;
    case 'reload-logs':
      await loadLogs();
      break;
    case 'reload-config':
      await loadConfig();
      break;
    case 'save':
      await save();
      break;
    case 'validate':
      await save(true);
      break;
    case 'sync':
      await sync();
      break;
    case 'logout':
      if (state.demo) {
        toast('当前是演示模式，无需登录');
        break;
      }
      await post('/logout');
      login();
      break;
    case 'add-provider': {
      const id = $('#new-provider').value.trim();
      if (
        !/^[a-zA-Z0-9_-]{1,64}$/.test(id) ||
        ['__proto__', 'prototype', 'constructor'].includes(id)
      ) {
        toast('提供商 ID 只能包含字母、数字、短横线和下划线');
        break;
      }
      if (!gather()) break;
      if (Object.hasOwn(state.draft.providers, id)) {
        toast('该提供商已存在');
        break;
      }
      state.draft.providers[id] = { baseUrl: '', api: 'openai-completions', models: [] };
      state.dirty = true;
      drawDrawer();
      break;
    }
  }
});
document.addEventListener('compositionstart', () => (state.composing = true));
document.addEventListener('compositionend', (event) => {
  state.composing = false;
  if (event.target.id === 'search') {
    state.query = event.target.value;
    render();
  }
});
document.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.query = event.target.value;
    render();
  }
  if (
    event.target.closest('.drawer') &&
    (event.target.dataset.path || event.target.id === 'json-editor')
  ) {
    event.target.dataset.changed = 'true';
    state.dirty = true;
    configGate.invalidate();
  }
});
document.addEventListener('change', (event) => {
  if (event.target.dataset.select) {
    event.target.checked
      ? state.selected.add(event.target.dataset.select)
      : state.selected.delete(event.target.dataset.select);
    render();
  }
  if (event.target.closest('.drawer') && event.target.dataset.path) {
    event.target.dataset.changed = 'true';
    state.dirty = true;
    configGate.invalidate();
  }
});
document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  const button = event.target.querySelector('button');
  button.disabled = true;
  try {
    await post('/login', { password: new FormData(event.target).get('password') });
    await refresh();
    if (state.drawer) drawDrawer();
  } catch (error) {
    if ($('.login-error')) $('.login-error').textContent = error.message;
    else toast(error.message);
  } finally {
    button.disabled = false;
  }
});
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    if (!$('#search')) {
      state.view = 'instances';
      render();
    }
    $('#search')?.focus();
  }
  if (event.key === 'Escape') {
    const modal = document.querySelector('body > .modal-backdrop');
    if (modal) {
      modal.remove();
      return;
    }
    if (state.drawer) closeDrawer();
    else $('.sidebar')?.classList.remove('open');
  }
  if (event.key === 'Tab') {
    const activeModal = [...document.querySelectorAll('.backdrop')].at(-1);
    if (activeModal) {
      const focusable = [
        ...activeModal.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]'),
      ];
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
});
window.addEventListener('beforeunload', (event) => {
  if (state.dirty || state.busy) {
    event.preventDefault();
    event.returnValue = '';
  }
});
async function boot() {
  try {
    const session = await api('/session');
    state.demo = session.demo;
    const hash = location.hash.slice(1);
    if (viewNames[hash]) state.view = hash;
    if (session.authenticated) await refresh();
    else login();
  } catch (error) {
    renderFailure(error.message);
  }
}
setInterval(() => {
  if (state.data && !document.hidden && !state.busy && !state.composing) refresh();
}, 10000);
function operationsMarkup() {
  const items = state.data.operations || [];
  return items.length
    ? items
        .map(
          (item) =>
            `<div class="event"><span class="badge ${item.status === 'success' ? 'good' : item.status === 'running' ? 'gray' : 'warn'}">${{ success: '完成', failed: '失败', unknown: '待核对', running: '进行中' }[item.status] || esc(item.status)}</span><div class="event-content"><strong>${esc(item.name)} · ${esc(item.action)}</strong><p>${esc(item.message)}</p><small class="mono">${esc(item.id)}</small></div><time>${since(item.time)}</time></div>`,
        )
        .join('')
    : '<div class="empty">暂无操作。结果保留 24 小时；结果未知时请先核对实例状态。</div>';
}

function reviewChanges(title, changes) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'backdrop modal-backdrop';
    wrap.style.zIndex = '70';
    wrap.innerHTML = `<section class="modal review-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${esc(title)}</h2><p>仅变更模型、提供商与渠道。密钥内容已隐藏；保存前会执行原生校验并备份。</p><div class="diff-list">${changes.map((c) => `<article class="diff-item"><strong>${esc(c.path)}</strong><div class="diff-before">− ${esc(c.before)}</div><div class="diff-after">+ ${esc(c.after)}</div></article>`).join('')}</div><div class="actions"><button class="button" data-cancel>取消</button><button class="button primary" data-confirm>确认应用</button></div></section>`;
    document.body.append(wrap);
    const done = (value) => {
      wrap.remove();
      resolve(value);
    };
    wrap.querySelector('[data-cancel]').onclick = () => done(false);
    wrap.querySelector('[data-confirm]').onclick = () => done(true);
    wrap.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        done(false);
      }
    });
    wrap.querySelector('[data-cancel]').focus();
  });
}

function backupsMarkup() {
  return `<div class="notice info">恢复仅影响默认模型、模型提供商与渠道，并使用备份中的原凭据。其他当前设置保留。恢复前会再建一份备份。最多展示最近 50 份。</div>${state.backupError ? `<div class="notice error">${esc(state.backupError)}</div>` : state.backups === null ? '<p>正在读取备份…</p>' : state.backups?.length ? state.backups.map((b) => `<section class="form-section"><strong>${esc(new Date(b.time).toLocaleString('zh-CN'))}</strong><p class="mono">${esc(b.id)}</p><div class="actions"><span>${bytes(b.size)}</span><button class="button" data-restore="${esc(b.id)}">预览恢复</button></div></section>`).join('') : '<div class="empty">暂无面板备份。第一次保存后会自动建立。</div>'}`;
}
async function loadBackups() {
  const id = state.drawer;
  state.backups = null;
  state.backupError = null;
  drawDrawer();
  try {
    const result = await api('/instances/' + id + '/backups');
    if (state.drawer === id) state.backups = result.backups;
  } catch (error) {
    if (state.drawer === id) state.backupError = error.message;
  }
  if (state.drawer === id && state.tab === 'backups') drawDrawer();
}
async function restoreBackup(backup) {
  if (state.busy) return;
  if (state.dirty) {
    toast('请先保存或放弃当前草稿，再恢复备份');
    return;
  }
  const id = state.drawer;
  state.busy = true;
  drawDrawer();
  try {
    const current = await api('/instances/' + id + '/config');
    const payload = { backup, revision: current.revision };
    const preview = await post('/instances/' + id + '/preview', payload);
    if (!preview.changes.length) {
      toast('备份与当前管理配置相同');
      return;
    }
    if (!(await reviewChanges('恢复选定备份', preview.changes))) return;
    const result = await post('/instances/' + id + '/restore', payload);
    state.draft = null;
    state.config = null;
    configGate.invalidate();
    await loadBackups();
    await refresh();
    toast(result.warning || '已恢复所选配置并备份恢复前状态');
  } catch (error) {
    toast(error.message);
  } finally {
    state.busy = false;
    if (state.drawer === id) drawDrawer();
  }
}
async function diagnostics() {
  if (state.busy) return;
  const id = state.drawer;
  state.busy = true;
  drawDrawer();
  try {
    const result = await post('/instances/' + id + '/diagnostics');
    confirmDialog('接入自检通过', result.checks.join('；') + '。' + result.note, [], () => {});
  } catch (error) {
    toast('自检未通过：' + error.message);
  } finally {
    state.busy = false;
    if (state.drawer === id) drawDrawer();
  }
}

function modelPrompt() {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'backdrop modal-backdrop';
    wrap.innerHTML = `<section class="modal" role="dialog" aria-modal="true"><h2>统一默认模型</h2><p>保留每个实例自己的密钥、备用模型和渠道。提供商与模型须已在每个实例中登记；任一实例预检失败时均不开始应用。</p><label class="field"><span>主模型 · provider/model</span><input id="batch-model-value" placeholder="例如 my-provider/my-model"></label><div class="actions"><button class="button" data-cancel>取消</button><button class="button primary" data-confirm>检查所选实例</button></div></section>`;
    document.body.append(wrap);
    const done = (value) => {
      wrap.remove();
      resolve(value);
    };
    wrap.querySelector('[data-cancel]').onclick = () => done(null);
    wrap.querySelector('[data-confirm]').onclick = () =>
      done(wrap.querySelector('input').value.trim());
    wrap.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        done(null);
      }
    });
    wrap.querySelector('input').focus();
  });
}
async function batchModel() {
  if (state.busy) return;
  const ids = [...state.selected];
  if (!ids.length) return;
  if (ids.length > 20) {
    toast('每批最多 20 个实例，请缩小选择范围');
    return;
  }
  const primary = await modelPrompt();
  if (primary === null) return;
  if (!/^[^\s/]+\/\S+$/.test(primary)) {
    toast('模型应为 provider/model 格式');
    return;
  }
  state.busy = true;
  const plans = [],
    changes = [];
  try {
    for (const id of ids) {
      const c = state.data.instances.find((c) => c.id === id);
      if (c.writable === false || c.state !== 'running')
        throw new Error(c.name + ' 尚未接入或未运行');
      toast('正在预检 ' + c.name);
      const current = await api('/instances/' + id + '/config');
      const slash = primary.indexOf('/'),
        provider = current.config.providers[primary.slice(0, slash)];
      if (!provider?.models?.some((m) => m.id === primary.slice(slash + 1)))
        throw new Error(c.name + ' 未登记该提供商和模型，请先配置');
      const config = structuredClone(current.config);
      config.model = typeof config.model === 'string' ? primary : { ...config.model, primary };
      const payload = { config, revision: current.revision };
      const preview = await post('/instances/' + id + '/preview', payload);
      if (!preview.changes.length) continue;
      const validation = await post('/instances/' + id + '/validate', payload);
      if (validation.warning) throw new Error(c.name + '：' + validation.warning);
      changes.push(
        ...preview.changes.map((change) => ({ ...change, path: c.name + ' / ' + change.path })),
      );
      plans.push({ id, name: c.name, payload });
    }
    if (!changes.length) {
      toast('所有实例已经使用此模型');
      return;
    }
    if (!(await reviewChanges('统一 ' + plans.length + ' 个实例的默认模型', changes))) return;
    let completed = 0;
    for (const plan of plans) {
      try {
        const result = await post('/instances/' + plan.id + '/config', plan.payload);
        completed++;
        if (result.warning) {
          toast(result.warning + '；批次已停止，完成 ' + completed + ' / ' + plans.length + ' 项');
          return;
        }
      } catch (error) {
        toast(
          plan.name +
            '：' +
            error.message +
            '；后续实例未执行。已完成 ' +
            completed +
            ' 项，可分别从备份恢复。',
        );
        return;
      }
    }
    toast('已应用 ' + completed + ' / ' + plans.length + ' 个实例；详情见操作记录');
  } catch (error) {
    toast('预检未通过，未执行批量修改：' + error.message);
  } finally {
    state.busy = false;
    await refresh();
  }
}

await boot();
