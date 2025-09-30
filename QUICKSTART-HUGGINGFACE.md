# Quick Start Guide - Hugging Face (FREE)

Get your Article Summarizer up and running with FREE Hugging Face API in 10 minutes!

## Step 1: Get a FREE Hugging Face Token (2 minutes)

1. Go to https://huggingface.co/join
2. Sign up for a free account
3. Go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Give it a name (e.g., "article-summarizer")
6. Select "Read" permission
7. Click "Generate token"
8. Copy the token (you'll need it in Step 3)

**Free Tier:** 30,000 requests/month - Perfect for personal use!

## Step 2: Deploy Backend (3 minutes)

On your Linux server:

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install Node.js and dependencies
- Set up PM2 process manager
- Create environment file

## Step 3: Configure Backend (1 minute)

```bash
cd backend
nano .env
```

Add your Hugging Face token:
```
HUGGINGFACE_TOKEN=hf_your_token_from_step_1
HUGGINGFACE_MODEL=facebook/bart-large-cnn
PORT=3000
```

Save and exit (Ctrl+X, Y, Enter)

Restart the service:
```bash
pm2 restart article-summarizer-api
```

## Step 4: Test Backend (1 minute)

```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

Test summarization:
```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"content":"Your article text here..."}'
```

**Note:** First request might take 20-30 seconds as the model loads. Subsequent requests will be fast!

## Step 5: Install Extension (2 minutes)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Navigate to and select the `extension` folder
6. Extension icon should appear in toolbar

## Step 6: Configure Extension (1 minute)

1. Click the TL;DR extension icon
2. Enter your API URL:
   - Local: `http://your-server-ip:3000/api/summarize`
   - With domain: `http://your-domain.com:3000/api/summarize`
3. Click "Save Configuration"

## Step 7: Test It! (30 seconds)

1. Go to any news article (try: https://arstechnica.com)
2. Click on an article
3. Click the TL;DR extension icon
4. Click "Summarize This Article"
5. Wait a few seconds (first time might take ~20s as model loads)
6. Enjoy your free AI-powered summary!

## Important Notes

### Model Loading Time
- **First request**: 20-30 seconds (model needs to load)
- **Subsequent requests**: 2-5 seconds
- Models sleep after ~10 minutes of inactivity
- Solution: Keep using it, or upgrade to paid tier for instant inference

### Free Tier Limits
- **30,000 requests/month**
- ~1,000 summaries per day
- Rate limit: 100 requests/hour
- Perfect for personal use!

### Available Models

You can change the model in `.env`:

```bash
# Fast and good quality (default)
HUGGINGFACE_MODEL=facebook/bart-large-cnn

# Smaller, faster model
HUGGINGFACE_MODEL=sshleifer/distilbart-cnn-12-6

# Alternative good quality
HUGGINGFACE_MODEL=google/pegasus-xsum
```

## Troubleshooting

**"Model is loading, please try again in 20 seconds"**
- This is normal for the first request
- Wait 20-30 seconds and try again
- After first load, requests are fast

**"Could not summarize article"**
- Check backend is running: `pm2 status`
- Check logs: `pm2 logs article-summarizer-api`
- Verify token is correct in `.env`

**"Hugging Face token not configured"**
- Make sure `.env` file exists in backend folder
- Verify `HUGGINGFACE_TOKEN` is set correctly
- Restart API: `pm2 restart article-summarizer-api`

**CORS errors**
- Make sure your API URL includes `/api/summarize` at the end
- Check that backend server is accessible from your machine

**"No article content found"**
- Try clicking on the article text first
- Some sites have unusual layouts
- Try a different article

## Cost Comparison

| Service | Free Tier | Quality | Speed |
|---------|-----------|---------|-------|
| **Hugging Face** | 30k/month | Good | 2-5s (after load) |
| Claude API | $5 credit | Excellent | 1-2s |
| OpenAI API | $5 credit | Excellent | 1-2s |
| Self-hosted Ollama | Unlimited | Good | 5-10s |

## Upgrade Options

If you need faster inference or higher limits:

1. **Hugging Face Pro** ($9/month)
   - Instant inference (no cold starts)
   - Higher rate limits

2. **Switch to Claude API** (see main README)
   - Better quality summaries
   - ~$0.003 per summary

3. **Self-host with Ollama** (see README)
   - Completely free
   - Requires more powerful server

## Need Help?

Check the full README.md for:
- Detailed setup instructions
- Nginx configuration
- API documentation
- Advanced features

---

**Congratulations!** You now have a FREE AI-powered article summarizer!

**Tip:** Bookmark your favorite news sites and use the extension to quickly get through daily reading.