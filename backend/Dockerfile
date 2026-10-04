# ---- Relay Backend Dockerfile ----
# This single image is used for BOTH the API server and the worker process.
# Which one runs is decided by the "command" set in docker-compose.yml,
# not by this file — that way we only maintain one image for both.

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (separate layer) so Docker can cache this step
# and skip reinstalling node_modules every time only source code changes.
COPY package*.json ./
RUN npm install --omit=dev

# Now copy the rest of the backend source code.
COPY . .

# Default port the API server listens on (worker doesn't need a port,
# this is only used when the "backend" service runs this image).
EXPOSE 5000

# Default command — docker-compose overrides this for the worker service.
CMD ["node", "src/server.js"]