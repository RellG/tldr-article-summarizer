const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// CORS configuration for Chrome extension
app.use(cors({
  origin: '*', // Allow all origins for now (will restrict to extension ID later)
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

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
const SITE_URL = process.env.SITE_URL || 'http://localhost:8090';
const SITE_NAME = process.env.SITE_NAME || 'TL;DR Article Summarizer';

// Fallback models in order of preference (all free tier)
const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',    // Primary - best quality
  'google/gemma-2-9b-it:free',                  // Google Gemma 2 - good quality
  'mistralai/mistral-7b-instruct:free',         // Mistral 7B - fast and reliable
  'qwen/qwen-2-7b-instruct:free',               // Qwen 2 - good alternative
  'microsoft/phi-3-mini-128k-instruct:free'     // Phi-3 - Microsoft's efficient model
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
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
    const { content, url, summaryType = 'medium' } = req.body;

    console.log(`[${new Date().toISOString()}] Summarize request - URL: ${url}, Content length: ${content?.length}, Type: ${summaryType}`);

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Limit content length for API efficiency and speed
    const maxLength = 4000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    console.log(`[${new Date().toISOString()}] Truncated to ${truncatedContent.length} chars`);

    // Build prompt based on summary type
    let lengthInstruction;
    switch(summaryType) {
      case 'short':
        lengthInstruction = '2-3 sentences';
        break;
      case 'detailed':
        lengthInstruction = '7-10 sentences';
        break;
      case 'medium':
      default:
        lengthInstruction = '3-5 sentences';
    }

    const systemPrompt = 'You are a helpful assistant that creates clear, concise summaries of articles in paragraph form.';
    const prompt = `Summarize the following article in ${lengthInstruction}, capturing the main points:\n\n${truncatedContent}`;

    // Try models with fallback on rate limit (429) errors
    let result = null;
    let usedModel = OPENROUTER_MODEL;
    let lastError = null;

    // Build list of models to try (primary first, then fallbacks)
    const modelsToTry = [OPENROUTER_MODEL, ...FALLBACK_MODELS.filter(m => m !== OPENROUTER_MODEL)];

    for (const model of modelsToTry) {
      console.log(`[${new Date().toISOString()}] Trying model: ${model}`);

      // Call OpenRouter API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      let response;
      try {
        response = await fetch(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': SITE_URL,
              'X-Title': SITE_NAME
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.3,
              max_tokens: 500
            }),
            signal: controller.signal
          }
        );
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          lastError = new Error('Request timed out. Try with a shorter article or different summary type.');
          continue; // Try next model
        }
        lastError = fetchError;
        continue; // Try next model
      } finally {
        clearTimeout(timeoutId);
      }

      // Check for rate limit (429) - try next model
      if (response.status === 429) {
        const errorText = await response.text();
        console.log(`[${new Date().toISOString()}] Model ${model} rate limited (429), trying next...`);
        lastError = new Error(`Rate limited: ${model}`);
        continue; // Try next model
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        lastError = new Error(`API request failed: ${response.status}`);
        continue; // Try next model
      }

      // Success! Parse result and break
      result = await response.json();
      usedModel = model;
      console.log(`[${new Date().toISOString()}] Success with model: ${model}`);
      break;
    }

    // If all models failed, throw the last error
    if (!result) {
      throw lastError || new Error('All models failed. Please try again later.');
    }

    // Extract summary from response
    const summary = result.choices?.[0]?.message?.content || 'Unable to generate summary';

    const processingTime = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Success! Processed in ${processingTime}ms`);

    res.json({
      summary: summary.trim(),
      originalLength: content.length,
      summaryLength: summary.length,
      url,
      timestamp: new Date().toISOString(),
      model: usedModel
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Error after ${processingTime}ms:`, error.message);
    res.status(500).json({
      error: 'Summarization failed',
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Article Summarizer API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});