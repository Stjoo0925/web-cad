FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY . .

ENV NODE_ENV=production

CMD ["node", "apps/server/src/api-server.js"]
