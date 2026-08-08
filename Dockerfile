# syntax=docker/dockerfile:1

FROM node:22.23.1-bookworm-slim AS frontend-build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY .browserslistrc .eslintrc.js babel.config.js ./
COPY public ./public
COPY src ./src

ARG VUE_APP_API_BASE_URL=/api
ENV VUE_APP_API_BASE_URL=${VUE_APP_API_BASE_URL}
RUN npm run build

FROM node:22.23.1-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001 \
    STATIC_DIRECTORY=/app/dist

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node server ./server
COPY --chown=node:node --from=frontend-build /app/dist ./dist

USER node
EXPOSE 3001

CMD ["node", "server/index.js"]
