const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// OpenRouter API Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1';
const SITE_URL = process.env.SITE_URL || 'http://192.168.4.154:8090';
const SITE_NAME = process.env.SITE_NAME || 'TL;DR Article Summarizer';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  const startTime = Date.now();
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
    let prompt;
    switch(summaryType) {
      case 'short':
        prompt = `Summarize the following article in 2-3 concise sentences:\n\n${truncatedContent}`;
        break;
      case 'detailed':
        prompt = `Provide a detailed summary of the following article in 7-10 sentences, covering all key points:\n\n${truncatedContent}`;
        break;
      case 'medium':
      default:
        prompt = `Summarize the following article in 3-5 clear sentences, capturing the main points:\n\n${truncatedContent}`;
    }

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
            model: OPENROUTER_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates clear, concise summaries of articles. Provide summaries in paragraph form without bullet points.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 400
          }),
          signal: controller.signal
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out. Try with a shorter article or different summary type.');
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
    console.log(`[${new Date().toISOString()}] Success! Processed in ${processingTime}ms`);

    res.json({
      summary: summary.trim(),
      originalLength: content.length,
      summaryLength: summary.length,
      url,
      timestamp: new Date().toISOString(),
      model: OPENROUTER_MODEL
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