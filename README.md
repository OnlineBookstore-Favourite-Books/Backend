# Favourite Books Backend

Express + MySQL backend for the Favourite Books project.

## 1) Prerequisites

- Node.js 18+
- MySQL 8+

## 2) Install dependencies

```bash
npm install
```

## 3) Configure environment

Create `.env` from `.env.example`.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=favourite_books_db
```

## 4) One-command database setup

Run this from the `Backend` folder:

```bash
npm run db:setup
```

This command automatically applies:

- `database/schema.sql`
- `database/seed.sql`

using values from your `.env` file.

Manual fallback (MySQL shell / Workbench):

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

## 5) Start backend

```bash
npm run start
```

For development with auto-reload:

```bash
npm run dev
```

## Docker deployment (backend + MySQL)

From the `Backend` folder (where `docker-compose.yml` is located):

```bash
docker compose up --build
```

This starts only the backend container on host port `5000`.

This starts:

- `mysql` as an internal service for the backend (no host port exposed)
- `backend` on host port `5001`

MySQL is initialized automatically on first run from:

- `database/schema.sql`
- `database/seed.sql`

Stop containers:

```bash
docker compose down
```

Stop and remove volumes (fresh DB reset):

```bash
docker compose down -v
```

## Seed login users

- Manager: `manager@favbooks.com` / `manager123`
- Staff: `staff@favbooks.com` / `staff123`
- Customer: `customer@favbooks.com` / `customer123`

## Database files

- `database/schema.sql`: table definitions, constraints, indexes.
- `database/seed.sql`: sample users and books.
