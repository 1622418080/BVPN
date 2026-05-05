FROM node:22-alpine AS base
RUN apk add --no-cache wireguard-tools iproute2
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/agent/package.json apps/agent/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm install --production=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/agent ./apps/agent
COPY apps/backend/package.json apps/backend/
WORKDIR /app/apps/agent
RUN npm run build

FROM base AS runner
WORKDIR /app/apps/agent
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/agent/dist ./dist
COPY --from=builder /app/apps/agent/package.json ./
ENV NODE_ENV=production
EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:4100/health || exit 1
CMD ["node", "dist/src/main.js"]
