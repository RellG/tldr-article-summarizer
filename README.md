# TL;DR Article Summarizer

<div align="center">

![Version](https://img.shields.io/badge/version-2.7.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![AI Model](https://img.shields.io/badge/AI-Llama%203.3%2070B-purple.svg)
![Free API](https://img.shields.io/badge/API-100%25%20FREE-brightgreen.svg)

An AI-powered Chrome extension that instantly summarizes web articles using **FREE** Meta Llama 3.3 70B via OpenRouter.

[Features](#features) • [Quick Start](#quick-start) • [Installation](#installation) • [Usage](#usage) • [API](#api-endpoints)

</div>

---

## ✨ Features

### 🎨 Beautiful Modern UI
- **3D Page Flip Animation** - Realistic book with turning pages while loading
- **Light & Dark Mode** - Toggle between themes with one click
- **Custom Purple Book Icon** - Elegant icon for toolbar and extensions page
- **Centered Design** - Clean, professional interface
- **Smooth Animations** - Polished transitions throughout

### 🚀 Powerful AI Summarization
- **One-click summarization** - Get instant AI-powered summaries
- **Multiple lengths** - Short (2-3 sentences), Medium (3-5 sentences), Detailed (7-10 sentences)
- **Smart extraction** - Automatically identifies article content from any webpage
- **Meta Llama 3.3 70B** - 70 billion parameter model for high-quality summaries
- **Fast responses** - 1-3 seconds after initial warmup

### 📊 Insights & Metrics
- **Word count** - See the original article length
- **Reading time** - Estimated time to read the full article
- **Processing time** - How fast the AI generated your summary
- **Summary cache** - Stores last 20 summaries locally

### ⚙️ Full Settings Page
- **API Configuration** - Easy setup and management
- **Theme Selection** - Choose Light or Dark mode
- **Default Summary Length** - Set your preference
- **About Section** - Version and model information

### ⌨️ Productivity Features
- **Keyboard shortcuts** - `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)
- **Copy to clipboard** - One-click copy functionality
- **Clear summaries** - Quick reset button
- **Progress tracking** - Real-time status with animated book

### 💰 Completely FREE
- **100% FREE AI API** via OpenRouter (Meta Llama 3.3 70B)
- **No rate limits** on free tier
- **No credit card required**
- **Perfect for unlimited use**

## 📸 Screenshots

_Coming soon - Extension with 3D page flip animation, light/dark modes, and settings page_

## 🚀 Quick Start

**⏱️ Get running in 10 minutes!** → See [QUICKSTART.md](QUICKSTART.md)

### Prerequisites
- Linux server or local machine
- Node.js 18+ and npm
- Free OpenRouter account

### Lightning Setup

1. **Get FREE OpenRouter API Key**
   ```bash
   # Visit https://openrouter.ai/
   # Sign up with GitHub/Google
   # Create API key (starts with sk-or-v1-...)
   ```

2. **Clone & Deploy**
   ```bash
   git clone https://github.com/RellG/tldr-article-summarizer.git
   cd tldr-article-summarizer/backend
   npm install
   ```

3. **Configure**
   ```bash
   cat > .env << EOF
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
   PORT=8090
   EOF
   ```

4. **Start Server**
   ```bash
   node server.js
   # Or with PM2: pm2 start server.js --name tldr-api
   ```

5. **Install Extension**
   - Download `tldr-extension-v2.7-final.zip`
   - Extract and load in Chrome (`chrome://extensions/`)
   - Configure API URL in settings: `http://your-ip:8090/api/summarize`

## 📖 Usage

### Basic Usage
1. **Navigate to any article** on the web
2. **Click the purple book icon** or press `Cmd+Shift+S` / `Ctrl+Shift+S`
3. **Select summary length** (Short/Medium/Detailed)
4. **Click "Summarize This Article"**
5. **Watch the 3D book pages flip** while AI analyzes
6. **Get your summary** in 1-3 seconds!

### Settings
Click the ⚙️ icon to:
- Configure API URL
- Switch Light/Dark mode
- Set default summary length
- View version info

## 🛠️ Tech Stack

### Frontend
- **Chrome Extension** - Manifest V3
- **Vanilla JavaScript** - No framework dependencies
- **Custom CSS3** - 3D animations, gradients, transitions
- **Chrome Storage API** - Local caching

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Lightweight API framework
- **OpenRouter API** - AI model gateway
- **Meta Llama 3.3 70B** - State-of-the-art language model

### AI Model
- **Model:** `meta-llama/llama-3.3-70b-instruct:free`
- **Parameters:** 70 billion
- **Provider:** OpenRouter (via Meta)
- **Cost:** 100% FREE
- **Speed:** 1-3 seconds
- **Quality:** Excellent

## 📁 Project Structure

```
TL;DR/
├── backend/                    # API Server
│   ├── server.js              # Express API with OpenRouter
│   ├── package.json           # Node.js dependencies
│   ├── .env.example           # Environment template
│   ├── deploy.sh              # Automated deployment
│   └── nginx.conf.example     # Nginx reverse proxy config
│
└── extension/                 # Chrome Extension
    ├── manifest.json          # Extension config v2.7.0
    ├── popup.html             # Main popup UI
    ├── popup.js               # Extension logic
    ├── styles.css             # 3D animations & themes
    ├── settings.html          # Settings page
    ├── settings.js            # Settings logic
    ├── create-better-icons.py # Icon generator script
    └── icons/                 # Custom purple book icons
        ├── icon16.png         # Toolbar icon
        ├── icon48.png         # Extension page
        └── icon128.png        # Details page
```

## 🔧 Installation

### Detailed Backend Setup

1. **Prerequisites**
   ```bash
   # Node.js 18+
   node --version  # Should be 18.0.0 or higher
   npm --version
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/RellG/tldr-article-summarizer.git
   cd tldr-article-summarizer
   ```

3. **Backend Configuration**
   ```bash
   cd backend
   npm install

   # Create .env file
   cat > .env << EOF
   # OpenRouter API Configuration
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
   SITE_URL=http://your-server-ip:8090
   SITE_NAME=TL;DR Article Summarizer

   # Server Configuration
   PORT=8090
   NODE_ENV=production
   EOF
   ```

4. **Start Server**
   ```bash
   # Development
   node server.js

   # Production with PM2
   npm install -g pm2
   pm2 start server.js --name tldr-api
   pm2 save
   pm2 startup  # Enable on boot
   ```

5. **Test API**
   ```bash
   # Health check
   curl http://localhost:8090/health

   # Test summarization
   curl -X POST http://localhost:8090/api/summarize \
     -H "Content-Type: application/json" \
     -d '{"content":"Test article about AI.","summaryType":"short"}'
   ```

### Extension Installation

1. **Download Extension**
   - Download `tldr-extension-v2.7-final.zip` from releases
   - Or use the `extension/` folder from source

2. **Load in Chrome**
   ```
   1. Open Chrome → chrome://extensions/
   2. Enable "Developer mode" (top right toggle)
   3. Click "Load unpacked"
   4. Select the extracted extension/ folder
   5. Purple book icon appears in toolbar!
   ```

3. **Configure Extension**
   ```
   1. Click purple book icon
   2. Click ⚙️ Settings icon
   3. Enter API URL: http://your-server-ip:8090/api/summarize
   4. Click "Save API URL"
   5. Choose Light/Dark mode
   6. Set default summary length
   ```

## 🌐 Production Setup (Optional)

### With Nginx & SSL

1. **Install Nginx**
   ```bash
   sudo apt install nginx -y
   ```

2. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location /api/summarize {
           proxy_pass http://localhost:8090/api/summarize;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Setup SSL**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

4. **Update Extension**
   - Use HTTPS URL: `https://your-domain.com/api/summarize`

## 📡 API Endpoints

### GET /health
Health check endpoint

**Request:**
```bash
curl http://localhost:8090/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

### POST /api/summarize
Summarize article content with AI

**Request:**
```bash
curl -X POST http://localhost:8090/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Full article text here...",
    "url": "https://example.com/article",
    "summaryType": "medium"
  }'
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | Article text to summarize (max 4000 chars) |
| `url` | string | No | Source URL for reference |
| `summaryType` | string | No | "short", "medium" (default), or "detailed" |

**Response:**
```json
{
  "summary": "AI-generated summary in paragraph form...",
  "originalLength": 5000,
  "summaryLength": 250,
  "url": "https://example.com/article",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "model": "meta-llama/llama-3.3-70b-instruct:free"
}
```

## 💰 Costs & Pricing

### Current Setup (100% FREE!)
- **API:** $0.00 - OpenRouter's free tier with Llama 3.3 70B
- **Rate Limits:** None on free tier
- **Requests:** Unlimited
- **Server:** $5-10/month VPS or run locally for free

### Alternative AI Models

All FREE options available on OpenRouter:

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **Meta Llama 3.3 70B** (current) | Fast (1-3s) | Excellent | General use, high quality |
| Google Gemini Flash 1.5 | Very Fast (<1s) | Excellent | Speed priority |
| DeepSeek Chat | Fast (2-3s) | Very Good | Alternative to Llama |

Switch models by editing `OPENROUTER_MODEL` in `.env`

## 🐛 Troubleshooting

### Common Issues

**"Failed to fetch" / Connection timeout**
```bash
# Check server is running
ps aux | grep node
# OR with PM2
pm2 status

# Check logs
pm2 logs tldr-api
# OR
tail -f /tmp/tldr-api.log

# Verify firewall allows port 8090
sudo ufw status
sudo ufw allow 8090
```

**"API request failed: 404"**
- Check `OPENROUTER_MODEL` in `.env` is correct
- Verify API key is valid at https://openrouter.ai/keys
- Try a different free model

**"No article content found"**
- Click on the article text before summarizing
- Try a different article (yahoo.com/news works well)
- Check browser console for errors (F12)

**Slow summaries (30+ seconds)**
- First request takes longer (model warming up)
- Switch to faster model: `google/gemini-flash-1.5:free`
- Check internet connection speed

**Extension not showing icon**
- Reload extension in `chrome://extensions/`
- Check that all icon files exist in `icons/` folder
- Try removing and reinstalling extension

## 🔮 Future Improvements

- [ ] Browser-based local AI option (no server needed)
- [ ] Multiple language support (Spanish, French, etc.)
- [ ] Export summaries (PDF, Markdown, TXT)
- [ ] Reading list integration
- [ ] Custom prompt templates
- [ ] Text-to-speech for summaries
- [ ] Cross-browser sync (Firefox, Safari)
- [ ] Highlight key sentences on page
- [ ] Summary comparison (different models)
- [ ] Article sentiment analysis
- [ ] Key topics extraction
- [ ] Related articles suggestions

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute
- 🐛 Report bugs via [Issues](https://github.com/RellG/tldr-article-summarizer/issues)
- 💡 Suggest features or improvements
- 🔧 Submit pull requests
- 📖 Improve documentation
- ⭐ Star the repository!

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add AmazingFeature'`
6. Push: `git push origin feature/AmazingFeature`
7. Open a Pull Request

Please update tests and documentation as appropriate.

## 📝 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2025 RellG

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
- [OpenRouter](https://openrouter.ai/) - FREE AI model API gateway
- [Meta Llama 3.3 70B](https://ai.meta.com/llama/) - State-of-the-art language model
- [Express.js](https://expressjs.com/) - Fast, minimalist web framework
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Browser integration
- Design inspiration from modern dark themes

Special thanks to:
- **Meta AI** for open-sourcing Llama models
- **OpenRouter** for providing free access to premium models
- **Chrome Extension Community** for excellent documentation

## 📧 Contact & Support

- **Author:** RellG
- **Email:** tareynolds725@gmail.com
- **GitHub:** [@RellG](https://github.com/RellG)
- **Repository:** [tldr-article-summarizer](https://github.com/RellG/tldr-article-summarizer)
- **Issues:** [Report a bug](https://github.com/RellG/tldr-article-summarizer/issues)

## 🔗 Links

- [Quick Start Guide](QUICKSTART.md) - Get running in 10 minutes
- [Server Config](CLAUDE.md) - Server-wide documentation
- [Releases](https://github.com/RellG/tldr-article-summarizer/releases) - Download packaged extension
- [OpenRouter Docs](https://openrouter.ai/docs) - API documentation
- [Llama Model Info](https://ai.meta.com/llama/) - Model details

---

<div align="center">

**⭐ Star this repo if you find it useful!**

**Version 2.7.0** • Made with 🤖 by [Claude Code](https://claude.com/claude-code)

[⬆ Back to Top](#tldr-article-summarizer)

</div>
