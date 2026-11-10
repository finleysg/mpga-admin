## Contact form spam protection

Contact submissions require Turnstile verification at the admin email endpoint,
including the `contact` action and an allowed hostname. The public server forwards
requests using a shared secret. Missing configuration fails closed; there is no
production CAPTCHA bypass.

Set these **runtime environment variables in CapRover**, not GitHub build secrets:

| App    | Variable                   | Value                                                              |
| ------ | -------------------------- | ------------------------------------------------------------------ |
| Public | `TURNSTILE_SITE_KEY`       | Your widget's public site key                                      |
| Admin  | `TURNSTILE_SECRET_KEY`     | Your widget's private secret                                       |
| Admin  | `TURNSTILE_HOSTNAMES`      | `mpga.net,www.mpga.net` (only hostnames actually serving the form) |
| Both   | `CONTACT_FORM_SECRET`      | The same random value, generated with `openssl rand -hex 32`       |
| Public | `CONTACT_CLIENT_IP_HEADER` | `x-real-ip`, after verifying the ingress configuration below       |

Configure Turnstile's allowed hostnames to match. The contact page reads the site
key at runtime, so changing keys does not require rebuilding images. GitHub
Actions deployment tokens do not transfer GitHub secrets into CapRover runtime
settings; the Turnstile secrets added to GitHub are not used by this implementation.

Before enabling `CONTACT_CLIENT_IP_HEADER`, verify that the public app's trusted
Nginx ingress **overwrites** that header (for example,
`proxy_set_header X-Real-IP $remote_addr;`) and that clients cannot connect directly
to the container. Do not use an untrusted `X-Forwarded-For` chain. If another CDN
sits in front of Nginx, configure trusted proxy real-IP handling first; otherwise
all visitors may appear to share the CDN's IP. The admin endpoint trusts only the
IP forwarded with `CONTACT_FORM_SECRET`, not headers from direct browser calls.

Admin startup automatically applies only `0006_wet_microbe` before starting the
server. This additive migration creates `contactGuard` and its expiry index,
records completion, and uses a database lock to serialize rolling deployments.
It is safe to retry if startup is interrupted. The database user needs CREATE
permission. Migration failure prevents the new admin container from serving.
Deploy admin successfully before deploying public.

Historical migrations are not automatically replayed: startup migrations were
previously disabled, so the older production migration history must be reconciled
before enabling the full runner. The public app does not run migrations. No
CapRover migration hook or GitHub Turnstile secrets are required.

The shared MySQL guards allow three accepted messages per IP and per email in a
ten-minute window. Matching normalized email/message pairs are suppressed for
24 hours, even across concurrent requests or app restarts. Expired guard rows are
pruned in batches during submissions. A hidden honeypot and server-side field
validation provide additional filtering. IP and email guard keys are SHA-256
hashes; message content is stored only in the existing messages table.

Messages are saved before notification delivery. If the mail provider fails, the
message remains available in admin and the duplicate guard prevents repeated
notification attempts for that message for 24 hours. There is no automatic email
retry queue.

For local testing, use Cloudflare's documented test keys, set
`TURNSTILE_HOSTNAMES` to the test verifier's returned hostname, and use a local
trusted proxy that sets `X-Real-IP`. Never use test keys in production. Focused
unit tests use mocked verification and email delivery; MySQL concurrency tests
use the existing disposable `mpga_security_test` database convention:

```sh
pnpm exec vitest run apps/admin/src/lib/__tests__/contact-protection.test.ts apps/public/src/app/contact-us/__tests__
TEST_DATABASE_PORT=25062 pnpm exec vitest run apps/admin/src/lib/__tests__/contact-store.integration.test.ts
```

The integration database must use the test-only root password `mpga-test-only`;
these tests must never point at application data.
