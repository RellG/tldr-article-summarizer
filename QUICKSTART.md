# Quick Start Guide

Get your TL;DR Article Summarizer up and running in 10 minutes!

## Step 1: Get a FREE API Key (2 minutes)

1. Go to https://openrouter.ai/
2. Sign up or log in with GitHub/Google
3. Navigate to "Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

**Note:** OpenRouter provides FREE access to powerful models like Meta Llama 3.3 70B!

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

Add your OpenRouter API key:
```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your_key_here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
SITE_URL=http://192.168.4.154:8090
SITE_NAME=TL;DR Article Summarizer

# Server Port
PORT=8090

# Environment
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

Restart the service:
```bash
pm2 restart article-summarizer-api
# OR if not using PM2:
node server.js
```

## Step 4: Test Backend (1 minute)

```bash
curl http://localhost:8090/health
```

Should return: `{"status":"ok","timestamp":"..."}`

Test summarization:
```bash
curl -X POST http://localhost:8090/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"content":"Your test article text here","summaryType":"short"}'
```

## Step 5: Install Extension (2 minutes)

### Option A: From ZIP (Recommended)
1. Download `tldr-extension-v2.7-final.zip`
2. Extract to a folder
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the extracted `extension` folder

### Option B: From Source
1. Clone the repository
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder

## Step 6: Configure Extension (1 minute)

1. Click the TL;DR extension icon (purple book)
2. Click the ⚙️ Settings icon
3. Enter your API URL:
   - Local: `http://your-server-ip:8090/api/summarize`
   - Example: `http://192.168.4.154:8090/api/summarize`
4. Click "Save API URL"
5. Choose your preferred theme (Light/Dark)
6. Set default summary length

## Step 7: Test It! (30 seconds)

1. Go to any news article (try: https://finance.yahoo.com/news)
2. Click on an article
3. Click the TL;DR extension icon
4. Click "Summarize This Article"
5. Watch the book pages flip while AI analyzes!
6. Get your summary in 2-5 seconds

## Available FREE Models

Edit `.env` to switch models:

```bash
# RECOMMENDED - Fast and high quality
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# Other free options:
# OPENROUTER_MODEL=google/gemini-flash-1.5:free
# OPENROUTER_MODEL=deepseek/deepseek-chat
```

## Troubleshooting

**"Failed to fetch" / Timeout errors**
- Check backend is running: `pm2 status` or `ps aux | grep node`
- Check logs: `pm2 logs article-summarizer-api`
- Verify firewall allows port 8090
- Try increasing timeout in extension settings

**"API request failed: 404"**
- Check model name in `.env` is correct
- Verify OpenRouter API key is valid
- Try a different free model

**CORS errors**
- Make sure API URL includes `/api/summarize` at the end
- Check backend server is accessible from your machine
- Verify CORS is enabled in `server.js`

**"No article content found"**
- Try clicking on the article text first
- Some sites have unusual layouts
- Try a different article (finance.yahoo.com works well)

**Slow summaries (30+ seconds)**
- Switch to faster model: `google/gemini-flash-1.5:free`
- Reduce article length (extension auto-truncates to 4000 chars)
- Check your internet connection

## Features Overview

### 🎨 UI Features
- **3D Page Flip Animation** - Realistic book page turning
- **Light/Dark Mode** - Toggle with ☀️/🌙 button
- **Settings Page** - Configure API, theme, defaults
- **Custom Icons** - Purple book icon in toolbar

### 📝 Summary Options
- **Short** - 2-3 sentences
- **Medium** - 3-5 sentences (default)
- **Detailed** - 7-10 sentences

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+S` (Windows/Linux)
- `Cmd+Shift+S` (Mac)

## Optional: Public Access with Domain

If you want to access from anywhere:

1. **Get a domain** (from Cloudflare, Namecheap, etc.)
2. **Point domain to your server IP**
3. **Setup Nginx** (see `backend/nginx.conf.example`)
4. **Add SSL** with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
5. **Update extension** to use `https://yourdomain.com/api/summarize`

## Performance Tips

- **First request** may take 3-5 seconds (model warming up)
- **Subsequent requests** are faster (1-3 seconds)
- **Long articles** auto-truncate to 4000 characters
- **Cache** stores last 20 summaries locally

## Need Help?

Check the full README.md for:
- Detailed setup instructions
- Nginx configuration examples
- API documentation
- Advanced features
- Model comparison

---

## 💰 Estimated Costs

- **API:** 100% FREE with OpenRouter (Meta Llama 3.3 70B)
- **Server:** $5-10/month for basic VPS (or run locally)
- **Domain:** ~$10/year (optional)

**Total:** FREE for API + hosting costs only! 🎉

---

**Version:** 2.7.0
**AI Model:** Meta Llama 3.3 70B (70 billion parameters)
**Response Time:** 1-3 seconds
**Rate Limits:** None on free tier
