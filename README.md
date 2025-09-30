# TL;DR Article Summarizer

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

An AI-powered Chrome extension that instantly summarizes web articles using **FREE** Hugging Face AI models.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development) • [Contributing](#contributing)

</div>

---

## ✨ Features

### 🎨 Modern Dark Theme
- Discord/Claude/X/xAI inspired design
- Sleek dark interface with gradient accents
- Smooth animations and transitions

### 🚀 Smart Summarization
- **One-click summarization** - Get instant AI-powered summaries
- **Multiple lengths** - Short (2-3 sentences), Medium (3-5 bullets), Detailed (7-10 bullets)
- **Smart extraction** - Automatically identifies article content from any webpage
- **Progress tracking** - Real-time progress bar with status updates

### 📊 Insights & Metrics
- **Word count** - See the original article length
- **Reading time** - Estimated time to read the full article
- **Processing time** - How fast the AI generated your summary
- **Summary cache** - Stores last 20 summaries locally

### ⌨️ Productivity Features
- **Keyboard shortcuts** - `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)
- **Copy to clipboard** - One-click copy functionality
- **Beautiful UI** - Modern, responsive design

### 💰 Completely FREE
- Uses Hugging Face's free tier (30,000 requests/month)
- No credit card required
- Perfect for personal use (~1,000 summaries/day)

## 📸 Screenshots

![TL;DR Extension Demo](https://via.placeholder.com/800x400/18181b/8b5cf6?text=Add+Your+Screenshot+Here)

## 🚀 Quick Start

### Prerequisites
- Linux server (Ubuntu 20.04+)
- Node.js 18+ and npm
- Free Hugging Face account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cyphorlogs/tldr-article-summarizer.git
   cd tldr-article-summarizer
   ```

2. **Get FREE Hugging Face API Token**
   - Sign up at [huggingface.co](https://huggingface.co/join)
   - Go to [Settings > Tokens](https://huggingface.co/settings/tokens)
   - Create a new token with **Read** permission
   - Copy the token

3. **Deploy Backend**
   ```bash
   cd backend
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Configure Environment**
   ```bash
   nano .env
   # Add your Hugging Face token:
   # HUGGINGFACE_TOKEN=hf_your_token_here
   ```

5. **Start the Server**
   ```bash
   npm install
   pm2 start server.js --name article-summarizer-api
   pm2 save
   ```

6. **Load Chrome Extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder
   - Configure API URL: `http://your-server-ip:8090/api/summarize`

**Detailed Setup:** See [QUICKSTART-HUGGINGFACE.md](QUICKSTART-HUGGINGFACE.md)

## 📖 Usage

1. **Navigate to any article** on the web
2. **Press** `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)
   - Or click the TL;DR extension icon
3. **Select summary length** (Short/Medium/Detailed)
4. **Click "Summarize This Article"**
5. **Wait 2-5 seconds** for your AI-generated summary
6. **Copy** or **Clear** the summary as needed

## 🛠️ Tech Stack

- **Frontend:** Chrome Extension API (Manifest V3), Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **AI Model:** Hugging Face BART (facebook/bart-large-cnn)
- **Styling:** Custom CSS with modern dark theme
- **Storage:** Chrome Storage API for caching

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

## 🔮 Future Improvements

- [ ] Auto-summarize on page load option
- [ ] Multiple language support
- [ ] Export summaries (PDF, Markdown)
- [ ] Reading list integration
- [ ] Custom prompt templates
- [ ] Text-to-speech for summaries
- [ ] Browser sync across devices
- [ ] Highlight key sentences on page
- [ ] Compare different summary styles

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

Please make sure to update tests and documentation as appropriate.

## 📝 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 cyphorlogs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Credits & Acknowledgments

Built with ❤️ using:
- [Hugging Face](https://huggingface.co/) - FREE AI inference API (BART model)
- [Express.js](https://expressjs.com/) - Fast, minimalist web framework
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser integration
- Design inspiration from [Discord](https://discord.com), [Claude](https://claude.ai), [X](https://x.com), and [xAI](https://x.ai)

## 📧 Contact & Support

- **Author:** cyphorlogs
- **GitHub:** [@cyphorlogs](https://github.com/cyphorlogs)
- **Issues:** [Report a bug](https://github.com/cyphorlogs/tldr-article-summarizer/issues)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with 🤖 by [Claude Code](https://claude.com/claude-code)

</div>