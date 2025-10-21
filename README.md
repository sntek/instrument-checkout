Welcome to Instrument Checkout! 

# Getting Started

To run this application:

```bash
pnpm i
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.


## Linting & Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The following scripts are available:


```bash
pnpm lint
pnpm format
pnpm check
```


## Backend

This application uses a Vercel backend deployed at `https://instrument-checkout-backend.vercel.app/`. The backend provides the following API endpoints:

- `GET /api/health` - Health check
- `GET /api/instruments` - Get all instruments
- `GET /api/reservations` - Get all reservations (optionally filter by instrumentName)
- `POST /api/reservations` - Create a new reservation
- `DELETE /api/reservations/[id]` - Delete a reservation
- `POST /api/migrate` - Initialize database tables and insert default instruments
- `POST /api/cron/daily-rollover` - Daily rollover cron job

## Setting up Clerk

- Set the `VITE_CLERK_PUBLISHABLE_KEY` in your `.env.local`.


## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
pnpx shadcn@latest add button
```