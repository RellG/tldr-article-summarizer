const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'facebook/bart-large-cnn';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { content, url, summaryType = 'medium' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!HUGGINGFACE_TOKEN) {
      return res.status(500).json({ error: 'Hugging Face token not configured' });
    }

    // Limit content length - BART has a max of ~1024 tokens
    const maxLength = 4000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;

    // Adjust parameters based on summary type
    let maxSummaryLength, minSummaryLength;
    switch(summaryType) {
      case 'short':
        minSummaryLength = 30;
        maxSummaryLength = 80;
        break;
      case 'detailed':
        minSummaryLength = 150;
        maxSummaryLength = 300;
        break;
      case 'medium':
      default:
        minSummaryLength = 60;
        maxSummaryLength = 150;
    }

    // Call Hugging Face API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: truncatedContent,
          parameters: {
            max_length: maxSummaryLength,
            min_length: minSummaryLength,
            do_sample: false
          }
        })
      }
    );

    const result = await response.json();

    // Handle Hugging Face API errors
    if (result.error) {
      console.error('Hugging Face error:', result.error);

      // Model is loading
      if (result.error.includes('loading')) {
        const estimatedTime = result.estimated_time || 20;
        return res.status(503).json({
          error: 'Model is loading',
          message: `Model is warming up. Please try again in ${estimatedTime} seconds.`,
          estimatedTime
        });
      }

      throw new Error(result.error);
    }

    // Extract summary from response
    let summary = result[0]?.summary_text || result.summary_text || 'Unable to generate summary';

    // Format as bullet points for medium/detailed
    if (summaryType !== 'short' && !summary.includes('•') && !summary.includes('-')) {
      const sentences = summary.match(/[^.!?]+[.!?]+/g) || [summary];
      summary = sentences.map(s => `• ${s.trim()}`).join('\n');
    }

    res.json({
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      url,
      timestamp: new Date().toISOString(),
      model: HUGGINGFACE_MODEL
    });

  } catch (error) {
    console.error('Error:', error);
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