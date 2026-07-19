# =====================
# Stage 1: Build
# =====================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# =====================
# Stage 2: Production
# =====================
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist
COPY .env .env

EXPOSE 3001

CMD ["node", "dist/main"]
