FROM node:24-alpine AS base

FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN turbo prune @mpga/public --docker

FROM base AS installer
WORKDIR /app
RUN npm install -g pnpm
ARG NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ARG POSTHOG_PERSONAL_API_KEY
ARG POSTHOG_PROJECT_ID
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm turbo build --filter=@mpga/public
RUN if [ -n "$POSTHOG_PERSONAL_API_KEY" ]; then \
      POSTHOG_CLI_API_KEY=$POSTHOG_PERSONAL_API_KEY \
      POSTHOG_CLI_PROJECT_ID=$POSTHOG_PROJECT_ID \
      POSTHOG_CLI_HOST=${NEXT_PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com} \
      npx --yes @posthog/cli@latest sourcemap inject --directory ./apps/public/.next/static && \
      POSTHOG_CLI_API_KEY=$POSTHOG_PERSONAL_API_KEY \
      POSTHOG_CLI_PROJECT_ID=$POSTHOG_PROJECT_ID \
      POSTHOG_CLI_HOST=${NEXT_PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com} \
      npx --yes @posthog/cli@latest sourcemap upload --directory ./apps/public/.next/static --release-name mpga-public; \
    fi

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=installer --chown=nextjs:nodejs /app/apps/public/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/public/.next/static ./apps/public/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/public/public ./apps/public/public
RUN npm install --no-save mysql2
COPY --chown=nextjs:nodejs apps/public/start.sh ./start.sh
RUN chmod +x start.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["./start.sh"]
