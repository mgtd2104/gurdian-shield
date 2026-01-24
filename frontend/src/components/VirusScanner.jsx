import React, { useState } from 'react';
import { scannerAPI } from '../services/api';
import '../styles/VirusScanner.css';

export default function VirusScanner() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError('Please select a file to scan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await scannerAPI.scanVirus(file);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <h2>🦠 Virus Scanner</h2>
      <p>Upload files to scan for potential malware and viruses</p>

      <div className="file-upload">
        <label htmlFor="file-input" className="file-label">
          {file ? `Selected: ${file.name}` : '📁 Click to select file'}
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          className="file-input"
        />
      </div>

      <button onClick={handleScan} disabled={loading || !file} className="btn-primary">
        {loading ? 'Scanning...' : 'Scan File'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results">
          <div className={`risk-badge ${results.riskLevel?.toLowerCase()}`}>
            {results.isSafe ? '✅ SAFE' : `⚠️ ${results.riskLevel}`}
          </div>

          <div className="file-info">
            <p><strong>File:</strong> {results.fileName}</p>
            <p><strong>Threats Found:</strong> {results.threatCount}</p>
          </div>

          {results.threats && results.threats.length > 0 ? (
            <div className="threats">
              <h3>Detected Threats</h3>
              {results.threats.map((threat, idx) => (
                <div key={idx} className={`threat-item ${threat.risk}`}>
                  <strong>{threat.type}</strong>
                  <span className="risk-badge-small">{threat.risk}</span>
                  <p>{threat.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="success-message">No threats detected!</div>
          )}
        </div>
      )}
    </div>
  );
}
