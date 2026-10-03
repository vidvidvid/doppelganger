FROM node:22-alpine AS build
RUN apk add --no-cache python3
WORKDIR /build
COPY plugin ./plugin
COPY scripts ./scripts
COPY website ./website
COPY version.json ./
ARG RAILWAY_GIT_COMMIT_SHA
ENV RAILWAY_GIT_COMMIT_SHA=$RAILWAY_GIT_COMMIT_SHA
RUN sh scripts/build-release.sh

FROM node:22-alpine
WORKDIR /app
COPY --from=build --chown=node:node /build/website/server.mjs /build/website/package.json ./
COPY --from=build --chown=node:node /build/website/dist ./dist
COPY --from=build --chown=node:node /build/website/releases ./releases
USER node
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
