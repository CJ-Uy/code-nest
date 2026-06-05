# CODE Portal design

## Product shape

CODE Portal should feel like a quiet member workspace, not a marketing site. The public site can keep articles, public pages, and a low-emphasis sign-in link. After sign-in, members land on one hub that brings together the profile, private library, short links, CRS events, calendar, announcements, and admin tools.

The older `open design` folder split these into many static pages and referenced missing CSS, JavaScript, and image assets. The new direction keeps the same product scope but removes duplicate navigation and compresses the experience into a single shell with clear module tabs.

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

- One shell is easier than ten pages for members. Module tabs let users move quickly without losing context.
- Admin tools stay visible only as a module in the signed-in workspace. Super admins inherit all scoped roles, while specific admins see only the queues they can act on.
- CRS is modeled as a simple lifecycle: create, scan, archive, approve. Feedback forum access and selected surveys are treated as separate actions.
- The private library is filter-first. Graph search is presented as an advanced assist, not the default way to find content.
- Guided tours are available from the header and can be replayed for both member and admin flows.

## Interface system

The app uses Tailwind CSS v4 and shadcn-style local components. Tokens live in `src/app/globals.css`, while reusable primitives live in `src/components/ui`.

The visual direction is restrained and operational: neutral surfaces, teal primary actions, small amber and sky states, compact cards, clear tables, visible focus rings, and no decorative blobs or oversized marketing hero sections.

## Writing rules

Interface copy should be plain and specific. Avoid em dashes, curly quotes, promotional filler, title-heavy prose, needless buzzwords, and stock phrases associated with AI-generated writing. Keep labels short, use real nouns, and prefer active verbs.

## Current prototype

`src/app/page.tsx` implements the signed-in workspace with interactive module switching and basic library filtering. It is still a front-end scope prototype. Authentication, database models, QR generation, camera scanning, analytics, permissions, and graph retrieval should be built as separate implementation phases.
