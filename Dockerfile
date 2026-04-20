FROM node:24-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies (workspace packages)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Install tsx for TypeScript execution
RUN npm install -g tsx

ENV NODE_ENV=production

# No CMD — docker-compose command overrides each service
