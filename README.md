# TL;DR Article Summarizer

An AI-powered Chrome extension that instantly summarizes web articles using FREE Hugging Face AI models.

## Features

- **One-click summarization** - Summarize any article with a single click
- **Multiple summary lengths** - Choose between short, medium, or detailed summaries
- **Smart content extraction** - Automatically identifies and extracts article content
- **Copy to clipboard** - Easily copy summaries for later use
- **Beautiful UI** - Modern, gradient-based design

## Project Structure

```
TL;DR/
├── backend/              # API Server
│   ├── server.js        # Express API server
│   ├── package.json     # Node.js dependencies
│   ├── .env.example     # Environment variables template
│   ├── deploy.sh        # Deployment script
│   └── nginx.conf.example # Nginx configuration
│
└── extension/           # Chrome Extension
    ├── manifest.json    # Extension manifest
    ├── popup.html       # Extension popup UI
    ├── popup.js         # Extension logic
    ├── styles.css       # Extension styles
    └── icons/           # Extension icons
```

## Setup Instructions

**Quick Start:** See [QUICKSTART-HUGGINGFACE.md](QUICKSTART-HUGGINGFACE.md) for a 10-minute setup guide!

### Backend Setup (Linux Server)

1. **Prerequisites**
   - Linux server (Ubuntu 20.04+ recommended)
   - Domain name (optional, for SSL)
   - FREE Hugging Face token from https://huggingface.co/settings/tokens

2. **Deploy the API**
   ```bash
   cd backend
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure environment**
   ```bash
   nano .env
   # Add your Hugging Face token:
   # HUGGINGFACE_TOKEN=hf_your_token_here
   # HUGGINGFACE_MODEL=facebook/bart-large-cnn
   ```

4. **Start the server**
   ```bash
   npm install
   pm2 start server.js --name article-summarizer-api
   pm2 save
   ```

5. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

### Extension Setup

1. **Add extension icons**
   - Place icon files (16x16, 48x48, 128x128) in `extension/icons/`
   - Or create temporary placeholders for testing

2. **Load extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension` folder

3. **Configure the extension**
   - Click the extension icon
   - Enter your API URL: `http://your-server.com:3000/api/summarize`
   - Click "Save Configuration"

### Production Setup (Optional)

1. **Setup Nginx reverse proxy**
   ```bash
   sudo apt install nginx -y
   sudo cp backend/nginx.conf.example /etc/nginx/sites-available/article-summarizer
   sudo nano /etc/nginx/sites-available/article-summarizer
   # Edit server_name to your domain
   sudo ln -s /etc/nginx/sites-available/article-summarizer /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

2. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

3. **Update extension configuration**
   - Use HTTPS URL: `https://your-domain.com/api/summarize`

## Usage

1. Navigate to any article on the web
2. Click the TL;DR extension icon
3. Select your desired summary length
4. Click "Summarize This Article"
5. Wait a few seconds for the AI to generate the summary
6. Copy the summary or clear it

## API Endpoints

### GET /health
Health check endpoint
```bash
curl http://localhost:3000/health
```

### POST /api/summarize
Summarize article content
```bash
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Article text here...",
    "url": "https://example.com/article",
    "summaryType": "medium"
  }'
```

**Parameters:**
- `content` (required): Article text to summarize
- `url` (optional): Source URL
- `summaryType` (optional): "short", "medium" (default), or "detailed"

**Response:**
```json
{
  "summary": "Bullet point summary...",
  "originalLength": 5000,
  "summaryLength": 250,
  "url": "https://example.com/article",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Costs

Using Hugging Face (FREE):
- **30,000 requests/month** - Completely FREE!
- Perfect for personal use (~1,000 summaries/day)
- No credit card required

### Alternative AI Options

| Service | Cost | Quality | Speed |
|---------|------|---------|-------|
| **Hugging Face** (default) | FREE (30k/month) | Good | 2-5s |
| Claude API | $0.003/summary | Excellent | 1-2s |
| Ollama (self-hosted) | FREE (unlimited) | Good | 5-10s |

## Troubleshooting

**Extension doesn't detect articles:**
- Try clicking on the article text first
- Some sites have complex layouts that may not be detected
- Check browser console for errors

**"Model is loading" message:**
- This is normal for the first request (takes 20-30 seconds)
- Wait and try again - subsequent requests will be fast
- Models sleep after inactivity and need to reload

**API errors:**
- Verify your Hugging Face token is correct
- Check API server is running: `pm2 status`
- View logs: `pm2 logs article-summarizer-api`

**CORS errors:**
- Make sure your API URL is correct in the extension
- Check nginx configuration if using reverse proxy

## Future Improvements

- [ ] Add caching to avoid re-summarizing same articles
- [ ] Save summaries locally in extension
- [ ] Add authentication for API
- [ ] Support for summarizing PDFs
- [ ] Browser history of summaries
- [ ] Dark mode toggle
- [ ] Multiple AI model options

## License

MIT License - Feel free to use and modify!

## Credits

Built with:
- [Hugging Face](https://huggingface.co/) for FREE AI summarization (BART model)
- [Express.js](https://expressjs.com/) for API server
- Chrome Extensions API for browser integration