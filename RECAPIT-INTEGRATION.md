# RecapIt Integration Guide

**Date:** 2025-10-17
**Purpose:** Local media summarizer API for RecapIt Chrome Extension

---

## 🎯 Overview

You now have **two separate APIs** running:

### 1. TL;DR Article Summarizer (Production)
- **File:** `backend/server.js`
- **Port:** 8090 (local), Railway auto-port (production)
- **Production URL:** https://api.terravirtual.cfd/api/summarize
- **Model:** Meta Llama 3.3 70B (FREE)
- **API Key:** Stored in `backend/.env` as `OPENROUTER_API_KEY`
- **Purpose:** Article summarization for TL;DR Chrome extension
- **Status:** ✅ Live in Chrome Web Store, 7+ users

### 2. RecapIt Media Summarizer (Local Development)
- **File:** `backend/media-server.js`
- **Port:** 8091 (local only)
- **Local URL:** http://192.168.4.154:8091/api/summarize-media
- **Model:** Google Gemini Flash 2.0 Exp (FREE)
- **API Key:** Stored in `backend/.env` as `OPENROUTER_API_KEY_MEDIA`
- **Purpose:** YouTube, podcast, video summarization for RecapIt extension
- **Status:** 🚧 Local development, ready for integration

---

## 🔑 API Keys Configuration

Both API keys are stored in `/home/cyphorlogs/TL;DR/backend/.env`:

```bash
# TL;DR Extension (Articles) - Llama 3.3 70B
OPENROUTER_API_KEY=your-tldr-api-key-here
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free

# RecapIt Extension (Media) - Gemini Flash 2.0 Exp
OPENROUTER_API_KEY_MEDIA=your-recapit-api-key-here
OPENROUTER_MODEL_MEDIA=google/gemini-flash-2.0-exp:free

# Server Ports
PORT=8090
PORT_MEDIA=8091

SITE_URL=http://192.168.4.154:8090
SITE_NAME=TL;DR Article Summarizer
```

**⚠️ IMPORTANT:** Never commit `.env` file or API keys to public repositories!

---

## 🚀 Starting the Servers

### TL;DR Server (Port 8090)
```bash
cd /home/cyphorlogs/TL\;DR/backend
node server.js
```

### RecapIt Media Server (Port 8091)
```bash
cd /home/cyphorlogs/TL\;DR/backend
node media-server.js
```

### Both Servers Together
```bash
cd /home/cyphorlogs/TL\;DR/backend
node server.js &
node media-server.js &
```

### Check Running Servers
```bash
ss -tlnp | grep -E ":(8090|8091)"
```

Expected output:
```
LISTEN 0      511                *:8090             *:*    users:(("node",pid=XXX,fd=18))
LISTEN 0      511                *:8091             *:*    users:(("node",pid=XXX,fd=18))
```

---

## 📡 API Endpoints

### RecapIt Media Summarizer

**Endpoint:** `POST /api/summarize-media`

**Request Body:**
```json
{
  "content": "Full transcript or article text here...",
  "url": "https://youtube.com/watch?v=xxxxx",
  "type": "youtube",
  "summaryType": "medium",
  "metadata": {
    "title": "Video Title",
    "duration": "15:30",
    "channel": "Channel Name"
  }
}
```

**Supported Types:**
- `youtube` - YouTube videos (12,000 char limit)
- `podcast` - Podcast episodes (15,000 char limit)
- `video` - General videos (10,000 char limit)
- `article` - Article content (4,000 char limit)

**Summary Types:**
- `short` - 2-3 sentences
- `medium` - 4-6 sentences (default)
- `detailed` - 8-12 sentences

**Response:**
```json
{
  "summary": "The AI-generated summary...",
  "originalLength": 8432,
  "summaryLength": 287,
  "type": "youtube",
  "url": "https://youtube.com/watch?v=xxxxx",
  "metadata": {
    "title": "Video Title",
    "duration": "15:30",
    "channel": "Channel Name"
  },
  "timestamp": "2025-10-17T20:45:00.000Z",
  "model": "google/gemini-flash-2.0-exp:free"
}
```

**Error Responses:**
- `429` - Rate limit exceeded (10 req/min per IP)
- `400` - No content provided
- `500` - API error or timeout

---

## 🧪 Testing the APIs

### Test TL;DR (Articles)
```bash
curl http://localhost:8090/health

curl -X POST http://localhost:8090/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Your article text here...",
    "summaryType": "medium"
  }'
```

### Test RecapIt (Media)
```bash
curl http://localhost:8091/health

curl -X POST http://localhost:8091/api/summarize-media \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Video transcript or article text here...",
    "type": "youtube",
    "summaryType": "medium",
    "metadata": {
      "title": "Test Video",
      "duration": "10:30",
      "channel": "Test Channel"
    }
  }'
```

---

## 🔐 Security & Rate Limiting

Both APIs share the same rate limiting:
- **10 requests per minute** per IP address
- **60-second window** (rolling)
- **In-memory tracking** (resets on server restart)
- **Auto-cleanup** every 5 minutes

---

## 🌐 Using from RecapIt Extension

Your RecapIt extension should call:

