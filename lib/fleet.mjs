import { managed, metrics } from './docker.mjs';

export function createFleet({ demo, demoState, docker, summaries }) {
  let cached = null,
    inFlight = null;
  async function list(force = false) {
    if (demo) return structuredClone({ instances: demoState.instances, server: demoState.server });
    if (!force && cached && Date.now() - cached.time < 4500) return cached.value;
    if (inFlight) return inFlight;
    inFlight = (async () => {
      await docker.connect();
      const [all, info] = await Promise.all([
        docker.request('GET', '/containers/json?all=1'),
        docker.request('GET', '/info'),
      ]);
      const instances = [];
      const selected = all.filter(managed);
      let cursor = 0;
      await Promise.all(
        Array.from({ length: Math.min(4, selected.length) }, async () => {
          while (cursor < selected.length) {
            const c = selected[cursor++];
            const labels = c.Labels || {};
            let data = null,
              details = null;
            try {
              details = await docker.request('GET', `/containers/${c.Id}/json`);
            } catch {}
            if (c.State === 'running')
              try {
                data = metrics(
                  await docker.request('GET', `/containers/${c.Id}/stats?stream=false`),
                );
              } catch {}
            let url = null;
            try {
              const parsed = new URL(labels['io.clawdeck.url']);
              if (
                ['http:', 'https:'].includes(parsed.protocol) &&
                !parsed.username &&
                !parsed.password &&
                !parsed.hash &&
                !parsed.search
              )
                url = parsed.href;
            } catch {}
            instances.push({
              id: c.Id,
              writable: labels['io.clawdeck.managed'] === 'true',
              name: labels['io.clawdeck.name'] || (c.Names?.[0] || '').replace(/^\//, ''),
              container: (c.Names?.[0] || '').replace(/^\//, ''),
              description: labels['io.clawdeck.description'] || 'OpenClaw 实例',
              state: c.State,
              health: details ? details.State?.Health?.Status || 'none' : 'unknown',
              image: c.Image,
              project: labels['com.docker.compose.project'] || '—',
              cpu: data?.cpu ?? (c.State === 'running' ? null : 0),
              memory: data?.memory ?? (c.State === 'running' ? null : 0),
              memoryLimit: data?.memoryLimit ?? 0,
              startedAt: details?.State?.StartedAt || null,
              ports: (c.Ports || []).map((p) => ({
                private: p.PrivatePort,
                public: p.PublicPort,
                ip: p.IP,
              })),
              url,
              ...(summaries.get(c.Id) || {}),
            });
          }
        }),
      );
      instances.sort((a, b) => a.name.localeCompare(b.name));
      const value = {
        instances,
        server: {
          name: process.env.SERVER_NAME || info.Name,
          os: info.OperatingSystem,
          cpus: info.NCPU,
          memory: info.MemTotal,
          docker: info.ServerVersion,
          address: process.env.SERVER_ADDRESS || '本机 Docker Engine',
        },
      };
      cached = { time: Date.now(), value };
      return value;
    })();
    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  }

  return {
    list,
    invalidate() {
      cached = null;
    },
  };
}
