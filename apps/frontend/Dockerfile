FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/
COPY apps/agent/package.json apps/agent/
RUN npm install --production=false

FROM node:22-alpine AS builder
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY apps/frontend ./apps/frontend
RUN npm run build -w apps/frontend

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=2 CMD wget -qO- http://127.0.0.1:3000 || exit 1
CMD ["node", "server.js"]
