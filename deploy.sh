#!/bin/bash

# Beautiful Table - Deployment Script
# This script deploys both frontend and worker to Cloudflare

set -e  # Exit on error

echo "🚀 Beautiful Table - Production Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo "1. ✅ Have you updated environment variables?"
echo "2. ✅ Have you created D1 database?"
echo "3. ✅ Have you configured Stripe webhooks?"
echo "4. ✅ Have you run tests locally?"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Deploy Worker
echo -e "${YELLOW}⚙️  Deploying Cloudflare Worker...${NC}"
cd worker

# Check if secrets are set
echo -e "${YELLOW}🔐 Checking Wrangler secrets...${NC}"
if ! wrangler secret list --name beautiful-table-worker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Some secrets may not be set. Current secrets:${NC}"
    wrangler secret list --name beautiful-table-worker || true
    echo ""
    echo "Required secrets:"
    echo "  - SUPABASE_URL"
    echo "  - SUPABASE_ANON_KEY"
    echo "  - STRIPE_SECRET_KEY"
    echo "  - STRIPE_WEBHOOK_SECRET"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Deploy worker
echo -e "${GREEN}📦 Deploying worker...${NC}"
wrangler deploy --name beautiful-table-worker

echo -e "${GREEN}✅ Worker deployed successfully!${NC}"
echo ""

# Deploy Frontend
echo -e "${YELLOW}🎨 Deploying Frontend to Cloudflare Pages...${NC}"
cd ../frontend

# Build frontend
echo -e "${GREEN}🔨 Building frontend...${NC}"
npm run build

# Deploy to Pages
echo -e "${GREEN}📦 Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy dist --project-name beautiful-table

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo ""

# Post-deployment instructions
echo -e "${YELLOW}📝 Post-Deployment Steps:${NC}"
echo ""
echo "1. ✅ Configure D1 Database:"
echo "   wrangler d1 execute beautiful-table-db --file=../worker/schema.sql"
echo ""
echo "2. ✅ Set environment variables in Cloudflare Pages:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_STRIPE_PUBLISHABLE_KEY"
echo ""
echo "3. ✅ Configure Stripe webhook:"
echo "   - Endpoint: https://beautiful-table-worker.your-subdomain.workers.dev/api/payment/webhook"
echo "   - Events: checkout.session.completed, payment_intent.succeeded"
echo ""
echo "4. ✅ Run E2E tests:"
echo "   cd frontend"
echo "   BASE_URL=https://your-domain.com npm run test:e2e"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
