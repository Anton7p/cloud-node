# Multi-stage build for production optimization
# Stage 1: Dependencies
FROM node:22-alpine AS dependencies

# Install openssl for Prisma 7
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (ignore-scripts to skip Husky in container)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Stage 2: Builder
FROM node:22-alpine AS builder

# Install openssl for Prisma 7
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Install all dependencies (including dev) - ignore-scripts to skip Husky
RUN npm ci --ignore-scripts

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Copy assets
COPY assets ./assets

# Build application
RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production

# Install openssl for Prisma 7 (required runtime dependency)
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Copy assets (HUD icons, images)
COPY --from=builder /app/assets ./assets

# Copy built application
COPY --from=builder /app/dist ./dist

# Set correct permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Start application
CMD ["node", "dist/main.js"]
