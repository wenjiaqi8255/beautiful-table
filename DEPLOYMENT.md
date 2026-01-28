# Beautiful Table - Production Deployment Guide

This guide covers deploying Beautiful Table to production using Cloudflare Pages and Workers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [D1 Database Setup](#d1-database-setup)
3. [Stripe Configuration](#stripe-configuration)
4. [Supabase Setup](#supabase-setup)
5. [Worker Deployment](#worker-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [E2E Testing](#e2e-testing)
8. [Monitoring](#monitoring)

## Prerequisites

- Cloudflare account (free tier works)
- Supabase account (free tier works)
- Stripe account (test mode)
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`

## D1 Database Setup

### 1. Create D1 Database

```bash
wrangler d1 create beautiful-table-db
```

Note the `database_id` from the output.

### 2. Update wrangler.toml

```toml
[[d1_databases]]
binding = "DB"
database_name = "beautiful-table-db"
database_id = "your-actual-database-id"  # Paste ID here
```

### 3. Initialize Database Schema

```bash
cd worker
wrangler d1 execute beautiful-table-db --file=../schema.sql
```

Or run migrations:

```bash
wrangler d1 migrations apply beautiful-table-db --remote
```

### 4. Verify Database

```bash
wrangler d1 execute beautiful-table-db --command="SELECT * FROM users LIMIT 1"
```

## Stripe Configuration

### 1. Create Stripe Products

In Stripe Dashboard:

1. Go to Products > Add product
2. Create pricing tiers:
   - **Starter**: 100 credits for $9
   - **Basic**: 500 credits for $29
   - **Pro**: 2000 credits for $79

### 2. Get API Keys

1. Go to Developers > API keys
2. Copy **Publishable key** (pk_test_...) → Frontend `.env`
3. Copy **Secret key** (sk_test_...) → Wrangler secret

### 3. Configure Webhook

1. Go to Developers > Webhooks > Add endpoint
2. URL: `https://beautiful-table-worker.YOUR_SUBDOMAIN.workers.dev/api/payment/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy **Signing secret** (whsec_...) → Wrangler secret

### 4. Set Wrangler Secrets

```bash
cd worker

wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_test_...

wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_...
```

## Supabase Setup

### 1. Create Project

1. Go to https://supabase.com
2. Click "New Project"
3. Set organization and password
4. Wait for project to be ready

### 2. Configure Authentication

1. Go to Authentication > Providers
2. Enable **Google** provider
3. Add authorized redirect URL:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:5173/auth/callback` (for dev)

4. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`

### 3. Create Users Table (Optional)

If using Supabase auth, you can sync users to D1:

```sql
-- In Supabase SQL Editor
CREATE TABLE custom_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  credits_remaining INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Set Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Worker Deployment

### 1. Build Worker

```bash
cd worker
npm install
npm run build
```

### 2. Test Worker Locally

```bash
wrangler dev
```

Test endpoints:
- http://localhost:8787/api/health
- http://localhost:8787/api/parse

### 3. Deploy to Production

```bash
wrangler deploy
```

Output will show:
```
✨ Built successfully
✨ Deployed successfully
  https://beautiful-table-worker.YOUR_SUBDOMAIN.workers.dev
```

### 4. Verify Worker

```bash
curl https://beautiful-table-worker.YOUR_SUBDOMAIN.workers.dev/api/health
```

Should return:
```json
{"status":"healthy","timestamp":"2024-..."}
```

### 5. Set Production Secrets

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Frontend Deployment

### 1. Build Frontend

```bash
cd frontend
npm install
npm run build
```

Creates `dist/` directory with production build.

### 2. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI

```bash
npx wrangler pages deploy dist --project-name beautiful-table
```

#### Option B: Using Cloudflare Dashboard

1. Go to Cloudflare Pages > Create a project
2. Connect to Git (or "Upload assets")
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `frontend`
4. Click "Save and Deploy"

### 3. Configure Environment Variables

In Cloudflare Pages dashboard:

1. Go to Settings > Environment variables
2. Add production variables:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key
   VITE_STRIPE_PUBLISHABLE_KEY = pk_test_...
   ```

### 4. Configure Custom Domain (Optional)

1. Go to Custom domains > Set up a custom domain
2. Enter your domain (e.g., `app.beautifultable.com`)
3. Follow DNS instructions

## E2E Testing

### 1. Update Base URL

```bash
cd frontend
export BASE_URL=https://your-domain.com
```

### 2. Run E2E Tests

```bash
npm run test:e2e
```

### 3. Run Specific Test Suites

```bash
# Test basic flow only
npm run test:e2e -- --grep "Basic Flow"

# Test auth flow
npm run test:e2e -- --grep "Authentication"

# Test payment flow
npm run test:e2e -- --grep "Payment"
```

### 4. Debug Failed Tests

```bash
# Run with headed mode
npm run test:e2e:headed

# Run with Playwright Inspector
npm run test:e2e:ui
```

## Monitoring

### 1. Cloudflare Analytics

- **Worker**: Go to Workers & Pages > beautiful-table-worker > Metrics
- **Pages**: Go to Pages > beautiful-table > Analytics

### 2. D1 Database Metrics

```bash
wrangler d1 info beautiful-table-db
```

### 3. View Logs

**Worker logs**:
```bash
wrangler tail beautiful-table-worker
```

**Pages logs**:
In Cloudflare Dashboard > Pages > beautiful-table > Logs

### 4. Stripe Dashboard

Monitor:
- Payments: Payments > All payments
- Webhooks: Developers > Webhooks > (select webhook) > Logs
- Revenue: Dashboard (for revenue metrics)

### 5. Supabase Dashboard

Monitor:
- Auth usage: Authentication > Reports
- Database: Database > Metrics
- API requests: Settings > API > Metrics

## Rollback Procedure

If deployment fails:

### 1. Rollback Worker

```bash
wrangler rollback beautiful-table-worker
```

Or redeploy previous version:
```bash
wrangler deploy --version <previous-version-number>
```

### 2. Rollback Frontend

In Cloudflare Dashboard:
1. Go to Pages > beautiful-table > Deployments
2. Find previous successful deployment
3. Click "Rollback to this deployment"

## Troubleshooting

### Worker Returns 500 Error

1. Check logs: `wrangler tail beautiful-table-worker`
2. Verify D1 binding: `wrangler d1 info beautiful-table-db`
3. Test locally: `wrangler dev`

### Frontend Shows CORS Error

1. Verify worker has CORS enabled
2. Check API URL in `.env`
3. Ensure requests use relative URLs (e.g., `/api/parse`)

### Authentication Fails

1. Verify Supabase credentials
2. Check redirect URL matches
3. Look for errors in browser console

### Stripe Webhook Fails

1. Verify webhook secret: `wrangler secret list`
2. Check webhook URL is correct
3. Test webhook in Stripe Dashboard > Webhooks > (select) > Send test webhook

### Credits Not Deducting

1. Check usage endpoint is called
2. Verify D1 database connection
3. Check worker logs for errors

## Performance Optimization

### 1. Enable Caching

In worker, add caching headers:
```typescript
return c.json(data, 200, {
  'Cache-Control': 'public, max-age=3600'
});
```

### 2. Use Cloudflare CDN

Static assets are automatically cached on Cloudflare CDN.

### 3. Optimize Images

Ensure exported images use compression:
```typescript
canvas.toDataURL('image/jpeg', 0.8); // 80% quality
```

## Security Checklist

- ✅ Environment variables are secrets (not committed to git)
- ✅ Stripe webhook signature is verified
- ✅ D1 database bindings are correct
- ✅ CORS is configured properly
- ✅ Rate limiting is enabled (if needed)
- ✅ HTTPS is enforced (automatic on Cloudflare)

## Support

For issues:
- Check logs: `wrangler tail`
- Review this guide
- Check Cloudflare status page: https://www.cloudflarestatus.com/

## Next Steps

1. ✅ Deploy to production
2. ✅ Run E2E tests
3. ✅ Monitor first few users
4. ✅ Set up analytics
5. ✅ Collect user feedback
6. ✅ Iterate on features
