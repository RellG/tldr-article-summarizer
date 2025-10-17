const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' })); // Increased for video transcripts

// CORS configuration for Chrome extension
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Simple rate limiting (in-memory, per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(ip) || [];

  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recentRequests);
    }
  }
}, 5 * 60 * 1000);

// OpenRouter API Configuration for Media
const OPENROUTER_API_KEY_MEDIA = process.env.OPENROUTER_API_KEY_MEDIA || process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL_MEDIA = process.env.OPENROUTER_MODEL_MEDIA || 'google/gemini-flash-2.0-exp:free';
const SITE_URL = process.env.SITE_URL || 'http://192.168.4.154:8091';
const SITE_NAME = 'RecapIt Media Summarizer';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RecapIt Media Summarizer',
    timestamp: new Date().toISOString()
  });
});

// Multi-media summarization endpoint (YouTube, Podcasts, Videos)
app.post('/api/summarize-media', async (req, res) => {
  const startTime = Date.now();

  // Get client IP for rate limiting
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    console.log(`[${new Date().toISOString()}] Rate limit exceeded for IP: ${clientIP}`);
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before trying again.',
      retryAfter: 60
    });
  }

  try {
    const { content, url, summaryType = 'medium', type = 'video', metadata = {} } = req.body;

    console.log(`[${new Date().toISOString()}] Media summarize request - Type: ${type}, URL: ${url}, Content length: ${content?.length}, Summary: ${summaryType}`);

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!OPENROUTER_API_KEY_MEDIA) {
      return res.status(500).json({ error: 'OpenRouter API key not configured for media' });
    }

    // Content length limits based on media type
    const maxLengths = {
      article: 4000,
      youtube: 12000,
      podcast: 15000,
      video: 10000
    };
    const maxLength = maxLengths[type] || 10000;

    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    console.log(`[${new Date().toISOString()}] Content truncated to ${truncatedContent.length} chars for type: ${type}`);

    // Build system prompt based on media type
    let systemPrompt;
    switch(type) {
      case 'youtube':
        systemPrompt = 'You are an expert at summarizing YouTube videos from transcripts. Focus on key points, main arguments, and actionable insights. Provide summaries in clear paragraph form.';
        break;
      case 'podcast':
        systemPrompt = 'You are an expert at summarizing podcast episodes. Capture the main discussion topics, key takeaways, and interesting insights. Provide summaries in clear paragraph form.';
        break;
      case 'video':
        systemPrompt = 'You are an expert at summarizing video content. Focus on the main message, important points, and key information. Provide summaries in clear paragraph form.';
        break;
      case 'article':
        systemPrompt = 'You are an expert at summarizing articles. Provide clear, concise summaries in paragraph form without bullet points.';
        break;
      default:
        systemPrompt = 'You are an expert at summarizing content clearly and concisely. Provide summaries in paragraph form.';
    }

    // Build user prompt based on summary type
    let lengthInstruction;
    switch(summaryType) {
      case 'short':
        lengthInstruction = '2-3 concise sentences';
        break;
      case 'detailed':
        lengthInstruction = '8-12 sentences covering all key points';
        break;
      case 'medium':
      default:
        lengthInstruction = '4-6 clear sentences';
    }

    // Build contextual prompt with metadata
    let contextInfo = '';
    if (metadata.title) {
      contextInfo += `Title: ${metadata.title}\n`;
    }
    if (metadata.duration) {
      contextInfo += `Duration: ${metadata.duration}\n`;
    }
    if (metadata.channel || metadata.show) {
      contextInfo += `Source: ${metadata.channel || metadata.show}\n`;
    }

    const userPrompt = `Summarize this ${type} content in ${lengthInstruction}:

${contextInfo ? contextInfo + '\n' : ''}Content:
${truncatedContent}`;

    // Call OpenRouter API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for longer content

    let response;
    try {
      response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY_MEDIA}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': SITE_URL,
            'X-Title': SITE_NAME
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL_MEDIA,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 600 // More tokens for detailed summaries
          }),
          signal: controller.signal
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Try with shorter content or different summary type.');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();

    // Extract summary from response
    const summary = result.choices?.[0]?.message?.content || 'Unable to generate summary';

    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Success! Media type: ${type}, Processed in ${processingTime}ms`);

    res.json({
      summary: summary.trim(),
      originalLength: content.length,
      summaryLength: summary.length,
      type,
      url,
      metadata,
      timestamp: new Date().toISOString(),
      model: OPENROUTER_MODEL_MEDIA
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${processingTime}ms:`, error.message);
    res.status(500).json({
      error: 'Media summarization failed',
      message: error.message
    });
  }
});

const PORT = process.env.PORT_MEDIA || 8091;
app.listen(PORT, () => {
  console.log(`RecapIt Media Summarizer API running on port ${PORT}`);
  console.log(`Endpoint: POST /api/summarize-media`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Model: ${OPENROUTER_MODEL_MEDIA}`);
});
