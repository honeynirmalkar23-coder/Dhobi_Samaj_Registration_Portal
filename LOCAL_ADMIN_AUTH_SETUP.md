# Local Administrator Authentication Setup

Local administrator authentication is only for development and UI testing. It must not be used as the production authentication system.

## 1. Install Dependencies

```bash
npm install
```

## 2. Generate Password Hash

```bash
npm run admin:generate-password-hash
```

The script prompts for the password, asks for confirmation, requires at least 10 characters, and prints only the bcrypt hash.

## 3. Generate Session Secret

```bash
openssl rand -hex 32
```

This produces a 64-character hexadecimal value. Keep it private and never expose it through browser environment variables.

## 4. Create `.env.local`

```env
VITE_ADMIN_AUTH_MODE=local-dev
DEV_ADMIN_NAME=YOUR_ADMIN_NAME
DEV_ADMIN_EMAIL=YOUR_ADMIN_EMAIL
DEV_ADMIN_PASSWORD_HASH=GENERATED_BCRYPT_HASH
DEV_ADMIN_SESSION_SECRET=GENERATED_RANDOM_SECRET
DEV_ADMIN_SESSION_TTL_MINUTES=480
DEV_ADMIN_ALLOW_LAN=false
```

`DEV_ADMIN_NAME`, `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD_HASH`, and `DEV_ADMIN_SESSION_SECRET` are read only by the Vite development server.

## 5. Start One Vite Server

```bash
npm run dev -- --port 5173 --strictPort
```

## 6. Open Login Page

```text
http://localhost:5173/admin/login
```

## 7. Stop Server

```text
Ctrl + C
```

## Notes

- Local administrator authentication works only during Vite development serve.
- The Admin Profile page can update local credentials for the currently running Vite server session. Update `.env.local` to keep those changes after a restart.
- Production builds and preview mode fall back to Supabase authentication behavior.
- The signed session is stored in an HttpOnly cookie named `dhobi_dev_admin_session`.
- Use hosted Supabase or another secure backend to test real registration, payment, status, dashboard data, approvals, and audit persistence.



Current local admin setup:

- Email: `admin@test.com`
- Password: cannot be recovered because only `DEV_ADMIN_PASSWORD_HASH` is stored.
- Auth mode: `local-dev`

To reset/setup admin credentials, run:

```bash
npm run admin:generate-password-hash
openssl rand -hex 32
nano .env.local
```

Set `.env.local` like this:

```env
VITE_ADMIN_AUTH_MODE=local-dev
DEV_ADMIN_NAME=Portal Admin
DEV_ADMIN_EMAIL=admin@test.com
DEV_ADMIN_PASSWORD_HASH=PASTE_GENERATED_HASH_HERE
DEV_ADMIN_SESSION_SECRET=PASTE_OPENSSL_SECRET_HERE
DEV_ADMIN_SESSION_TTL_MINUTES=480
DEV_ADMIN_ALLOW_LAN=false
```

Then restart the dev server:

```bash
npm run dev -- --port 5173 --strictPort
```

Login page: `http://localhost:5173/admin/login`