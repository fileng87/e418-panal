# Dockerfile

# ---- Base Node ----
# Use an official Node.js LTS version as a parent image
# Using alpine for smaller image size
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
# Install pnpm globally
FROM base AS deps
RUN npm install -g pnpm

# Install dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
# Build the Next.js application
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# 明確複製建置所需的檔案和目錄
COPY next.config.ts postcss.config.mjs tsconfig.json components.json eslint.config.mjs ./
COPY public ./public
COPY src ./src

# Set build-time environment variables if necessary (e.g., NEXT_PUBLIC_*)
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm build

# ---- Production Dependencies Only ----
# Prune development dependencies
FROM deps AS prod-deps
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
RUN pnpm prune --prod

# ---- Runner ----
# Use a minimal Node.js image to run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=prod-deps /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Set the correct user for running the application
# USER node # Optional: Run as non-root user for security

# Command to run the application
CMD ["node", "server.js"] 