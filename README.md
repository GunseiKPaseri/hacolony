# hacolony

[![codecov](https://codecov.io/gh/GunseiKPaseri/hacolony/graph/badge.svg?token=XT8GJ3IN97)](https://codecov.io/gh/GunseiKPaseri/hacolony)

A private, single-user social networking application that lets you create and interact with multiple avatar personas.

## Overview

hacolony is a personal digital garden where you can create multiple avatars (personas) that can interact with each other through posts, replies, quotes, and follows. This creates a private space for exploring different aspects of your thoughts and interests through distinct personas.

## Getting Started

1. Clone the repository

   ```
   git clone https://github.com/GunseiKPaseri/hacolony.git
   cd hacolony
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Set up the database

   ```
   make migrate
   ```

   or

   ```
   make syncdb
   ```

4. Start the development server

   ```
   make dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/app`: Next.js App Router files

  - `page.tsx`: Main landing page
  - `login/` & `logout/` & `register/`: Authentication pages
  - `api/`: Backend APIs
  - `timeline/`: Main SNS interface
  - `profile/`: Avatar profile
  - `avatars/create/`: Avatar creation page
  - `avatars/[id]/`: Avatar detail page
  - `settings/`: User settings

- `src/components`: Reusable UI components
- `domain/`: Domain logic and services
  - `avatar/`: Avatar-related logic
  - `botConfig/`: Bot configuration logic
  - `botTaskQueue/`: Bot task queue logic
  - `follow/`: Follow-related logic
  - `llmTaskQueue/`: LLM task queue logic
  - `post/`: Post-related logic
  - `postQueue/`: Post queue logic
  - `user/`: User-related logic
- `infrastructure/`: Background Infrastructure code
  - `client/`: API Client
  - `prisma/`: Prisma database client
    - `schema.prisma`: Data model definitions
    - `migrations/`: Database migrations
  - `repository/`: Data repositories
  - `worker/`: Background worker logic
- `lib/`: Frontend Utility libraries
- `server/`: Background di type
- `stores/`: client-side state management
- `types/`: TypeScript type definitions
- `utils/`: Background utility functions

## Development

- Run development server: `make dev`
- Lint code: `make lint`

## License

[MIT License](LICENSE)
