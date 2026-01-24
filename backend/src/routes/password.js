import express from 'express';
import {
  analyzePasswordStrength,
  validatePasswordForStorage,
  hashPassword
} from '../services/passwordService.js';
import { passwordStorage } from '../models/Password.js';

const router = express.Router();

// Analyze password strength
router.post('/analyze', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const analysis = analyzePasswordStrength(password);

    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Store password securely
router.post('/store', (req, res) => {
  try {
    const { password, userId } = req.body;

    if (!password || !userId) {
      return res.status(400).json({ error: 'Password and userId are required' });
    }

    const validation = validatePasswordForStorage(password);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Password does not meet security requirements',
        feedback: validation.analysis.feedback
      });
    }

    const id = Date.now().toString();
    passwordStorage.set(id, {
      userId,
      hash: validation.hash,
      strength: validation.analysis.strength,
      storedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Password stored securely',
      id,
      strength: validation.analysis.strength
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stored passwords (protected)
router.get('/stored/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userPasswords = Array.from(passwordStorage.entries())
      .filter(([_, data]) => data.userId === userId)
      .map(([id, data]) => ({
        id,
        strength: data.strength,
        storedAt: data.storedAt
      }));

    res.json({
      success: true,
      passwords: userPasswords
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate strong password suggestion
router.get('/generate', (req, res) => {
  try {
    const length = parseInt(req.query.length) || 16;
    const useSpecial = req.query.special !== 'false';

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = uppercase + lowercase + numbers;
    if (useSpecial) chars += special;

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const analysis = analyzePasswordStrength(password);

    res.json({
      success: true,
      password,
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
