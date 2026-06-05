# CODE Portal prototype

This repo contains a Next.js prototype for CODE. The public site lives at `/`, public articles live under `/articles`, and the member portal demo lives at `/portal`.

## Design

The original static exports live in `open design/`. The current product direction is documented in `design.md`.

Route map:

- `/`: public publishing home
- `/articles`: public article index
- `/articles/[slug]`: public article detail
- `/portal`: member workspace demo

The UI uses Tailwind CSS v4 and shadcn-style local components in `src/components/ui`. Shared design tokens live in `src/app/globals.css`.

The current UI follows the supplied CODE brand manual:

- Headings use Unna and body text uses Source Sans.
- Brand tokens use navy `#06192F`, white `#FFFFFF`, blue `#0C315C`, light blue `#D7DFE9`, dark gray `#121315`, and pale blue `#90B4CC`.
- Official logo and cover assets copied from the manual live in `public`.

## Develop

Run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Edit `src/app/page.tsx` for the public site and `src/components/portal-workspace.tsx` for the member workspace.

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
