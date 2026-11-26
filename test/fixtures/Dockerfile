FROM node:24-alpine
COPY openclaw-fixture.cjs /usr/local/bin/openclaw
RUN chmod 755 /usr/local/bin/openclaw
ENV OPENCLAW_CONFIG_PATH=/state/openclaw.json
CMD ["openclaw", "fixture-server"]
