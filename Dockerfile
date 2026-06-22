# ─── Stage 1: Build React PWA ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# --ignore-scripts skips native addon compilation (better-sqlite3 is server-only,
# not needed during the Vite build step)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build (vite-plugin-pwa produces the PWA that Capacitor also uses)
COPY . .
RUN npm run build

# ─── Stage 2: Serve via nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Replace default config with our reverse-proxy config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
