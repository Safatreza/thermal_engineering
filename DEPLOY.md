# Deployment Guide for Vercel

This guide will help you deploy the Thermal Engineering Data Visualization app to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Git installed on your machine
3. The repository pushed to GitHub

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com and log in
2. Click "Add New Project"
3. Import your GitHub repository: `Safatreza/thermal_engineering`
4. Vercel will auto-detect the framework settings
5. Click "Deploy"
6. Wait for the deployment to complete (usually 1-2 minutes)
7. Your app will be live at: `https://thermal-engineering.vercel.app` (or similar)

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

5. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **thermal_engineering**
   - Directory? **./
   - Override settings? **N**

6. For production deployment:
```bash
vercel --prod
```

## Configuration Details

The project includes:
- `vercel.json` - Vercel configuration file
- `requirements.txt` - Python dependencies
- `app.py` - Flask application with Vercel handler

## Important Notes

### Data File Size
The CSV file (20251211_LPE_CC_Data_Export.csv) is ~32,000 rows. Vercel has deployment limits:
- **Free tier**: 100MB max deployment size
- **Serverless function**: 50MB max (including dependencies)

If you encounter size issues:
1. Consider sampling the data for demo purposes
2. Upgrade to Vercel Pro
3. Host the CSV file externally (S3, GitHub Releases, etc.)

### Environment Variables
No environment variables are required for basic deployment.

### Custom Domain
To add a custom domain:
1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your domain and follow DNS instructions

## Troubleshooting

### Build Fails
- Check that all dependencies in `requirements.txt` are compatible
- Ensure the CSV file is in the root directory
- Check Vercel build logs for specific errors

### Function Timeout
- Vercel free tier has 10s timeout
- Consider caching the processed data
- Optimize data loading

### Memory Issues
- Reduce data size or sample the CSV
- Optimize pandas operations
- Consider upgrading to Pro plan (3008MB memory vs 1024MB)

## Performance Optimization Tips

1. **Data Caching**: Cache the processed DataFrame
2. **Downsampling**: For very large datasets, consider displaying every Nth point
3. **Static Generation**: Pre-render charts as static images for faster load

## Support

For issues, check:
- Vercel documentation: https://vercel.com/docs
- Project issues: https://github.com/Safatreza/thermal_engineering/issues
