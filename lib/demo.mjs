const GB = 1024 ** 3;
export function demoData() {
  const rows = [
    [
      'atlas',
      'Atlas · 工作助理',
      '日常协作与任务处理',
      'running',
      'healthy',
      'anthropic/claude-sonnet-4-5',
      'feishu',
      8.4,
      0.84,
      18,
    ],
    [
      'code',
      'Code · 研发搭档',
      '代码审查与开发支持',
      'running',
      'healthy',
      'openai/gpt-4.1',
      'discord',
      14.6,
      1.42,
      12,
    ],
    [
      'research',
      'Scout · 研究员',
      '资料搜集与研究分析',
      'running',
      'healthy',
      'deepseek/deepseek-chat',
      'telegram',
      6.2,
      0.62,
      8,
    ],
    [
      'writer',
      'Muse · 内容助手',
      '内容创作与文案润色',
      'running',
      'healthy',
      'anthropic/claude-sonnet-4-5',
      'feishu',
      3.8,
      0.51,
      6,
    ],
    [
      'ops',
      'Watch · 运维助手',
      '监控巡检与异常分析',
      'running',
      'unhealthy',
      'openai/gpt-4.1',
      'telegram',
      1.2,
      0.38,
      3,
    ],
    [
      'lab',
      'Lab · 实验室',
      '新模型与工作流实验',
      'exited',
      'none',
      'deepseek/deepseek-chat',
      'discord',
      0,
      0,
      0,
    ],
  ];
  const instances = rows.map((r, i) => ({
    id: r[0],
    name: r[1],
    container: `openclaw-${r[0]}`,
    description: r[2],
    state: r[3],
    health: r[4],
    image: 'ghcr.io/openclaw/openclaw:demo',
    project: `claw-${r[0]}`,
    cpu: r[7],
    memory: r[8] * GB,
    memoryLimit: 2 * GB,
    startedAt: new Date(Date.now() - r[9] * 864e5).toISOString(),
    ports: [{ private: 18789, public: 18789 + i, ip: '127.0.0.1' }],
    url: null,
    model: r[5],
    channels: [r[6]],
    configSummary: true,
  }));
  const configs = new Map(
    instances.map((c) => [
      c.id,
      {
        agents: { defaults: { model: { primary: c.model, fallbacks: [] } } },
        models: {
          providers: {
            [c.model.split('/')[0]]: {
              baseUrl: 'https://api.example.com/v1',
              api: 'openai-completions',
              apiKey: 'test-secret-never-return',
              models: [{ id: c.model.split('/')[1], name: c.model.split('/')[1] }],
            },
          },
        },
        channels: {
          [c.channels[0]]:
            c.channels[0] === 'feishu'
              ? {
                  enabled: true,
                  accounts: {
                    main: { appId: 'cli_demo_application', appSecret: 'demo-feishu-secret' },
                  },
                  defaultAccount: 'main',
                }
              : {
                  enabled: true,
                  [c.channels[0] === 'telegram' ? 'botToken' : 'token']: 'demo-channel-secret',
                  dmPolicy: 'pairing',
                },
        },
        gateway: { mode: 'local', port: 18789, auth: { token: 'demo-gateway-secret' } },
      },
    ]),
  );
  return {
    instances,
    configs,
    server: {
      name: 'claw-server-01',
      os: 'Ubuntu 24.04 LTS',
      cpus: 8,
      memory: 16 * GB,
      docker: '演示环境',
      address: '192.168.1.100',
    },
    events: [
      {
        id: 'e1',
        time: new Date(Date.now() - 240e3).toISOString(),
        name: 'Watch · 运维助手',
        action: 'health',
        result: 'warning',
        message: '容器健康检查未通过，请查看日志',
      },
      {
        id: 'e2',
        time: new Date(Date.now() - 22 * 60e3).toISOString(),
        name: 'Code · 研发搭档',
        action: 'config',
        result: 'success',
        message: '模型配置已更新',
      },
      {
        id: 'e3',
        time: new Date(Date.now() - 52 * 60e3).toISOString(),
        name: 'Lab · 实验室',
        action: 'stop',
        result: 'success',
        message: '容器已停止',
      },
      {
        id: 'e4',
        time: new Date(Date.now() - 105 * 60e3).toISOString(),
        name: 'Atlas · 工作助理',
        action: 'start',
        result: 'success',
        message: '容器已启动',
      },
    ],
  };
}
