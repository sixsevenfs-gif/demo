# DWA Lead Command Center

## Production setup

1. Copy `.env.example` to `.env` and set your MongoDB Atlas `DATABASE_URL`, a random `SESSION_SECRET`, and the one-time initial administrator values.
2. Create the MongoDB collections and indexes with `npx prisma db push`.
3. Create the first administrator once with `npm run bootstrap-admin`.
4. Remove the three `INITIAL_ADMIN_*` values from the deployed environment, then start the app with `npm run build && npm start`.

The repository contains no seeded users, leads, calls, settings, or sample-import data. Users must sign in with their own provisioned account; sessions are signed, HTTP-only cookies and expire after eight hours.
