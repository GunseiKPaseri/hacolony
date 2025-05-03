# hacolony

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
   npx prisma migrate dev
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/app`: Next.js App Router files
  - `page.tsx`: Main landing page
  - `login/` & `register/`: Authentication pages
  - `timeline/`: Main SNS interface
  - `profile/`: User profile
  - `avatars/create/`: Avatar creation page
  - `api/`: Backend APIs

- `src/components`: Reusable UI components
- `prisma/`: Database related files
  - `schema.prisma`: Data model definitions
  - `migrations/`: Database migrations

## Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`

## License

[MIT License](LICENSE)