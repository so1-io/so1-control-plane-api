# Multi-stage build for so1-control-plane-api

# === Build Stage ===
FROM node:20-alpine AS builder

# GitHub token for installing @so1-io/shared from GitHub Packages
ARG GITHUB_TOKEN

WORKDIR /app

# Copy package files
COPY package.json ./

# Configure npm to use GitHub Packages for @so1-io scope
RUN echo "@so1-io:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

# Install dependencies
RUN npm install

# Copy source files
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Clean up .npmrc (don't want token in final image)
RUN rm -f .npmrc

# === Runtime Stage ===
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/index.js"]
