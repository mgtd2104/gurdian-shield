import express from 'express';
import { PasswordManagerService } from '../services/passwordManagerService.js';

const router = express.Router();

// Add new password entry
router.post('/add', (req, res) => {
  try {
    const { userId, site, username, password, notes } = req.body;

    if (!userId || !site || !username || !password) {
      return res.status(400).json({ error: 'userId, site, username, and password are required' });
    }

    const entry = PasswordManagerService.addEntry(userId, site, username, password, notes);

    res.json({
      success: true,
      message: 'Password entry added successfully',
      entry: {
        id: entry.id,
        site: entry.site,
        username: entry.username,
        notes: entry.notes,
        createdAt: entry.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all entries for user
router.get('/entries/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const entries = PasswordManagerService.getEntries(userId);

    res.json({
      success: true,
      entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific entry with password
router.get('/entry/:userId/:entryId', (req, res) => {
  try {
    const { userId, entryId } = req.params;
    const entry = PasswordManagerService.getEntry(userId, entryId);

    res.json({
      success: true,
      entry
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Update entry
router.put('/update/:entryId', (req, res) => {
  try {
    const { entryId } = req.params;
    const { userId, site, username, password, notes } = req.body;

    if (!userId || !site || !username || !password) {
      return res.status(400).json({ error: 'userId, site, username, and password are required' });
    }

    const entry = PasswordManagerService.updateEntry(userId, entryId, site, username, password, notes);

    res.json({
      success: true,
      message: 'Password entry updated successfully',
      entry: {
        id: entry.id,
        site: entry.site,
        username: entry.username,
        notes: entry.notes,
        updatedAt: entry.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entry
router.delete('/delete/:userId/:entryId', (req, res) => {
  try {
    const { userId, entryId } = req.params;
    const deleted = PasswordManagerService.deleteEntry(userId, entryId);

    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({
      success: true,
      message: 'Password entry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search entries
router.get('/search/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const entries = PasswordManagerService.searchEntries(userId, q);

    res.json({
      success: true,
      entries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;