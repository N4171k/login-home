# Login + Home (Node.js + JWT + MySQL)

This project contains two pages:
- Login page: `/`
- Home page: `/home` (protected by JWT)

## 1. Install dependencies

```bash
npm install
```

## 2. Create and configure database

1. Create a MySQL database, for example:

```sql
CREATE DATABASE defaultdb;
```

2. Run the schema from `db/schema.sql` inside that database.

## 3. Configure environment variables

Copy `.env.example` to `.env`.

- `JWT_SECRET` is required.
- `DB_URI` is already prefilled for your Aiven MySQL service.
- You can also use `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` with `DB_SSL=true`.

## 4. Start server

```bash
npm run dev
```

or

```bash
npm start
```

Server runs at: `http://localhost:4000`

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)
