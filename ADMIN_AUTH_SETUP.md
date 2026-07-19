# Administrator Authentication Setup

This project uses Supabase Auth for administrator login.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Add only these browser-safe values:
   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

4. Create an administrator user from a trusted Supabase administrative environment.

5. Set trusted user app metadata:
   ```json
   {
     "role": "admin"
   }
   ```

6. Never set the administrator role from frontend code.

7. Never expose the Supabase service-role key, database password, JWT signing secret, or private API keys in this frontend project.

8. Start the application:
   ```bash
   npm run dev
   ```

9. Test administrator login and logout at `/admin/login`.

10. After login, use `/admin/profile` to update the current admin name, email address, and password.

The Admin Profile page does not grant administrator access. The `role: "admin"` app metadata must still be set from a trusted Supabase administrative environment.

Registration database integration, payment verification, audit persistence, storage buckets, and row-level security for registration records remain pending for later backend phases.
