FROM node:20

WORKDIR /app

# Build stage: install full deps in /app and run medusa build
COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

RUN NODE_OPTIONS=--max-old-space-size=3072 npm run build

# Runtime lives in the self-contained build output, which has its OWN package.json.
# Install its dependencies here so migration discovery + module resolution work.
WORKDIR /app/.medusa/server
RUN npm install --no-audit --no-fund

ENV NODE_ENV=production

EXPOSE 9000

# Run DB migrations, then start — both from inside .medusa/server (cwd matters).
# PGOPTIONS bounds lock/statement waits so a blocked migration fails loud instead of
# hanging forever; `timeout` is a final wall-clock safety net for any other stall.
# `&&` fails fast if a schema migration errors (never start on a bad schema);
# `exec` hands signals directly to the Medusa server for clean shutdowns.
CMD ["sh", "-c", "PGOPTIONS='-c lock_timeout=30000 -c statement_timeout=180000' timeout 300 npx medusa db:migrate && exec npx medusa start"]
