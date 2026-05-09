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
WORKDIR /app/apps/backend
RUN npm run prisma:generate && npm run build

FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app/apps/backend
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/apps/backend/prisma ./prisma
RUN npx prisma generate
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=2 CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
