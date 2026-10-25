FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend
RUN pnpm prisma:generate
RUN pnpm build

FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

RUN pnpm install --prod --frozen-lockfile
WORKDIR /app/apps/backend
RUN pnpm prisma:generate

COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
