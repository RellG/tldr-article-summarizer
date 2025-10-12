# Privacy Policy for TL;DR Article Summarizer

**Effective Date:** October 12, 2025
**Last Updated:** October 12, 2025

## Introduction

TL;DR Article Summarizer ("we", "our", or "the Extension") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our Chrome extension.

## Information We Collect

### Article Content
When you use the Extension to summarize an article, we collect and process:
- **Article text content** that you choose to summarize
- **Source URL** of the article (optional, for reference only)
- **Summary length preference** (short, medium, or detailed)

This content is sent to our API server at `api.terravirtual.cfd` for processing by our AI model (Meta Llama 3.3 70B via OpenRouter).

### Settings & Preferences
We store the following locally on your device using Chrome's storage API:
- **Theme preference** (dark or light mode)
- **Default summary length** preference
- **Recent summaries cache** (last 20 summaries, stored locally only)

## Information We DO NOT Collect

We do NOT collect, store, or track:
- ❌ Personal information (name, email, phone number)
- ❌ Browsing history
- ❌ User accounts or login credentials
- ❌ Payment information
- ❌ Cookies or tracking pixels
- ❌ Analytics or usage statistics
- ❌ IP addresses (beyond temporary rate limiting)
- ❌ Device information

## How We Use Your Information

### Article Summarization
- Article content is sent to our API server for AI summarization only
- Content is processed by OpenRouter's AI API (Meta Llama 3.3 70B model)
- **Content is NOT stored permanently** on our servers
- Content is NOT shared with third parties (except OpenRouter for processing)
- Content is NOT used for training AI models

### Rate Limiting
- We temporarily store IP addresses for rate limiting purposes (10 requests/minute)
- IP data is automatically deleted after 5 minutes
- This prevents abuse and ensures fair usage for all users

### Local Storage
- Your settings and recent summaries are stored locally on your device only
- We have NO access to this local data
- You can clear this data anytime via Chrome's extension settings

## Third-Party Services

### OpenRouter API
We use OpenRouter (https://openrouter.ai) to access AI models for summarization. When you summarize an article:
- Article content is sent to OpenRouter's API
- OpenRouter processes it using Meta Llama 3.3 70B
- OpenRouter's privacy policy applies: https://openrouter.ai/privacy

**Important:** OpenRouter states they do NOT use customer data to train models.

### No Other Third Parties
We do NOT use:
- Google Analytics or any analytics service
- Advertising networks
- Social media tracking
- Third-party cookies

## Data Storage & Retention

### Server-Side
- Article content is processed in real-time and NOT stored
- API requests are logged temporarily for error debugging (< 24 hours)
- No permanent database of user content exists

### Client-Side (Your Device)
- Theme preferences: Stored indefinitely in Chrome sync storage
- Summary cache: Last 20 summaries stored locally, automatically rotated
- You can clear all local data via Chrome → Settings → Extensions → TL;DR → Remove

## Data Security

We implement industry-standard security measures:
- ✅ **HTTPS/TLS encryption** for all API communications
- ✅ **Rate limiting** to prevent abuse
- ✅ **No authentication required** (no passwords to compromise)
- ✅ **Minimal data collection** (only what's necessary)
- ✅ **Hosted on Railway** with enterprise-grade security

## Your Rights & Control

You have complete control over your data:

### View Your Data
- All stored data is on your device (Chrome storage)
- View via Chrome DevTools → Application → Storage

### Delete Your Data
```
Option 1: Clear extension data
Chrome → Extensions → TL;DR → Remove extension

Option 2: Clear storage only
Chrome → Extensions → TL;DR → Details → Site settings → Clear data
```

### Opt-Out
Simply uninstall the extension to stop all data processing.

## Children's Privacy

This Extension is not directed at children under 13. We do not knowingly collect information from children. If you are a parent and believe your child has used this Extension, please contact us.

## Changes to Privacy Policy

We may update this Privacy Policy occasionally. Changes will be posted with a new "Last Updated" date. Continued use of the Extension after changes constitutes acceptance.

## Open Source & Transparency

This Extension is open source:
- **Source Code:** https://github.com/RellG/tldr-article-summarizer
- **Backend Code:** Publicly available in repository
- **Audit:** Anyone can review our code to verify privacy claims

## Contact Us

If you have questions about this Privacy Policy:

- **Email:** tareynolds725@gmail.com
- **GitHub Issues:** https://github.com/RellG/tldr-article-summarizer/issues
- **Developer:** RellG

## Legal Compliance

This Extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) principles

## Summary (TL;DR of Privacy Policy 😊)

**What we collect:**
- Article text you choose to summarize (processed, not stored)
- Your theme preference (stored on your device)

**What we DON'T collect:**
- Personal information
- Browsing history
- Analytics or tracking data

**Your data:**
- Processed in real-time, not stored permanently
- Settings stored locally on your device only
- You can delete everything by uninstalling

**We respect your privacy. Period.**

---

**Version:** 1.0
**Effective:** October 12, 2025
**Contact:** tareynolds725@gmail.com

© 2025 RellG. All rights reserved.
