# CODE Portal prototype

This repo contains a Next.js prototype for the CODE Portal member workspace. The design covers the signed-in experience for member profiles, private content, short links, CRS events, calendar, announcements, and scoped admin tools.

## Design

The original static exports live in `open design/`. The current product direction is documented in `design.md` and implemented in `src/app/page.tsx`.

The UI uses Tailwind CSS v4 and shadcn-style local components in `src/components/ui`. Shared design tokens live in `src/app/globals.css`.

## Develop

Run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Edit `src/app/page.tsx` for the prototype shell and module content.

## Preview

Preview the application locally on the Cloudflare runtime:

```bash
pnpm preview
```

## Deploy

Deploy the application to Cloudflare:

```bash
pnpm run deploy
```

## Next build phases

- Add authentication and the hidden public sign-in path.
- Add data models for members, roles, resources, links, CRS events, surveys, announcements, and audits.
- Build real QR generation, camera scanning, link analytics, and permission checks.
- Split the prototype into routes once the data contracts are stable.

## Cloudflare

This project keeps the OpenNext for Cloudflare setup from the starter. See `wrangler.jsonc` and `open-next.config.ts` for deployment configuration.
