# Login + Home (Node.js + JWT + MySQL + React Native)

This project now has:
- Backend API (Node.js + JWT + MySQL)
- React Native mobile app (Expo)

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

## 4. Start backend server

```bash
npm run dev
```

or

```bash
npm start
```

Server runs at: `http://localhost:4000`

## 5. Run React Native app

The mobile app is inside the `mobile` folder.

```bash
cd mobile
npm install
npm start
```

Open in Expo Go or an emulator/simulator.

Base URL notes from `mobile/src/config.js`:
- Android emulator: `http://10.0.2.2:4000`
- iOS simulator: `http://localhost:4000`
- Physical device: replace with your computer LAN IP and same port

Example for physical device:
`http://192.168.1.50:4000`

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token required)
