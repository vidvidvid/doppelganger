FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node server.mjs package.json ./
COPY --chown=node:node dist ./dist
COPY --chown=node:node releases ./releases
USER node
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
