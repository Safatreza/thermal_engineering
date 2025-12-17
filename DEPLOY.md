# Deployment Guide for Vercel - Next.js

This guide will help you deploy the Thermal Engineering Data Visualization Next.js app to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Git installed on your machine
3. The repository pushed to GitHub

## Why Next.js?

We migrated from Flask to Next.js for better Vercel compatibility:
- ✅ Native Vercel support (built by the same team)
- ✅ No serverless function issues
- ✅ Faster cold starts
- ✅ Better performance and caching
- ✅ Automatic optimizations
- ✅ Client-side CSV processing

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and log in
2. Click "Add New Project"
3. Import your GitHub repository: `Safatreza/thermal_engineering`
4. Vercel will auto-detect Next.js configuration
5. Click "Deploy"
6. Wait for the deployment to complete (usually 1-2 minutes)
7. Your app will be live!

**That's it!** Vercel automatically:
- Detects Next.js framework
- Installs dependencies (`npm install`)
- Builds the project (`npm run build`)
- Deploys to their global CDN

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to your project directory:
```bash
cd thermal_engineering
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy:
```bash
vercel
```

5. For production deployment:
```bash
vercel --prod
```

## Configuration Details

The project includes:
- `vercel.json` - Minimal Vercel configuration
- `package.json` - Node dependencies and scripts
- `next.config.js` - Next.js configuration

## Important Notes

### Data File
The CSV file is ~2MB and located in `public/` directory:
- ✅ Automatically served by Next.js
- ✅ Accessible at `/20251211_LPE_CC_Data_Export.csv`
- ✅ Parsed client-side with PapaParse
- ✅ No server processing needed

### Performance
- **First load**: ~2-3 seconds
- **Subsequent loads**: Near instant (browser caching)
- **Build time**: ~30-60 seconds on Vercel

### Custom Domain
To add a custom domain:
1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your domain and follow DNS instructions

## Local Development

Run locally before deploying:

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Support

For issues, check:
- Vercel docs: https://vercel.com/docs
- Next.js docs: https://nextjs.org/docs
- Project issues: https://github.com/Safatreza/thermal_engineering/issues
