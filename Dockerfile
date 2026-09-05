# PahadSathi Station Gateway Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Vite frontend bundle
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

EXPOSE 8080

CMD ["node", "server/gateway.js"]
