# Quick Start Guide

Get your Article Summarizer up and running in 10 minutes!

## Step 1: Get an API Key (2 minutes)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you'll need it in Step 3)

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

Add your API key:
```
ANTHROPIC_API_KEY=your_key_from_step_1
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

1. Go to any news article (try: https://news.ycombinator.com)
2. Click on an article
3. Click the TL;DR extension icon
4. Click "Summarize This Article"
5. Wait a few seconds for the magic!

## Troubleshooting

**"Could not summarize article"**
- Check backend is running: `pm2 status`
- Check logs: `pm2 logs article-summarizer-api`
- Verify API key is correct in `.env`

**CORS errors**
- Make sure your API URL includes `/api/summarize` at the end
- Check that backend server is accessible from your machine

**"No article content found"**
- Try clicking on the article text first
- Some sites have unusual layouts
- Try a different article

## Optional: Public Access with Domain

If you want to access from anywhere:

1. **Get a domain** (from Cloudflare, Namecheap, etc.)
2. **Point domain to your server IP**
3. **Setup Nginx** (see README.md)
4. **Add SSL** with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
5. **Update extension** to use `https://yourdomain.com/api/summarize`

## Need Help?

Check the full README.md for:
- Detailed setup instructions
- Nginx configuration
- API documentation
- Advanced features

---

**Estimated Costs:**
- API: ~$0.003 per summary
- Server: $5-10/month for basic VPS
- Domain: ~$10/year (optional)