# Beautiful Table - Frontend

A React application for creating beautiful, styled tables from tabular data (TSV, CSV, Excel, Google Sheets).

## Features

- 📊 **Easy Data Input**: Paste data from Excel, Google Sheets, CSV, or TSV
- 🎨 **Beautiful Themes**: Multiple professional styling options
- 🖼️ **Image Export**: Export tables as high-quality PNG or JPG images
- 💳 **Credit-Based**: Pay-per-export model with transparent pricing
- 🔐 **Google Auth**: Secure authentication via Supabase + Google OAuth

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Testing**: Vitest + Playwright (E2E)
- **Auth**: Supabase (Google OAuth)
- **Payments**: Stripe
- **Hosting**: Cloudflare Pages

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for authentication)
- Stripe account (for payments)

## Getting Started

### 1. Clone and Install

```bash
cd frontend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_SUPABASE_URL=your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Development Server

```bash
npm run dev
```

Open http://localhost:5173

### 4. Run Tests

```bash
# Unit tests
npm test

# E2E tests (requires dev server)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Test coverage
npm run test:coverage
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── PasteInput/     # Data input component
│   │   ├── TablePreview/   # Table display component
│   │   ├── ThemeSelector/  # Theme selection component
│   │   ├── ExportButton/   # Export functionality
│   │   └── BillingModal/   # Payment/Credits UI
│   ├── pages/              # Route pages
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage/  # Main app page
│   │   └── AuthCallback.tsx
│   ├── lib/                # Utilities
│   │   ├── supabase.ts     # Auth utilities
│   │   └── useStore.ts     # Zustand store
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── e2e/                    # E2E tests
│   ├── basic-flow.spec.ts
│   ├── auth-flow.spec.ts
│   └── payment-flow.spec.ts
├── public/                 # Static assets
└── playwright.config.ts    # Playwright config
```

## Deployment

### Deploy to Cloudflare Pages

1. **Build the application**:

```bash
npm run build
```

2. **Deploy using Wrangler**:

```bash
npx wrangler pages deploy dist --project-name=beautiful-table
```

3. **Set environment variables** in Cloudflare Dashboard:

   - Go to Pages > Beautiful Table > Settings > Environment variables
   - Add: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`

4. **Configure custom domain** (optional):

   - Go to Custom domains in Cloudflare Pages
   - Add your domain and follow DNS instructions

### Continuous Deployment

Connect your GitHub repository to Cloudflare Pages for automatic deployments:

1. Go to Cloudflare Pages > Create a project
2. Connect to Git
3. Select your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `frontend`

## Usage Tracking

The application tracks usage via the Cloudflare Worker backend:

1. **Parse Event**: Logged when user pastes data (free)
2. **Export Event**: Logged when user exports table (1 credit)

Events are stored in D1 database and credits are deducted automatically.

## E2E Testing

Playwright tests verify critical user flows:

- **Basic Flow**: Paste → Preview → Export
- **Auth Flow**: Sign in → Dashboard
- **Payment Flow**: Purchase → Credits

Run E2E tests against production:

```bash
BASE_URL=https://your-domain.com npm run test:e2e
```

## Troubleshooting

### CORS Issues

If you see CORS errors, ensure:
1. Worker has CORS enabled (`cors()` middleware)
2. Supabase URL is correct in `.env`
3. API calls use relative URLs (e.g., `/api/parse`)

### Authentication Fails

Check:
1. Supabase credentials are correct
2. Redirect URL is configured in Supabase dashboard
3. Browser console for error messages

### Export Not Working

Verify:
1. Credits are available (> 0)
2. html2canvas library is installed
3. Browser allows downloads (no popup blocker)

## Development Tips

### View Store State

Open React DevTools and look at the `useStore` hook to see:
- Current table data
- Selected theme
- Credits remaining
- User session

### Debug API Calls

Use browser DevTools Network tab to see:
- Request payloads
- Response data
- Error messages

### Test Locally with Worker

1. Start the worker: `cd ../worker && npm run dev`
2. Set `VITE_API_URL=http://localhost:8787` in frontend `.env`
3. Restart frontend dev server

## Contributing

1. Create a feature branch
2. Write tests for your changes
3. Ensure all tests pass
4. Submit a PR with description

## License

MIT
