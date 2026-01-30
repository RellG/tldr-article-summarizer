# Railway Environment Variables Setup

## Required Environment Variables

Add these to your Railway project's **Variables** section:

### 1. API Keys
```
OPENROUTER_API_KEY=REDACTED-OPENROUTER-KEY
```

### 2. AI Models (IMPORTANT!)
```
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
OPENROUTER_MODEL_ADVANCED=meta-llama/llama-3.3-70b-instruct:free
```

**Why the same model for both?**
- Llama 3.3 70B handles ALL summary styles perfectly with proper prompting
- Gemini 2.0 Flash has rate limits (429 errors) on the free tier
- Using Llama for everything ensures reliable, consistent performance

### 3. Site Info
```
SITE_URL=https://tldr-article-summarizer-production.up.railway.app
SITE_NAME=TL;DR Article Summarizer
```

### 4. Server Config
```
PORT=8090
NODE_ENV=production
```

---

## How to Add Variables to Railway

### Method 1: Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Select your **tldr-article-summarizer** project
3. Click on your service
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Add each variable above

### Method 2: Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Add variables
railway variables set OPENROUTER_API_KEY=REDACTED-OPENROUTER-KEY
railway variables set OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
railway variables set OPENROUTER_MODEL_ADVANCED=google/gemini-2.0-flash-exp:free
railway variables set SITE_URL=https://tldr-article-summarizer-production.up.railway.app
railway variables set SITE_NAME="TL;DR Article Summarizer"
railway variables set NODE_ENV=production
```

---

## Verify Setup

### 1. Check Health Endpoint
```bash
curl https://tldr-article-summarizer-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T19:30:00.000Z"
}
```

### 2. Test Summary Styles
Test that different styles use different models:

**Standard (Uses Llama):**
```bash
curl -X POST https://tldr-article-summarizer-production.up.railway.app/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test article content here...",
    "summaryType": "medium",
    "summaryStyle": "standard"
  }'
```

**Bullets (Uses Gemini):**
```bash
curl -X POST https://tldr-article-summarizer-production.up.railway.app/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test article content here...",
    "summaryType": "medium",
    "summaryStyle": "bullets"
  }'
```

### 3. Check Logs
In Railway dashboard:
1. Go to your service
2. Click **Deployments**
3. Click on latest deployment
4. View logs

Look for:
```
Using model: meta-llama/llama-3.3-70b-instruct:free for style: standard
Using model: google/gemini-2.0-flash-exp:free for style: bullets
```

---

## Complete Variable List

Copy and paste this into Railway (adjust values as needed):

```env
# API Keys
OPENROUTER_API_KEY=REDACTED-OPENROUTER-KEY

# AI Models (REQUIRED!)
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
OPENROUTER_MODEL_ADVANCED=google/gemini-2.0-flash-exp:free

# Site Configuration
SITE_URL=https://tldr-article-summarizer-production.up.railway.app
SITE_NAME=TL;DR Article Summarizer

# Server
PORT=8090
NODE_ENV=production
```

---

## Troubleshooting

### Problem: All summary styles look the same
**Solution:** Make sure `OPENROUTER_MODEL_ADVANCED` is set in Railway variables

### Problem: Summaries fail with 500 error
**Solution:** Check that `OPENROUTER_API_KEY` is correct and has not expired

### Problem: Slow responses
**Solution:** Both models are free tier and may have rate limits. Gemini Flash 2.0 is generally faster.

### Problem: Deploy fails
**Solution:**
1. Check Railway logs for errors
2. Ensure all required variables are set
3. Redeploy from Railway dashboard

---

## Model Details

### Llama 3.3 70B (All Styles)
- **Speed**: Fast (2-4s)
- **Best For**: ALL summary styles - paragraphs, bullets, facts, ELI5, action items
- **Provider**: Meta via OpenRouter
- **Cost**: 100% FREE
- **Rate Limits**: None (reliable for production)

### Why Not Gemini?
Gemini 2.0 Flash (experimental) has strict rate limits on the free tier, causing 429 errors. Llama 3.3 70B produces excellent formatted output with proper prompting.

---

## Need Help?

- **Railway Docs**: https://docs.railway.app/
- **OpenRouter Docs**: https://openrouter.ai/docs
- **GitHub Issues**: https://github.com/RellG/tldr-article-summarizer/issues

---

**Created:** 2026-01-12
**Version:** 2.9.0
