FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/backend/package.json apps/backend/
COPY apps/agent/package.json apps/agent/
COPY apps/frontend/package.json apps/frontend/
RUN npm install --production=false

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend ./apps/backend
COPY apps/agent/package.json apps/agent/
WORKDIR /app/apps/backend
RUN npm run prisma:generate && npm run build

FROM base AS runner
WORKDIR /app/apps/backend
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/apps/backend/node_modules/.prisma ./node_modules/.prisma
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/src/main.js"]
