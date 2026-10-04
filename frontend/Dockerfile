# ---- Relay Frontend Dockerfile (multi-stage build) ----
# Stage 1 builds the React/Vite app into static files.
# Stage 2 serves those static files with nginx — the final image does NOT
# contain Node.js or node_modules, so it stays small and production-ready.

# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Stage 2: Serve ----
FROM nginx:alpine

# Remove nginx's default sample site and use ours instead.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]