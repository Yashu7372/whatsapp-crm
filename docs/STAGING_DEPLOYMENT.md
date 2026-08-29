# Staging UI deployment

The enterprise UI stays available on Cloudflare Pages while the backend runs only during demo/test sessions on Google Compute Engine.

The authoritative backend setup is `docs/GCP_DEMO_ENVIRONMENT.md` in `Yashu7372/whatsapp-bot`.

## Runtime path

```text
Browser
  -> Cloudflare Pages (always available)
  -> React/Vite static application
  -> current https://*.trycloudflare.com/api/v1
  -> Google Compute Engine VM (only while demo is running)
  -> Spring Boot + PostgreSQL
```

The frontend already reads `VITE_API_BASE_URL`, so the backend URL is injected at build time.

## Normal demo flow

The backend repository workflow `Demo Environment - GCP` is the preferred entrypoint.

When `start` is selected it:

1. starts the Google VM;
2. starts PostgreSQL and Spring Boot;
3. discovers the new anonymous Quick Tunnel URL;
4. checks out this frontend branch;
5. builds it with `VITE_API_BASE_URL=<quick-tunnel>/api/v1`;
6. deploys the result to the `staging` Cloudflare Pages branch;
7. prints the frontend/backend URLs in the GitHub Actions summary.

When the backend workflow is run with `stop`, the VM stops but Cloudflare Pages remains online.

## One-time Cloudflare Pages setup

Create a Cloudflare Pages Direct Upload project, for example `enterprise-control-demo`.

For the automated backend Start Demo workflow, store these on `Yashu7372/whatsapp-bot`:

### Secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Variable

- `CLOUDFLARE_PAGES_PROJECT`

The Quick Tunnel itself needs no Cloudflare account or token; the token is only for publishing the React build to Pages.

## Optional standalone frontend deployment

`.github/workflows/deploy-staging-pages.yml` is manual-only. It can be used if the UI needs to be redeployed separately from the backend Start Demo workflow.

When running it, provide `api_base_url` such as:

```text
https://random-words.trycloudflare.com/api/v1
```

If `api_base_url` is omitted, it falls back to repository variable `STAGING_API_BASE_URL`.

The standalone frontend workflow needs these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

and variable:

- `CLOUDFLARE_PAGES_PROJECT`

## Quick Tunnel limitation

TryCloudflare Quick Tunnels are intended for demos/development and do not support Server-Sent Events (SSE). When the platform is ready for its own domain, move to a named Cloudflare Tunnel; the frontend and backend application architecture do not otherwise need to change.
