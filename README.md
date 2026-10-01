# James & Diana — Wedding Invitation

A mobile-first digital wedding invitation with RSVP approval, WhatsApp confirmation, guest allocation, QR references, and entrance check-in.

Confirmed ceremony time: **09:00–11:00 hrs** at the Catholic Cathedral of Christ the King.

## Local preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Administrator access uses approved Supabase email-and-password accounts.

## Production setup

1. Create a free Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL editor.
2. Add the first owner to `public.admin_users`, create the matching Supabase Auth user, and add the required values to `.env.local`. Never expose `SUPABASE_SECRET_KEY`.
3. In Vercel, add the same environment variables and deploy this repository.
4. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS URL, then redeploy so social cards and QR verification links use the correct origin.

Without Supabase credentials, local development uses `data/guests.local.json`. That fallback is intentionally not suitable for Vercel because serverless files are not persistent.

## Private routes

- `/admin` — password sign-in, role-based approvals, allocation, administrator access, WhatsApp confirmation and QR references
- `/check-in` — entrance verification and duplicate check-in protection
- `/verify/[reference]` — privacy-limited QR verification result

## Replacing photographs

Photographs live in `public/images`. Replace a file while keeping its filename to preserve every crop and responsive layout, or update the relevant paths in `components/invitation.tsx` and `app/opengraph-image.tsx`.
