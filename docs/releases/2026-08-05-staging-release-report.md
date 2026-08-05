# Staging Release Report: Beta Promotion

Date: 2026-08-05  
Environment: staging  
Decision: **Interrupted. Keep production unchanged.**

The release candidate was migrated and deployed successfully to staging. Lightweight live health checks passed. The signed-in desktop, iPhone, and Android acceptance journeys remain pending because launching the local Playwright browser repeatedly caused a Windows blue screen in the NVIDIA display driver. No browser was launched during deployment verification.

## What this update adds

- **Better short links:** Members can find, organize, and manage shared short links more easily, view richer traffic trends, and create branded QR codes.
- **Improved member profiles:** Members get a clearer profile view and edit flow, better feedback when saving, birthday visibility controls, and a breakdown of earned points.
- **Stronger event calendar:** Events can span multiple days, use clear category colors, support all-day and read-only states, and be shared more easily.
- **Flexible event registration:** Organizers can collect event-specific signup information and control who may view responses.
- **Faster attendance:** Event teams get a mobile camera scanner with torch support, duplicate warnings, late-arrival tracking, and safe scan reversal.
- **Flexible points:** Event admins can assign one or more point types to an event while preserving historical awards.
- **Clear Events & Points administration:** Admins get focused dashboards for events, members, scans, point records, configuration, and exports.
- **Simpler member administration:** Search, bulk invitations, and role management are easier to use while preserving access controls.
- **Useful admin controls:** Authorized admins can manage pinned navigation, dashboard shortcuts, and review an audit log of important actions.

## Planned future features

- Member retention progress and history.
- Private content library.
- Organization announcements.
- Member notification center.
- General survey tools.
- New public Ateneo CODE website.

## Intentionally unchanged

- The production short-link service remains the priority. No production link or analytics record was changed.
- The staging base URL continues redirecting to the current Google Sites landing page.
- Deferred features remain inaccessible by direct URL.

## Release gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| Local migration preservation check | Pass | Preserved two synthetic links and three daily-stat rows, including exact destinations. |
| Lint | Pass with existing warnings | Zero errors and 151 warnings. |
| Type checking | Pass | Completed with exit code 0. |
| Unit and integration tests | Pass | 438 tests passed. |
| Event points authority | Pass | Focused permissions and event repository checks passed. |
| OpenNext build | Pass | Worker build completed with local placeholder auth values only. |
| Staging D1 migration | Pass | All five migrations applied once; no migrations remain pending. |
| Staging Worker deployment | Pass | Worker version `bce2f369-1375-45f8-81ab-92a8abe4e39b` deployed. |
| Live unauthenticated HTTP health checks | Pass | Root, auth, portal redirect, disabled routes, and disabled APIs returned expected results. |
| Desktop signed-in acceptance | Pending | Local browser launch is unsafe on this laptop. |
| iPhone signed-in acceptance | Pending | Local browser launch is unsafe on this laptop. |
| Android signed-in acceptance | Pending | Local browser launch is unsafe on this laptop. |

## Live staging health checks

Base URL: `https://staged.ateneocode.org`

| Request | Observed result |
| --- | --- |
| `GET /` | `307` to `https://sites.google.com/view/ateneo-code/landing` |
| `GET /api/auth/signin` | `200` |
| `GET /portal` | `307` to `/signin` |
| `GET /contact` | `404` |
| `GET /product` | `404` |
| `GET /projects` | `404` |
| `GET /services` | `404` |
| `GET /portal/events` | `404` |
| `GET /portal/library` | `404` |
| `GET /portal/announcements` | `404` |
| `GET /portal/notifications` | `404` |
| `POST /api/surveys/submit` | `404` |
| `POST /api/contact` | `404` |
| `POST /api/articles/missing/feedback` | `404` |

All six staging feature flags were deployed as `false`.

## Short-link and notification evidence

- The staged D1 database was a clean target containing only system tables before migration.
- Short-link count before migration: `0`.
- Daily-stat count before migration: `0`.
- Short-link count after migration and deployment: `0`.
- Daily-stat count after migration and deployment: `0`.
- Notification count after deployment: `0`.
- No synthetic staging records were created, so no cleanup was required.
- Live link creation, editing, QR export, analytics, permissions, and deletion remain pending signed-in browser acceptance.

## Pending signed-in acceptance

These checks must run from CI or another stable machine before a production promotion decision:

1. Short-link creation, editing, exact redirect, analytics, QR export, ownership, moderation, and cleanup on desktop, iPhone, and Android.
2. Profile editing, validation, persistence, birthday visibility, and point breakdown.
3. Full Events & Points journey, including registration questions, approval, RSVP, multiple point types, scan, duplicate handling, lateness, audit/export checks, reversal, and point removal.
4. Member search, synthetic bulk invite, role boundaries, pinned navigation, dashboard shortcuts, and Activity Log.
5. Signed-in navigation checks for all deferred modules and notification-count comparison around event activity.

## Technical appendix

- Release branch: `release/2026-08-05-staging`
- Source merge commit: `9b4e61d66288dd129fe0e7fcfb6a12e0fa487644`
- Previous Worker version: `42c362ff-fa67-4e59-acd9-542859a3ca02`
- Deployed Worker version: `bce2f369-1375-45f8-81ab-92a8abe4e39b`
- Workers URL: `https://code-nest-staged.cj-uy.workers.dev`
- Custom domain: `https://staged.ateneocode.org`
- Staged D1 recovery bookmark: `0000004d-00000000-000050be-b95a09e25828e0ce25ab14c1ef12c3b7`
- Migration history:
  - `0000_young_bullseye.sql`
  - `0001_member_portal_links.sql`
  - `0002_link_workspace_fields.sql`
  - `0003_admin_members_nav.sql`
  - `0004_beta_release_bridge.sql`
- Required release tables verified: `event_invites`, `event_point_awards`, `event_staff`, `event_type_rules`, `link_hourly_stats`, `point_types`, and `quick_links`.
- Rollback: not used.
- Browser interruption: Windows bugcheck `0x0000010e`, bucket `0x10e_2d_nvlddmkm!LDDM_MapCpuHostAperture`, associated with the NVIDIA display driver.
- Browser artifacts: none, because the unsafe browser gate was not rerun.
- Production mutation or deployment: **none**.

## Recommendation

Keep the current staging deployment available for manual or CI acceptance. Do not promote to production until every pending signed-in journey passes on a stable browser runner.
