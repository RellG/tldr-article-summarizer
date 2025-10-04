# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TL;DR Article Summarizer is a Chrome extension with a Node.js backend that provides AI-powered article summarization. The system uses Hugging Face's free BART model (facebook/bart-large-cnn) for generating summaries.

**Architecture:**
- **Chrome Extension** (Manifest V3): Frontend UI with content extraction
- **Express.js API**: Backend server handling AI inference via Hugging Face API
- **Communication**: Extension POSTs article content to backend `/api/summarize` endpoint

## Development Commands

### Backend Development

```bash
# Install dependencies
cd backend
npm install

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start

# Using PM2 (production)
pm2 start server.js --name article-summarizer-api
pm2 logs article-summarizer-api
pm2 restart article-summarizer-api
pm2 status
```

### Testing API

```bash
# Health check
curl http://localhost:8090/health

# Test summarization (note: first request may take 20-30s as model loads)
curl -X POST http://localhost:8090/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"content":"Your test article text here...", "summaryType":"medium"}'
```

### Chrome Extension Development

1. Make changes to `extension/` files
2. Go to `chrome://extensions/`
3. Click reload icon on TL;DR extension card
4. Test changes

**Note:** After modifying `manifest.json`, you must reload the extension.

## Configuration

### Backend Environment Variables

Create `backend/.env`:
```bash
HUGGINGFACE_TOKEN=hf_your_token_here
HUGGINGFACE_MODEL=facebook/bart-large-cnn  # Optional, defaults to this
PORT=8090  # Current production port on this server
```

**Important:** This server runs the API on port **8090** (not 3000 as shown in some docs).

### Extension Configuration

Users must configure the extension on first use:
1. Click extension icon
2. Enter API URL: `http://192.168.4.154:8090/api/summarize`
3. Click "Save Configuration"

API URL is stored in `chrome.storage.sync`.

## Key Architecture Details

### Content Extraction Strategy (popup.js:235-308)

The extension uses a multi-strategy approach to extract article content:
1. **Article selectors**: `<article>`, `[role="article"]`, common class names
2. **Main content selectors**: `<main>`, `[role="main"]`
3. **Paragraph aggregation**: Collect all `<p>` tags with >50 chars
4. **Fallback**: Get body text while hiding nav/header/footer

This runs in the page context via `chrome.scripting.executeScript()`.

### Summary Type Parameters (server.js:38-52)

The backend adjusts BART parameters based on `summaryType`:
- **short**: 30-80 tokens (2-3 sentences)
- **medium**: 60-150 tokens (3-5 bullet points)
- **detailed**: 150-300 tokens (7-10 bullet points)

### Hugging Face API Integration (server.js:54-91)

Key details:
- Content is truncated to 4000 chars (BART max ~1024 tokens)
- First request triggers model loading (20-30s wait)
- Subsequent requests are fast (2-5s)
- Returns 503 error with `estimatedTime` when model is loading
- Results are formatted as bullet points for medium/detailed summaries

### Caching System (popup.js:200-222)

Extension caches last 20 summaries locally using `chrome.storage.local`:
```javascript
{
  url: string,
  summary: string,
  wordCount: number,
  readingTime: number,
  timestamp: number
}
```

## Common Development Tasks

### Adding a New Summary Type

1. Update `extension/popup.html` `<select id="summaryType">` with new option
2. Add case in `backend/server.js` switch statement (line 38-52)
3. Define `minSummaryLength` and `maxSummaryLength` parameters

### Changing AI Model

Edit `backend/.env`:
```bash
# Alternatives:
HUGGINGFACE_MODEL=sshleifer/distilbart-cnn-12-6  # Faster, smaller
HUGGINGFACE_MODEL=google/pegasus-xsum           # Alternative quality
```

Restart backend: `pm2 restart article-summarizer-api`

### Switching to Different AI Provider

To use Claude API instead of Hugging Face:
1. Replace Hugging Face fetch in `server.js:55-72` with Anthropic SDK
2. Update `.env` with `ANTHROPIC_API_KEY`
3. Modify prompt to use Claude's message format
4. Adjust response parsing in `server.js:94-100`

## Deployment

### Quick Deploy

```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

This script:
- Installs Node.js 20 if needed
- Runs `npm install`
- Sets up PM2 process manager
- Creates `.env` template
- Starts service on boot

### Manual Deploy

```bash
cd backend
npm install
nano .env  # Add HUGGINGFACE_TOKEN
pm2 start server.js --name article-summarizer-api
pm2 save
pm2 startup  # Enable start on boot
```

### Production Notes

- **Current server**: Running on vbox (192.168.4.154:8090)
- **Service management**: PM2 handles process monitoring and auto-restart
- **Nginx**: Optional reverse proxy (see `backend/nginx.conf.example`)
- **Firewall**: Port 8090 is open to local network (192.168.4.0/24)

## Troubleshooting

### "Model is loading" errors
- **Cause**: Hugging Face free tier has cold starts
- **Fix**: Wait 20-30s and retry. Model stays warm for ~10 min after use
- **Upgrade option**: Hugging Face Pro ($9/mo) for instant inference

### "No article content found"
- **Cause**: Content extraction failed on complex page layouts
- **Debug**: Check browser console for extraction errors
- **Fix**: Try clicking into article text first

### API connection errors
- Verify backend is running: `pm2 status`
- Check logs: `pm2 logs article-summarizer-api`
- Test health endpoint: `curl http://localhost:8090/health`
- Verify extension has correct API URL configured

### CORS errors
- Backend has `cors()` middleware enabled for all origins
- Ensure API URL in extension includes full path: `/api/summarize`
- Check backend logs for actual error details

## File Structure Context

```
backend/
├── server.js          # Main API server (Express + Hugging Face integration)
├── package.json       # Dependencies: express, cors, dotenv, node-fetch
├── deploy.sh          # Automated deployment script
└── .env               # Config (HUGGINGFACE_TOKEN, PORT)

extension/
├── manifest.json      # Chrome extension config (V3, permissions)
├── popup.html         # Extension UI (dark theme)
├── popup.js           # Main logic (content extraction, API calls, caching)
├── styles.css         # Dark theme styling
└── icons/             # Extension icons (16, 48, 128px)
```

## Git Workflow

This repository is managed under the RellG GitHub account:
- **GitHub**: https://github.com/RellG/tldr-article-summarizer
- **User**: RellG
- **Email**: tareynolds725@gmail.com

Standard commit format includes:
```
<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
