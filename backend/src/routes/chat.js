import express from 'express';
import { chatbot } from '../services/chatbotService.js';

const router = express.Router();

// Chat endpoint
router.post('/message', async (req, res) => {
  try {
    const { message, scanResult } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get advice based on message
    const advice = await chatbot.getAdvice(message);

    res.json({
      success: true,
      response: advice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get scan remediation
router.post('/remediate', async (req, res) => {
  try {
    const { scanResult } = req.body;

    if (!scanResult) {
      return res.status(400).json({ error: 'Scan result is required' });
    }

    const response = await chatbot.generateScanResponse(scanResult);

    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge base topics
router.get('/topics', async (req, res) => {
  try {
    const topics = Object.keys(chatbot.knowledgeBase);

    res.json({
      success: true,
      topics,
      count: topics.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific topic
router.get('/topic/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const advice = await chatbot.getAdvice(name);

    if (!advice.relevant) {
      return res.status(404).json({
        error: 'Topic not found',
        message: advice.message
      });
    }

    res.json({
      success: true,
      ...advice
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
