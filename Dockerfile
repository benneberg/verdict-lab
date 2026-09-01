# ------------------------------------------------------------------------------
# Stage 1: Build Dependencies & Compile Artifacts
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files and configuration
COPY tsconfig.json vite.config.ts server.ts index.html ./
COPY src/ ./src/

# Compile frontend SPA and backend server bundle
ENV NODE_ENV=production
RUN npm run build

# Prune development dependencies for lean production container
RUN npm prune --production

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Enforce production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Security: Run as unprivileged built-in node user
USER node

# Copy production dependencies and compiled build outputs
COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose standard container ingress port
EXPOSE 3000

# Health check to ensure API gateway is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# Launch bundled CommonJS server
CMD ["node", "dist/server.cjs"]
