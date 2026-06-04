############ deps — install once, cache on lockfile ############
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json nx.json ./
COPY apps/life-ops-dashboard/package.json      apps/life-ops-dashboard/
COPY apps/life-ops-dashboard-e2e/package.json  apps/life-ops-dashboard-e2e/
COPY packages/ui/package.json                  packages/ui/
RUN npm ci

############ build ############
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NX_DAEMON=false
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx nx build life-ops-dashboard

############ runner — small, non-root ############
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# standalone replicates the workspace path under itself because of outputFileTracingRoot
COPY --from=build --chown=nextjs:nodejs /app/apps/life-ops-dashboard/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/life-ops-dashboard/.next/static    ./apps/life-ops-dashboard/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/life-ops-dashboard/public           ./apps/life-ops-dashboard/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/life-ops-dashboard/server.js"]