Write-Host "🚀 Setting up Cloudflare Workers for Instrument Checkout" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if wrangler is available
try {
    pnpm wrangler --version | Out-Null
    Write-Host "✅ Wrangler is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Wrangler not found. Installing dependencies..." -ForegroundColor Red
    pnpm install
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Login to Cloudflare: pnpm wrangler login" -ForegroundColor White
Write-Host "2. Create D1 database: pnpm wrangler d1 create instrument-checkout-db" -ForegroundColor White
Write-Host "3. Copy the database ID and update wrangler.toml" -ForegroundColor White
Write-Host "4. Run migrations: pnpm worker:db:migrate" -ForegroundColor White
Write-Host "5. Start development: pnpm worker:dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see README-CLOUDFLARE.md" -ForegroundColor Cyan
