# Quickstart Guide

Get the TinyURL Link Shortener up and running in minutes.

## Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: v9 or higher
- **Docker**: Desktop or Engine

## Option 1: Docker (Fastest)

Run the entire stack in one command:

```bash
docker-compose up -d
```

### Services
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **API Server**: [http://localhost:4000](http://localhost:4000)

## Option 2: Local Development

1.  **Start Infrastructure**:
    ```bash
    docker-compose up -d db redis
    ```

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Setup Environment**:
    Each service has a `.env.example`. Copy them to `.env`:
    ```bash
    cp apps/server/.env.example apps/server/.env
    cp apps/web/.env.example apps/web/.env
    ```

4.  **Build & Run**:
    ```bash
    pnpm build
    pnpm dev
    ```

## Development Commands

- `pnpm dev`: Start all apps in watch mode
- `pnpm build`: Build all apps and packages
- `pnpm lint`: Run linting across the monorepo
- `pnpm format`: Format code using Prettier
- `pnpm typecheck`: Run TypeScript type checking
