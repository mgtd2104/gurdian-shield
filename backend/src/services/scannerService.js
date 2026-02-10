import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH = path.join(__dirname, '../engine');

export async function scanForVulnerabilities(input) {
  const isUrl = input.startsWith('http://') || input.startsWith('https://');

  if (isUrl) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [path.join(ENGINE_PATH, 'web_scanner.py'), input]);
      let dataString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`Scanner Error: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: "Failed to parse scanner output", threats: [] });
        }
      });
    });
  } else {
    // Legacy/Project Scan (Not fully implemented in Python yet, keeping JS fallback or pointing to file scanner if single file)
    return { success: false, error: "Directory scan not supported in this version", threats: [] };
  }
}

export async function scanForViruses(filePath) {
   return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [path.join(ENGINE_PATH, 'file_analyzer.py'), filePath]);
      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const s = data.toString();
        errorString += s;
        console.error(`Analyzer Error: ${s}`);
      });

      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(dataString);
          resolve(result);
        } catch (e) {
          resolve({
            success: false,
            error: `Failed to parse analyzer output${errorString ? `: ${errorString.trim().slice(0, 400)}` : ''}`,
            exitCode: code,
            threats: []
          });
        }
      });
    });
}

