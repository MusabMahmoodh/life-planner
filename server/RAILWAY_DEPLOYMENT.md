# Railway Deployment Guide

## Prerequisites
- GitHub repository linked to Railway
- Railway account connected to GitHub

## Deployment Steps

### 1. Create a New Project in Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `life-planner` repository
5. Select the `server` directory as the root directory

### 2. Configure Environment Variables
In Railway dashboard, go to your service → Variables tab and add:

**Required Variables:**
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:5173,http://localhost:3000
```

**Optional:**
```
DEBUG=False
PORT=8000  # Railway sets this automatically, but you can override
```

### 3. Configure Root Directory
1. In Railway dashboard, go to your service → Settings
2. Set **Root Directory** to: `server`
3. This tells Railway where your `requirements.txt` and `Procfile` are located

### 4. Deploy
Railway will automatically:
- Detect Python from `runtime.txt`
- Install dependencies from `requirements.txt`
- Start the app using the `Procfile` command
- Expose the service on a public URL

### 5. Get Your Deployment URL
1. After deployment, Railway will provide a public URL (e.g., `https://your-app.up.railway.app`)
2. Update your frontend to use this URL instead of `localhost:8000`
3. Add this URL to `ALLOWED_ORIGINS` environment variable if needed

### 6. Monitor Logs
- View logs in Railway dashboard → Deployments → View Logs
- Check `/health` endpoint: `https://your-app.up.railway.app/health`

## Troubleshooting

### Build Fails
- Check that `requirements.txt` is in the `server` directory
- Verify Python version in `runtime.txt` is supported
- Check build logs for specific errors

### App Crashes
- Verify all environment variables are set correctly
- Check application logs in Railway dashboard
- Ensure `SUPABASE_URL` and keys are correct

### CORS Errors
- Add your frontend domain to `ALLOWED_ORIGINS` environment variable
- Format: `https://domain1.com,https://domain2.com` (comma-separated, no spaces)

### Port Issues
- Railway automatically sets `$PORT` environment variable
- The `Procfile` uses `$PORT` - don't hardcode port numbers

## Files Created for Railway
- `Procfile` - Tells Railway how to start your app
- `runtime.txt` - Specifies Python version
- `.railwayignore` - Files to exclude from deployment
- `railway.json` - Railway-specific configuration

