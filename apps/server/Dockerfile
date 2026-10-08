FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN npx turbo run build --filter=server

WORKDIR /app/apps/server
EXPOSE 4000
CMD [ "node", "dist/index.js" ]
