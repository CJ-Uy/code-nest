# Graph Report - .  (2026-06-18)

## Corpus Check
- 193 files · ~253,485 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1710 nodes · 1988 edges · 81 communities (52 shown, 29 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 79|Community 79]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 23 edges
2. `getAppConfig()` - 20 edges
3. `compilerOptions` - 17 edges
4. `StorageAdapter` - 14 edges
5. `User` - 13 edges
6. `StreamError` - 11 edges
7. `cn()` - 11 edges
8. `getStorageAdapter()` - 10 edges
9. `Member Portal Workspace` - 10 edges
10. `getOptionalCloudflareEnv()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Ateneo CODE` --conceptually_related_to--> `CODE Portal`  [INFERRED]
  design/index.html → README.md
- `Static Design System Export` --implements--> `CODE Brand Manual`  [INFERRED]
  design/Design System.html → design.md
- `Static Member Portal Export` --implements--> `Member Portal Workspace`  [INFERRED]
  design/Member Portal.html → design.md
- `Now Snapshot` --references--> `Drizzle ORM`  [EXTRACTED]
  .remember/now.md → docs/architecture/database.md
- `Daily Log 2026-06-17` --references--> `Graph Search (deferred)`  [EXTRACTED]
  .remember/today-2026-06-17.md → design.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Database Adapter Implementations** — database_interface, d1_database_adapter, local_sqlite_adapter, shared_api_database_adapter [EXTRACTED 1.00]
- **Storage Adapter Implementations** — storage_interface, r2_binding_storage_adapter, r2_s3_storage_adapter, local_file_storage_adapter, shared_api_storage_adapter [EXTRACTED 1.00]
- **Environment Mode Backend Selection** — environment_modes, cloudflare_bindings, shared_dev_api, adapter_pattern [INFERRED 0.75]
- **Environment Axes Govern Data Access Path** — code_portal_master_plan_deploy_env, env_vars_app_env, env_vars_storage_mode, code_portal_master_plan_get_db [EXTRACTED 0.85]
- **Shared Dev Worker Migrate + Deploy + Reseed Flow** — code_portal_master_plan_dev_worker_lifecycle, migrations_db_migrate_dev, commands_deploy_dev, secrets_and_env_token_rotation [EXTRACTED 0.85]
- **Drizzle Migration Pipeline (generate to apply per target)** — migrations_drizzle_schema, migrations_db_generate, migrations_db_migrate_local, migrations_db_migrate_dev, migrations_db_migrate_prod [EXTRACTED 0.85]

