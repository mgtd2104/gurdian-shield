import express from 'express';
import { scanForVulnerabilities, scanForViruses } from '../services/scannerService.js';
import { ScanResult, scanStorage } from '../models/ScanResult.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Vulnerability Scanner
router.post('/vulnerabilities', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await scanForVulnerabilities(input);
    const scanRecord = new ScanResult('vulnerability', input, result, result.vulnerabilities);
    scanStorage.push(scanRecord);

    res.json({
      success: true,
      scanId: scanRecord.id,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Virus Scanner
router.post('/virus', async (req, res) => {
  let tempPath;
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file;
    // Use local temp directory to avoid OS path issues
    const tempDir = path.resolve(process.cwd(), 'temp');
    // Ensure temp dir exists (in case it wasn't created)
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const originalName = String(file.name || 'upload');
    const safeName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    tempPath = path.join(tempDir, `${Date.now()}_${safeName}`);

    await file.mv(tempPath);
    const result = await scanForViruses(tempPath);

    if (!result || result.success === false) {
      return res.status(500).json({
        success: false,
        fileName: file.name,
        error: result?.error || 'Virus scan failed'
      });
    }

    const scanRecord = new ScanResult('virus', file.name, result, result.threats);
    scanStorage.push(scanRecord);

    res.json({
      scanId: scanRecord.id,
      ...result,
      fileName: safeName,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (tempPath) {
      fs.promises.unlink(tempPath).catch(() => undefined);
    }
  }
});

// Get scan history
router.get('/history', (req, res) => {
  const history = scanStorage.map(scan => ({
    id: scan.id,
    type: scan.type,
    input: scan.input,
    threatCount: scan.threats.length,
    createdAt: scan.createdAt,
    riskLevel: scan.result.riskLevel
  }));

  res.json({
    success: true,
    history
  });
});

// Get specific scan
router.get('/scan/:id', (req, res) => {
  const scan = scanStorage.find(s => s.id === req.params.id);

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  res.json({
    success: true,
    scan
  });
});

export default router;