**Local Development:**
```javascript
const API_URL = 'http://192.168.4.154:8091/api/summarize-media';

const response = await fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: videoTranscript,
    url: videoUrl,
    type: 'youtube',
    summaryType: 'medium',
    metadata: {
      title: videoTitle,
      duration: videoDuration,
      channel: channelName
    }
  })
});

const data = await response.json();
console.log(data.summary);
```

---

## 📊 Content Length Limits

| Media Type | Max Characters | Reasoning |
|------------|----------------|-----------|
| Article    | 4,000          | Quick summaries |
| Video      | 10,000         | Moderate transcripts |
| YouTube    | 12,000         | Longer videos |
| Podcast    | 15,000         | Long-form audio |

Content exceeding these limits will be truncated with "..." appended.

---

## 🎨 Type-Specific Prompts

### YouTube
```
System: You are an expert at summarizing YouTube videos from transcripts.
Focus on key points, main arguments, and actionable insights.

User: Summarize this youtube content in 4-6 clear sentences:

Title: Video Title
Duration: 15:30
Source: Channel Name

Content:
[transcript...]
```

### Podcast
```
System: You are an expert at summarizing podcast episodes.
Capture the main discussion topics, key takeaways, and interesting insights.

User: Summarize this podcast content in 4-6 clear sentences:

Episode: Episode Title
Duration: 45:00
Show: Podcast Name

Content:
[transcript...]
```

### Video
```
System: You are an expert at summarizing video content.
Focus on the main message, important points, and key information.

User: Summarize this video content in 4-6 clear sentences:

Content:
[transcript...]
```

---

## 🛡️ Production Safety

**TL;DR Extension (Production):**
- ✅ **server.js is unchanged** - No risk to existing users
- ✅ **Railway deployment unchanged** - Production remains stable
- ✅ **API endpoint unchanged** - `/api/summarize` works as before
- ✅ **Rate limiting unchanged** - Same 10 req/min limit

**RecapIt Extension (Development):**
- 🚧 **Runs locally only** - Not deployed to Railway
- 🚧 **Port 8091 local** - Not exposed to internet
- 🚧 **Separate API key** - No impact on TL;DR quota
- 🚧 **media-server.js** - Independent from production

---

## 📝 Key Differences

| Feature | TL;DR (server.js) | RecapIt (media-server.js) |
|---------|-------------------|---------------------------|
| **Port** | 8090 | 8091 |
| **Model** | Llama 3.3 70B | Gemini Flash 2.0 Exp |
| **API Key** | OPENROUTER_API_KEY | OPENROUTER_API_KEY_MEDIA |
| **Endpoint** | /api/summarize | /api/summarize-media |
| **Max Content** | 4,000 chars | 12,000-15,000 chars |
| **Timeout** | 45 seconds | 60 seconds |
| **Max Tokens** | 400 | 600 |
| **Deployment** | Railway (production) | Local only |
| **Purpose** | Articles | YouTube/Podcasts/Videos |

---

## 🔄 When to Use Each API

### Use TL;DR API (`/api/summarize`)
- ✅ Summarizing **articles** or **blog posts**
- ✅ Text content from **webpages**
- ✅ Short to medium content (< 4,000 chars)
- ✅ When you need **production reliability**

### Use RecapIt API (`/api/summarize-media`)
- ✅ Summarizing **YouTube videos**
- ✅ **Podcast episodes**
- ✅ **Video transcripts**
- ✅ Long-form content (10k-15k chars)
- ✅ When you need **metadata support** (title, duration, channel)

---

## 🚧 Next Steps for RecapIt

1. **Build Chrome extension** on your other server (192.168.4.168)
2. **Test locally** with http://192.168.4.154:8091/api/summarize-media
3. **Implement transcript extraction** (YouTube API or scraping)
4. **Deploy to Railway** (optional, when ready for production)
5. **Update to production URL** when deployed

---

## 📦 Files in Repository

```
backend/
├── server.js              # TL;DR API (production)
├── media-server.js        # RecapIt API (local dev)
├── .env                   # Both API keys stored here
├── package.json
└── node_modules/

extension/                 # TL;DR Chrome extension
docs/                      # Privacy policy (GitHub Pages)
API-DOCUMENTATION.md       # Complete API guide
RECAPIT-INTEGRATION.md     # This file
```

---

## ✅ Verification Checklist

- [x] TL;DR server runs on port 8090
- [x] RecapIt server runs on port 8091
- [x] Both health endpoints working
- [x] TL;DR `/api/summarize` tested successfully
- [x] RecapIt `/api/summarize-media` endpoint created
- [x] Separate API keys configured
- [x] server.js unchanged (production safe)
- [x] media-server.js committed to git
- [x] Changes pushed to GitHub

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Find process using port
ss -tlnp | grep :8091

# Kill process
kill -9 <PID>

# Restart server
node media-server.js
```

### API Not Responding
```bash
# Check if server is running
ss -tlnp | grep :8091

# Check logs (if running in background)
tail -f nohup.out
```

### Rate Limit Issues
- Wait 60 seconds between bursts of requests
- Rate limit resets automatically after 1 minute
- Increase `MAX_REQUESTS_PER_WINDOW` if needed for testing

---

**Created:** 2025-10-17
**Author:** RellG with Claude Code
**Purpose:** RecapIt extension integration guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)
