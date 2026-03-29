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

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Fallback models in order of preference
const FALLBACK_MODELS = [
  'gpt-4o-mini',   // Primary - fast, cheap, great for summarization
  'gpt-3.5-turbo', // Fallback if 4o-mini is rate limited
  'gpt-4o'         // Last resort
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
    const { content, url, summaryType = 'medium', focus = '' } = req.body;

    console.log(`[${new Date().toISOString()}] Summarize request - URL: ${url}, Content length: ${content?.length}, Type: ${summaryType}`);

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Limit content length for API efficiency and speed
    const maxLength = 10000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    console.log(`[${new Date().toISOString()}] Truncated to ${truncatedContent.length} chars`);

    // Build prompt based on summary type
    let lengthInstruction;
    let systemPrompt = 'You are a helpful assistant that creates clear, concise summaries of articles in paragraph form.';
    switch(summaryType) {
      case 'short':
        lengthInstruction = '2-3 sentences';
        break;
      case 'detailed':
        lengthInstruction = '7-10 sentences';
        break;
      case 'bullets':
        lengthInstruction = 'as 4-6 concise bullet points. Start each bullet with "• "';
        systemPrompt = 'You are a helpful assistant that creates clear, concise bullet-point summaries of articles.';
        break;
      case 'medium':
      default:
        lengthInstruction = '3-5 sentences';
    }

    const focusClause = focus ? ` Focus especially on: ${focus}.` : '';
    const prompt = `Summarize the following article in ${lengthInstruction}, capturing the main points.${focusClause}\n\n${truncatedContent}`;

    // Try models with fallback on rate limit (429) errors
    let lastError = null;

    // Build list of models to try (primary first, then fallbacks)
    const modelsToTry = [OPENAI_MODEL, ...FALLBACK_MODELS.filter(m => m !== OPENAI_MODEL)];

    for (const model of modelsToTry) {
      console.log(`[${new Date().toISOString()}] Trying model: ${model}`);

      // Call OpenAI API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      let response;
      try {
        response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 500,
              stream: true
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
        console.error('OpenAI API error:', response.status, errorText);
        lastError = new Error(`API request failed: ${response.status}`);
        continue; // Try next model
      }

      // Success — stream response to client
      console.log(`[${new Date().toISOString()}] Streaming from model: ${model}`);
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let streamBuf = '';
      let summaryText = '';

      try {
        for await (const chunk of response.body) {
          streamBuf += chunk.toString();
          const lines = streamBuf.split('\n');
          streamBuf = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const token = JSON.parse(data).choices?.[0]?.delta?.content;
              if (token) {
                summaryText += token;
                res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
              }
            } catch (e) { /* skip malformed chunk */ }
          }
        }
      } catch (streamErr) {
        console.error(`[${new Date().toISOString()}] Stream error:`, streamErr.message);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Streamed in ${processingTime}ms`);
      res.write(`data: ${JSON.stringify({ done: true, model, originalLength: content.length, processingTime })}\n\n`);
      res.end();
      return;
    }

    // All models failed
    throw lastError || new Error('All models failed. Please try again later.');

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