## Communities (81 total, 29 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.00
Nodes (939): AbortController, AgentMemoryGetSummaryOptions, AgentMemoryGetSummaryResponse, AgentMemoryIncomingMemory, AgentMemoryIngestOptions, AgentMemoryListMemoriesOptions, AgentMemoryListMemoriesResult, AgentMemoryMemory (+931 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (42): D1DatabaseAdapter, LocalFileStorageAdapter, LocalDatabase, LocalSqliteDatabaseAdapter, R2BindingStorageAdapter, R2S3StorageAdapter, SharedApiDatabaseAdapter, SharedApiStorageAdapter (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (33): articleAssets, adminQueue, events, links, ModuleId, modules, resources, views (+25 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (8): Contact(), Landing(), Article(), ProductCenter(), Projects(), Services(), Ic, useReveal()

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): Scoped Admin Roles, Agent Notes, Announcements, Ateneo CODE, Shared Calendar, Cloudflare Runtime, CODE Brand Manual, CODE Portal (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (28): Adapter Pattern, Adapters Architecture, Database Architecture, Architecture Overview, Security Architecture, Storage Architecture, Auth.js v5, Cloudflare Bindings Isolation (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (5): CONF_META, LibDetail(), KIND_META, libItem(), NL_SUGGESTIONS

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (23): scripts, build, cf-typegen, cf-typegen:dev, cf-typegen:prod, clean:opennext, db:generate, db:migrate:dev (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (8): CreateLink(), LINK_RESERVED, linkAnalytics(), LINKS, LinkDetail(), LinkCard(), shortUrl(), slugStatus()

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (3): RET_KIND, Row(), IOSKeyboard()

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (18): BUCKET Binding, code-nest-prod-db (D1 Production), DB Binding, code-nest-dev-uploads (R2 Shared/Dev), code-nest-prod-uploads (R2 Production), Dev/Prod Resource Isolation Safety, D1 FK Choreography (defer_foreign_keys), users to members Reconciliation (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (15): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, better-sqlite3, class-variance-authority, clsx, drizzle-orm, lucide-react (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (14): code-nest-dev-db (D1 Shared/Dev), Command Reference, deploy:prod Command, pnpm dev (Local Next dev), pnpm dev:cf (Cloudflare preview dev), upload:prod Command, Wrangler CLI, LOCAL_SQLITE_PATH (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (13): devDependencies, drizzle-kit, eslint, eslint-config-next, @eslint/eslintrc, tailwindcss, @tailwindcss/postcss, @types/better-sqlite3 (+5 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (12): CloseEvent, CustomEvent, EmailEvent, ErrorEvent, Event, ExtendableEvent, FetchEvent, MessageEvent (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (11): audit_logs Table, D1 Query Budget, getDb() Driver Selector, Repository Layer (src/db/repositories), Survey True Anonymity (token-hash only), db:generate Command, db:migrate:local Command, Drizzle Schema (src/db/schema.ts) (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (11): AlreadyUploadedError, BadRequestError, ForbiddenError, InternalError, InvalidURLError, MaxFileSizeError, NotFoundError, QuotaReachedError (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (10): assertSameOrigin CSRF Guard, Shared Dev Worker Lifecycle & Redeploy Obligations, getRepositories(), Shared-Dev Internal API Contract, Per-Domain Typed Internal Modules (not one dispatcher), deploy:dev Command, .env.local, Shared Dev Token Rotation (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.27
Nodes (7): DesktopShell(), MobileShell(), NAV_FOOT, NAV_PRIMARY, NAV_SECONDARY, NotifPanel(), unreadCount()

### Community 24 - "Community 24"
Cohesion: 0.22
Nodes (9): CODE Portal Master Design & Build Plan, Token to Seeded Actor Model, Auth.js v5 + Drizzle Adapter, getActor() Unified Actor Accessor, members Table (Auth.js user), permissions.can() RBAC, Phased Build Sequence (Phase 0-10), shared_dev_tokens Table (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (4): HIGHLIGHTS, RATING_ROWS, RETURN_OPTS, SURVEY_STEPS

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (7): ADMIN_ME, ADMIN_MEMBERS, ADMIN_METRICS, AUDIT_CATS, AUDIT_LOG, PENDING_EVENTS, ROLE_DEFS

### Community 28 - "Community 28"
Cohesion: 0.25
Nodes (7): ARTICLE_CATS, ARTICLES, COMPETENCIES, CONTACTS, ORG, PROJECTS, SERVICES

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): AbortSignal, EventSource, EventTarget, MessagePort, ServiceWorkerGlobalScope, WebSocket, WorkerGlobalScope

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (7): CompressionStream, DecompressionStream, FixedLengthStream, IdentityTransformStream, TextDecoderStream, TextEncoderStream, TransformStream

### Community 34 - "Community 34"
Cohesion: 0.38
Nodes (3): sampleSize(), SurveyConfig(), zForConfidence()

### Community 35 - "Community 35"
Cohesion: 0.33
Nodes (3): App(), NAV, useRoute()

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): ANNOUNCEMENTS, EVENTS, LIBRARY_ACTIVITY, ME, NOTIFS, RETENTION

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): EVENT_MEDIA, EVENTS_FULL, FORUM, LEADERBOARD, LIVE_CHECKINS, RETENTION_FULL

### Community 40 - "Community 40"
Cohesion: 0.53
Nodes (6): Two Orthogonal Environment Axes, APP_ENV, SHARED_API_BASE_URL, SHARED_API_TOKEN, APP_ENV Modes (local/shared/production), Shared Dev Onboarding

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (6): Upload Hardening (server-assigned keys), ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE, R2 S3 Credentials (R2_*), STORAGE_MODE, STORAGE_MODE Modes (local/api/r2-s3/binding), Production Storage Adapter (r2-binding)

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): FAVORITES, LIB_COMMENTS, LIB_TOPICS, LIBRARY, LISTS

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): ANNOUNCEMENTS_FULL, CAL_EVENTS, CAL_MONTH, MEMBERS, MY_PROFILE

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (3): metadata, sourceSans, unna

### Community 47 - "Community 47"
Cohesion: 0.40
Nodes (5): code-nest Project Slug / Worker, wrangler.jsonc, DEPLOY_ENV Axis (prod/dev), cf-typegen:dev Command, Missing Binding Errors

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (5): Drizzle ORM and Drizzle Kit, Next.js App Router, @opennextjs/cloudflare, CODE Nest Setup Overview, Zod Environment Validation

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (3): __BaseEnv_CloudflareEnv, CloudflareEnv, Env

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (3): BasicImageTransformations, RequestInitCfPropertiesImage, RequestInitCfPropertiesImageDraw

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (3): Body, Request, Response

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (3): ByteLengthQueuingStrategy, CountQueuingStrategy, QueuingStrategy

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (3): link_daily_stats Rollup, runInBackground() (ctx.waitUntil wrapper), /l/[slug] Short-Link Redirect

## Knowledge Gaps
- **1147 isolated node(s):** `GlobalProps`, `DevEnv`, `DOMException`, `WorkerGlobalScopeEventMap`, `Console` (+1142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Cloudflare Runtime` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getAppConfig()` (e.g. with `.request()` and `.request()`) actually correct?**
  _`getAppConfig()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `GlobalProps`, `DevEnv`, `DOMException` to the rest of the system?**
  _1156 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.002127659574468085 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06092384519350812 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06502732240437159 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06881720430107527 - nodes in this community are weakly interconnected._