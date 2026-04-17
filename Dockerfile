FROM node:24-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production

CMD ["node", "apps/server/src/api-server.js"]
