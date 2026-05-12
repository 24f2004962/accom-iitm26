FROM node:22-slim

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10 --no-fund --no-audit

# Copy everything (node_modules, mobile, dist, etc. excluded via .dockerignore)
COPY . .

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Build the Vite web-admin
RUN pnpm --filter @workspace/web-admin run build

EXPOSE 8080

# At runtime: push DB schema (needs DATABASE_URL), then start the API server
CMD ["sh", "-c", "pnpm --filter @workspace/db run push && NODE_ENV=production node --import tsx/esm artifacts/api-server/src/index.ts"]
