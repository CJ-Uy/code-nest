# CODE Portal design

## Product shape

CODE should open as a public publishing site, not as the member portal. The public site keeps articles, public resources, event notices, and non-confidential updates on `/`. A low-emphasis member access link points to `/portal`, where the signed-in member demo lives.

The older `open design` folder split the member area into many static pages and referenced missing CSS, JavaScript, and image assets. The current direction keeps the same member scope but separates the public site from the member workspace.

## Public routes

- `/`: public landing, featured writing, public library preview, public updates, and low-emphasis member access.
- `/articles`: public publishing index.
- `/articles/[slug]`: public article detail pages.
- `/portal`: member workspace demo. Authentication is not wired yet.

## Main modules

- Overview: member status, retention progress, survey requests, saved content, short link activity, and quick actions.
- Profile: member details include full name, nickname, pronouns, roles, retention points, and guided tour status.
- Private library: confidential case studies, public-plus resources, tools, comments, favorites, saved lists, filters, and a future graph search path.
- Short links: official slugs, destination URLs, ownership, shared statistics, admin moderation, QR export, logo placement, light mode, dark mode, and transparent export.
- CRS: event creation, QR attendance, archive proof, forum discussion, random survey selection, approval, point assignment, and audit history.
- Calendar: shared month and agenda views for official events, casual events, birthdays, CRS deadlines, and announcements.
- Announcements: targeted notices with pinning, scheduling, and admin publishing controls.
- Admin: role assignment, scoped permissions, super admin inheritance, CRS approvals, link moderation, publishing queues, and audit logs.

## UX decisions

- The home route should serve readers first. Members can enter the portal through a quiet access link.
- One portal shell is easier than ten member pages. Module tabs let users move quickly without losing context.
- Admin tools stay visible only as a module in the signed-in workspace. Super admins inherit all scoped roles, while specific admins see only the queues they can act on.
- CRS is modeled as a simple lifecycle: create, scan, archive, approve. Feedback forum access and selected surveys are treated as separate actions.
- The private library is filter-first. Graph search is presented as an advanced assist, not the default way to find content.
- Guided tours are available from the header and can be replayed for both member and admin flows.

## Interface system

The app uses Tailwind CSS v4 and shadcn-style local components. Tokens live in `src/app/globals.css`, while reusable primitives live in `src/components/ui`.

The visual direction follows the supplied CODE brand assets. Main colors are navy `#061B30` and `#0A182E`, blue `#0C315D`, light blue `#D8DFE9`, dark gray `#121315`, white gray `#F5F5F6`, and mid grays from the logo exports.

## Writing rules

Interface copy should be plain and specific. Avoid em dashes, curly quotes, promotional filler, title-heavy prose, needless buzzwords, and stock phrases associated with AI-generated writing. Keep labels short, use real nouns, and prefer active verbs.

## Current prototype

`src/app/page.tsx` implements the public site. `src/components/portal-workspace.tsx` implements the signed-in workspace with interactive module switching and basic library filtering. Authentication, database-backed content, QR generation, camera scanning, analytics, permissions, and graph retrieval should be built as separate implementation phases.
