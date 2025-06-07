# CLAUDE.md

必ず日本語で回答してください。
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start Next.js development server with Turbopack
- `npm run start:with-scheduler` - Start Next.js server with background workers enabled
- `npm run build` - Build production application
- `npm run lint` - Run ESLint, validate Prisma schema, and format schema

### Database Operations

- `make migrate` - Run Prisma migrations with custom schema path
- `make generate` - Generate Prisma client
- `make syncdb` - Push schema changes to database
- `make studio` - Open Prisma Studio for database management
- Schema location: `./src/server/prisma/schema.prisma`

### Makefile Commands

- `make dev` - Alias for npm run dev
- `make lint` - Alias for npm run lint
- `make .env` - Generate environment file using tools/create-env.sh

## Architecture Overview

### Dependency Injection System

This project uses TSyringe for dependency injection. The DI container is configured in:

- `src/server/di.ts` - Main DI container setup and service registration
- `src/server/di.type.ts` - DI symbols and type definitions
- `src/instrumentation.ts` - Next.js instrumentation that initializes DI

All repositories, services, and workers are registered as singletons in the DI container.

### Service Layer Architecture

The application follows a layered architecture:

1. **API Routes** (`src/app/api/`) - Next.js API endpoints
2. **Services** (`src/server/services/`) - Business logic layer
3. **Repositories** (`src/server/repository/`) - Data access layer
4. **Workers** (`src/server/worker/`) - Background task processing

### Background Task System

The application includes a sophisticated background task processing system:

- `Scheduler` - Orchestrates all background workers with different intervals
- `BotTaskWorker` - Processes bot automation tasks (every 5 seconds)
- `LlmTaskWorker` - Handles LLM API calls (every 2 minutes)
- `PostQueueWorker` - Processes scheduled posts (every 5 seconds)

Tasks are stored in database queues (`BotTaskQueue`, `LlmTaskQueue`, `PostQueue`) with states: PENDING, PROCESSING, COMPLETED, FAILED.

### AI Integration

- Uses Ollama for local LLM inference via `OllamaClient`
- Avatars can have `BotConfig` with custom prompts
- LLM tasks are queued and processed asynchronously

### Data Model

Key entities:

- `User` - Application users with self-avatar relationship
- `Avatar` - Personas that can post, follow, and be automated
- `Post` - Content with reply/quote relationships
- `Follow` - Avatar-to-avatar following relationships
- Queue models for background task processing

### Frontend State Management

- Uses Jotai for state management
- TanStack Query integration for server state
- Stores located in `src/stores/`

### Authentication

- NextAuth.js with Prisma adapter
- Custom registration and login flows
- Session-based authentication

## Key Patterns

### Service Injection

```typescript
// Use DI symbols from di.type.ts
@inject(DI.ServiceName) private readonly service: ServiceType
```

### Repository Pattern

All data access goes through repository interfaces, allowing for easy testing and switching implementations.

### Worker Pattern

Background workers implement a consistent interface for processing queued tasks with error handling and status tracking.

### Avatar-Centric Design

The application is built around avatars as the primary interaction entities, not users directly.

## Code style

- Follow TypeScript best practices
- Use ESLint and Prettier for formatting
