# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build the application
COPY . .
RUN pnpm run build

# Stage 2: Production Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Stage 3: Production Image
FROM node:20-alpine AS production

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Run as non-root user for security best practices
USER node

# Copy production dependencies and built code
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package.json ./

# Expose port (Cloud Run dynamically assigns this, but 8080 is default)
EXPOSE 8080

# Start the application
CMD ["node", "dist/main"]
