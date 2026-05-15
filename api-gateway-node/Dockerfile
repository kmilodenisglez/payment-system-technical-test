FROM node:20-alpine AS builder

WORKDIR /app

COPY api-gateway-node/package*.json ./
RUN npm ci

COPY api-gateway-node/prisma ./prisma
RUN npx prisma generate

COPY api-gateway-node/tsconfig.json .
COPY api-gateway-node/src ./src
RUN npm run build

# ---- Production image ----
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# Copy the generated Prisma client (needed at runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
# Copy prisma schema for db push command
COPY api-gateway-node/prisma ./prisma

EXPOSE 3000

# db push creates/updates tables on every cold start; safe for demos.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
