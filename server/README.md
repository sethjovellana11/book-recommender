# Book Recommender API

This Express server backs the front-end in the repository by serving book data from MongoDB.

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or hosted)

## Quick start

1. Copy `.env.example` to `.env` and update the values, especially `MONGODB_URI`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Seed the database with the sample catalogue:

   ```bash
   npm run seed
   ```

4. Start the API:

   ```bash
   npm run dev
   ```

   The server defaults to `http://localhost:4000`.

## Serving the front-end (optional)

If you want Express to host the static client, set `SERVE_CLIENT=true` in `.env` and point `CLIENT_DIR` to the directory containing `index.html` (for example, `../`).

## Endpoints

- `GET /api/books` – returns all books. Optional query parameters:
  - `genres` – comma-separated list, requires all listed genres.
  - `popularity` – one of `blockbuster`, `critical`, `hidden`.
  - `era` – one of `classic`, `modern`, `contemporary`.
  - `search` – full-text search across title, author, and genres.
- `POST /api/books` – create a book document (primarily for admin tooling/testing).

## Front-end integration

The client fetches data from `http://localhost:4000/api/books` by default. To point it elsewhere, define `window.BOOK_API_BASE_URL` in a script tag before `script.js` loads or run the static files through the Express server with `SERVE_CLIENT=true`.
