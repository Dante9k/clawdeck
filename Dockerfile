FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY lib ./lib
COPY public ./public
ENV HOST=0.0.0.0 PORT=3210 DATA_DIR=/data
EXPOSE 3210
CMD ["node", "server.mjs"]
