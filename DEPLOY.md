# Steinweg Dock Management - Deployment Guide

## Deploy to Vercel (Free)

### Prerequisites
- A [Vercel](https://vercel.com) account (free tier is sufficient)
- Git repository with the project

### Steps

1. **Push to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Steinweg Dock Management App"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework Preset: **Next.js**
   - Root Directory: `./` (default)

3. **Environment Variables**
   Add these in Vercel Project Settings → Environment Variables:
   ```
   DATABASE_URL=file:./db/custom.db
   NEXTAUTH_SECRET=<generate-a-random-secret>
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   - Vercel will auto-detect Next.js and deploy

### Important Notes
- **SQLite on Vercel**: The free SQLite database is file-based and will reset on each deployment. For production, upgrade to:
  - **Turso** (libSQL) - Free tier with 9GB storage
  - **PlanetScale** - Free MySQL-compatible serverless
  - **Supabase** - Free PostgreSQL with 500MB storage

- **To switch to Turso (recommended free option)**:
  1. Install: `npm install @libsql/client`
  2. Update `prisma/schema.prisma`: Change provider to `"sqlite"` and url to `"libsql://..."`
  3. Or use Prisma with PostgreSQL provider for Supabase

- **Photo uploads**: Currently stored in `public/uploads/` which is ephemeral on Vercel. For production, use:
  - **Vercel Blob** (free tier: 250MB)
  - **Cloudflare R2** (free tier: 10GB)
  - **AWS S3** (pay-per-use)

### Custom Domain
1. In Vercel Project Settings → Domains
2. Add your domain (e.g., `dock.steinweg.be`)
3. Configure DNS records as instructed

### PWA on iPhone
The app is already configured as a PWA:
1. Open in Safari on iPhone
2. Tap the Share button (⬆️)
3. Scroll down and tap "Add to Home Screen"
4. The app will appear with the ⚓ anchor icon
5. It opens in fullscreen mode like a native app
