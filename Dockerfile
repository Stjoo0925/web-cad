FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Copy package files only (no node_modules — install inside container)
COPY package.json package-lock.json* ./

# Install dependencies inside container (Linux binaries)
RUN npm ci --omit=dev

# Copy source code
COPY . .

ENV NODE_ENV=production

CMD ["node", "apps/server/src/api-server.js"]
