# Cloudflare Workers Backend Setup

This document explains how to set up and deploy the Cloudflare Workers backend for the instrument checkout application.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Already installed as a dev dependency
3. **Node.js**: Version 18 or higher

## Setup Instructions

### 1. Login to Cloudflare

```bash
pnpm wrangler login
```

This will open a browser window for you to authenticate with Cloudflare.

### 2. Create D1 Database

```bash
# Create database
pnpm worker:db:create

# This will output a database ID - copy it and update wrangler.toml
```

Update the `database_id` in `wrangler.toml` with the ID from the command above.

### 3. Run Database Migrations

```bash
# Run migrations
pnpm worker:db:migrate
```

### 4. Start Development Server

```bash
# Start the Cloudflare Worker locally
pnpm worker:dev

# In another terminal, start the frontend
pnpm dev
```

The worker will be available at `http://localhost:8787`

### 5. Deploy to Production

```bash
# Deploy the worker
pnpm worker:deploy
```

## Environment Variables

Create a `.env` file in your project root:

```env
VITE_API_BASE_URL=http://localhost:8787
```

For production, update the `VITE_API_BASE_URL` to your deployed worker URL.

## API Endpoints

The Cloudflare Worker provides the following endpoints:

- `GET /health` - Health check
- `GET /api/instruments` - Get all instruments
- `GET /api/reservations` - Get all reservations (optionally filter by instrumentName)
- `POST /api/reservations` - Create a new reservation
- `DELETE /api/reservations/:id` - Delete a reservation

## Database Schema

The D1 database includes:

- `reservations` table: Stores instrument reservations
- `instruments` table: Stores instrument information (optional)

## CORS Configuration

The worker is configured to allow requests from any origin in development. For production, you may want to restrict this to your specific domain.

## Troubleshooting

### Common Issues

1. **Database not found**: Make sure you've created the D1 database and updated the `database_id` in `wrangler.toml`
2. **CORS errors**: Check that the worker is running and accessible
3. **Authentication issues**: Ensure you're logged in with `wrangler login`

### Debugging

- Check the Wrangler logs: `pnpm worker:dev` will show console logs
- Use the Cloudflare dashboard to monitor your worker
- Check the D1 database in the Cloudflare dashboard

## Production Deployment

1. Deploy with `pnpm worker:deploy`
2. Update your frontend's `VITE_API_BASE_URL` to the production worker URL
