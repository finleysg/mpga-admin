FROM node:24-alpine AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN turbo prune @mpga/admin --docker

FROM base AS installer
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm turbo build --filter=@mpga/admin

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public
COPY --from=installer --chown=nextjs:nodejs /app/packages/database/drizzle ./packages/database/drizzle
COPY --from=installer --chown=nextjs:nodejs /app/packages/database/migrate.mjs ./packages/database/migrate.mjs
RUN npm install --no-save mysql2
COPY --chown=nextjs:nodejs apps/admin/start.sh ./start.sh
RUN chmod +x start.sh
USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]
