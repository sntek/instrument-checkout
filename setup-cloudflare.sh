#!/bin/bash

echo "🚀 Setting up Cloudflare Workers for Instrument Checkout"
echo "=================================================="

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    pnpm install
fi

echo "📋 Next steps:"
echo "1. Login to Cloudflare: pnpm wrangler login"
echo "2. Create D1 database: pnpm wrangler d1 create instrument-checkout-db"
echo "3. Copy the database ID and update wrangler.toml"
echo "4. Run migrations: pnpm worker:db:migrate"
echo "5. Start development: pnpm worker:dev"
echo ""
echo "📖 For detailed instructions, see README-CLOUDFLARE.md"
