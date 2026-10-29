# Security upgrade implementation

Review date: 2026-10-29. Implements the first ten tasks from the dependency assessment. Deployment remains outstanding; no production rollout has been performed.

## Changes

1. Public password and OTP account creation disabled. The default role is unprivileged. Invitation acceptance now locks the pending token and creates the verified user, password credential, and accepted invitation in one MySQL transaction. The old public token-consumption endpoint returns 410. Existing password/OTP login remains available for provisioned users.
2. All Dockerfiles pin Node 24.22.1 Alpine and its verified multi-platform digest. Final images enforce the runtime baseline and omit unused npm/Corepack/Yarn trees (the first container scan found vulnerabilities in npm's bundled dependencies).
3. Next.js and shared ESLint config upgraded to 16.4.3; Sharp to 0.35.5.
4. Better Auth upgraded to 1.7.14, with real handler and MySQL-backed login tests.
5. Drizzle ORM/Kit and mysql2 upgraded. Removed unpinned mysql2 installation from final images; standalone tracing provides application dependencies.
6. Nodemailer upgraded to 10.3.1. Replaced nodemailer-mailgun-transport with mailgun.js 14.1.0; SMTP fallback remains. Tests cover payloads, failure propagation, and fallback.
7. AWS SDK and PostHog packages upgraded; vulnerable compatible transitive versions pinned through scoped overrides.
8. Tiptap upgraded to 3.32.1 with tiptap-markdown 0.9.0. Disabled the new duplicate link/trailing-paragraph behavior to preserve existing editing semantics. Verified markdown round trips, highlights/admonitions/links and pasted HTML filtering.
9. Vitest 5/Vite 8 stack, Turbo 2.11.10 and pnpm 10.34.9 adopted. Next apps no longer inherit declaration emit settings from library TS configs. New React set-state-in-effect lint findings in existing admin UI are warnings pending a separate UI refactor; other rules remain enforced.
10. Added Dependabot for npm, Docker and GitHub Actions; scheduled audits/scans; reusable validation workflow; production image Node checks and high/critical scans before publishing. Build tools and PostHog CLI are pinned. Excluded the 5 GB local pnpm store from Docker context.

## Validation

- Workspace typecheck and lint pass (existing/new compiler lint warnings remain visible).
- 99 tests pass: admin 61, types 11, UI 27. Admin includes four tests against an isolated MySQL database covering acceptance, replay, concurrent acceptance, expired tokens, rollback, and login using the created credential.
- Both production Dockerfiles build locally with frozen lockfiles for ARM64 and AMD64.
- The built admin container responds to its health endpoint and rejects a direct uninvited password signup with HTTP 400 / EMAIL_PASSWORD_SIGN_UP_DISABLED.
- Final ARM64 and AMD64 images run Node 24.22.1 and pass Trivy's HIGH/CRITICAL gate for OS and language packages.
- Full and production dependency audits: 0 critical, 0 high, 2 moderate. Initial full audit: 12 critical, 103 high, 115 moderate, 19 low.
- No real emails, S3 writes, Stripe payments, or production database changes were performed. Provider integration smoke tests and deployment verification must be performed in the appropriate staging/production environment.

## Remaining moderate dependency findings

These are documented exposure assessments, not globally ignored advisories. CI fails on high/critical findings; review moderate findings on each audit. Revisit by 2026-11-29 or immediately when the usage changes.

- GHSA-67mh-4wv8-2f99: esbuild 0.18.20 through Drizzle Kit's old TypeScript loader. The advisory concerns esbuild's HTTP development server. The repo uses the loader for schema tooling, not that server. Avoid forcing a breaking esbuild version into the old loader; replace/update the parent when supported. Do not expose Drizzle Studio publicly.
- GHSA-w5hq-g745-h8pq: UUID 8 through ExcelJS. The affected methods are v3/v5/v6 with caller-supplied output buffers. ExcelJS's reviewed call sites use v4 without supplied buffers. Do not force a UUID major upgrade into ExcelJS without compatibility testing. Reassess if workbook processing or UUID usage changes.

## Release procedure

1. Review and merge these changes. Tag both app releases using the repository's established release process.
2. Validation must pass; images must build, report the approved Node baseline, and pass the HIGH/CRITICAL scan before publication. Do not disable the gate to accommodate new findings.
3. Deploy both images. On the production host, enumerate every replica and run `node -p 'JSON.stringify(process.versions)'` inside each. Confirm Node >=24.22.1 on the supported 24.x line and record the deployed image digest alongside scan evidence.
4. Verify password/OTP login, invitation creation/acceptance, role boundaries, public forms, images and revalidation; smoke-test email, S3 and payment flows with appropriate test resources before production traffic.
5. Review existing admin users and invitations for unexpected registrations predating the signup fix. The patch prevents future uninvited creation; it does not establish whether historical abuse occurred.

The local host currently runs Node 24.11.1. Container builds use the patched runtime; upgrade the developer runtime to match the declared engine before routine local development. The production deployment still needs its own runtime verification; a locally scanned image does not prove old replicas were replaced.
