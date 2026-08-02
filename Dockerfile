# Dockerfile
FROM node:22-alpine AS development
WORKDIR /usr/src/app

RUN apk update && apk add bash

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY libs/shared/package*.json ./libs/shared/
RUN npm ci

COPY . .
RUN find . -name '*.sh' -exec sed -i 's/\r$//' {} +
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build -w @sigestaciones/api

FROM node:22-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

RUN apk update && apk add bash

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY libs/shared/package*.json ./libs/shared/
RUN npm ci --omit=dev

COPY . .
RUN find . -name '*.sh' -exec sed -i 's/\r$//' {} +
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
COPY --chown=node:node --from=development /usr/src/app/apps/api/dist ./apps/api/dist

CMD ["node", "apps/api/dist/src/main"]