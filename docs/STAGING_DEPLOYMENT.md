# Staging UI deployment

The enterprise UI can be deployed to Cloudflare Pages so the laptop is not part of the test environment.

Backend staging is deployed independently from `Yashu7372/whatsapp-bot` using the lightweight VPS + PostgreSQL + Cloudflare Tunnel stack documented in `docs/STAGING_VPS_DEPLOYMENT.md` in that repository.

## Runtime path

```text
Browser
  -> Cloudflare Pages
  -> React/Vite static application
  -> https://api.<your-domain>/api/v1
  -> Cloudflare Tunnel
  -> Spring Boot staging VM
  -> PostgreSQL
```

The frontend already reads `VITE_API_BASE_URL`, so no source-code endpoint change is required.

## One-time Cloudflare Pages setup

Create a Cloudflare Pages Direct Upload project for the staging UI. The Pages project name is used by the GitHub workflow.

Create these GitHub Actions secrets on `Yashu7372/whatsapp-crm`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Create these repository Actions variables:

- `CLOUDFLARE_PAGES_PROJECT` - for example `enterprise-control-staging`
- `STAGING_API_BASE_URL` - for example `https://api.example.com/api/v1`
- `CLOUDFLARE_PAGES_DEPLOY_ENABLED=true`

The API token should be scoped only to the Cloudflare account/resources needed for Pages deployment.

## Deployment workflow

`.github/workflows/deploy-staging-pages.yml` runs on pushes to `feature/enterprise-document-control` and can be triggered manually.

It:

1. installs Node 22 dependencies;
2. builds the React/Vite application with `VITE_API_BASE_URL` pointing at staging;
3. runs the enterprise-route lint check;
4. uploads `dist/` to Cloudflare Pages using Wrangler;
5. publishes the `staging` Pages branch alias.

Until `CLOUDFLARE_PAGES_DEPLOY_ENABLED=true` is configured, push deployments are skipped so this workflow cannot break the existing branch CI before Cloudflare credentials exist.
