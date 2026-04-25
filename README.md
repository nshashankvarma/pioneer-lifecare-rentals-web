# Pioneer Lifecare — Web

Browser version of the Pioneer Lifecare rental management app. Same Supabase backend as the mobile app (`medical-rental-app/`); responsive layout works on phones and desktops.

Built with Vite + React 19 + TypeScript + MUI v6.

## What's included vs the mobile app

| Feature | Mobile | Web |
| --- | --- | --- |
| Auth (Supabase) | ✓ | ✓ |
| Active rentals dashboard with equipment bubbles | ✓ | ✓ |
| New rental (with hospital dropdown + custom entry) | ✓ | ✓ |
| Rental detail + close-rental dialog | ✓ | ✓ |
| Reports (per-month days, equipment + hospital filters) | ✓ | ✓ |
| Manage Equipment | ✓ | ✓ |
| Manage Hospitals | ✓ | ✓ |
| Manage Users (creates accounts via edge function) | ✓ | ✓ |
| Push notifications | ✓ | ✗ (browsers don't get Expo push tokens) |

## Setup

```bash
cd medical-rental-web
npm install
cp .env.local.example .env   # then fill in Supabase URL + anon key
npm run dev                  # http://localhost:5173
```

## Deploy

### Vercel (recommended)

1. Push this folder to a GitHub repo.
2. Import the repo into Vercel.
3. Set environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. `vercel.json` already configures the SPA rewrite so deep links work.

### GitHub Pages

Add a deploy workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

If the GitHub Pages site is served from a non-root path (e.g. `/medical-rental-web/`), set `base: '/medical-rental-web/'` in `vite.config.ts` and switch to `HashRouter` (Pages doesn't support SPA URL rewrites).

## Conventions

- All Supabase access goes through `src/lib/supabase.ts`.
- Routes live in `src/App.tsx`; admin routes are guarded by `AdminGuard`.
- Per-equipment accent colors come from `src/theme/index.ts → accentFor(name)`, mirroring the mobile app so the same equipment always gets the same color in both apps.
- `.env.local` is gitignored; configure deployment env vars on the host (Vercel project / GitHub Actions secrets).
# pioneer-lifecare-rentals-web
