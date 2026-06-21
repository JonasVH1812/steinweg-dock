#!/bin/bash
echo "🔨 Running pre-deployment checks..."

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔍 Running linter..."
bun run lint

echo "✅ Pre-deployment checks passed!"
echo ""
echo "To deploy to Vercel:"
echo "  1. Push to GitHub: git remote add origin <repo-url> && git push -u origin main"
echo "  2. Import at https://vercel.com/new"
echo "  3. Set env vars: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL"
echo "  4. Deploy!"
