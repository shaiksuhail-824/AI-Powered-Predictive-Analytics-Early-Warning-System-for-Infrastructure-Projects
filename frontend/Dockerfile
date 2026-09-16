# ==============================================================================
# MoSPI PAIMANA Early-Warning & Predictive Analytics Platform (SIH26103)
# Production Multi-Stage Dockerfile for Next.js 14 Frontend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependency Installation
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Production Build
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG BACKEND_URL=http://backend:8000
ARG INTERNAL_API_URL=http://backend:8000/api/v1
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    BACKEND_URL=${BACKEND_URL} \
    INTERNAL_API_URL=${INTERNAL_API_URL}

RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runner
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    BACKEND_URL=http://backend:8000 \
    INTERNAL_API_URL=http://backend:8000/api/v1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create unprivileged system user for secure container execution
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static public assets
COPY --from=builder /app/public ./public

# Copy compiled Next.js build artifacts with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

# Health check using built-in Alpine wget
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

CMD ["npm", "run", "start"]
