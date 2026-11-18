
# FROM node:22-bookworm-slim AS deps
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# FROM node:22-bookworm-slim AS builder
# WORKDIR /app

# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# RUN npm run build

# FROM node:22-bookworm-slim AS runner
# WORKDIR /app

# ENV NODE_ENV=production
# ENV PORT=5000

# COPY package*.json ./
# RUN npm ci --omit=dev

# COPY --from=builder /app/dist ./dist

# EXPOSE 5000

# CMD ["npm", "start"]




FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Remove development dependencies after compilation
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["npm", "start"]
