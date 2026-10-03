# Vercel production setup

CreatorHQ is a full-stack Next.js app and can stay on Vercel. MongoDB is the single persistent source of truth for creator accounts, creator cards, verification reviews, audit logs, and proof files (GridFS). It does not need Firebase Admin credentials or a GitHub data token.

In Vercel, open **Project Settings → Environment Variables**. Add the values below to **Production** (and Preview too if you use preview deployments). Keep the same MongoDB database and session secret between deployments so accounts and sessions remain available.

| Key | Value |
| --- | --- |
| `SESSION_SECRET` | A unique random value with at least 32 characters. Never share or commit it. |
| `MONGODB_URI` | Your MongoDB Atlas connection string. Keep it secret; use a database user limited to read/write access for this app database. |
| `MONGODB_DB_NAME` | `creatorhq` (or another database name you choose). |
| `NEXT_PUBLIC_APP_URL` | `https://creatorhq.fun` (or the production domain assigned by Vercel). |
| `ADMIN_PASSCODE` | A private admin password for automatic creation of the first staff login when MongoDB has no admin account. |
| `ADMIN_USERNAME` | Optional. Defaults to `admin`. Set this before the first database connection if you want a different staff ID. |
| `ADMIN_EMAIL` | Optional. Defaults to `admin@creatorhq.fun`. Set this before the first database connection if you want a different staff email. |

Add the values directly in Vercel, never in chat or source control. In Atlas, create a database user with read/write access to the app database and allow your Vercel app to connect. Vercel deployments use dynamic IPs, so prefer the MongoDB Atlas Vercel integration or a supported static-egress configuration; only use a broad Atlas network allow list if you understand that it allows connections from any IP and protect it with a strong database password.

When the database has no admin user, the first connection creates one with username `admin`, email `admin@creatorhq.fun`, and the `ADMIN_PASSCODE` value. Existing admins are left unchanged.

MongoDB is a new source of truth. Existing records currently in Firebase or GitHub sync will not automatically appear in MongoDB; keep the old data intact until you decide whether to migrate it or start with an empty database.

If Discord or YouTube verification is enabled, also set the corresponding OAuth client IDs/secrets and update their callback URLs to the production domain. No GitHub token is required for the MongoDB-backed database.

After saving environment variables, redeploy the latest production deployment. Vercel provides HTTPS automatically; no manual certificate setup is needed. `SESSION_SECRET` is still required to sign login cookies and is separate from HTTPS.
