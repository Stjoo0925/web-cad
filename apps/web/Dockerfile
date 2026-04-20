FROM node:24-alpine

WORKDIR /app

# Copy source code
COPY . .

# Install dependencies in apps/web (native modules must be installed in container)
WORKDIR /app/apps/web
RUN npm install

# Symlink apps/web to /app for vite (vite needs index.html in cwd)
RUN ln -s /app/apps/web /app/webapp

WORKDIR /app/webapp

EXPOSE 3010

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "3010"]