import React, { useState } from 'react';
import { scannerAPI, chatAPI } from '../services/api';
import '../styles/VirusScanner.css';

export default function VirusScanner() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [remediation, setRemediation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getMaxUploadBytes = () => {
    const hostname = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '';
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
  };

  const formatRemediationMessage = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      if (typeof value.message === 'string') return value.message;
      try {
        return JSON.stringify(value);
      } catch {
        return 'Remediation details unavailable.';
      }
    }
    return 'Remediation details unavailable.';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const maxBytes = getMaxUploadBytes();
      if (selectedFile.size > maxBytes) {
        const mb = Math.floor(maxBytes / (1024 * 1024));
        setError(`File size exceeds ${mb}MB limit`);
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
    setResults(null);
    setRemediation(null);

    try {
      const response = await scannerAPI.scanVirus(file);
      const data = response?.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid scan response');
      }

      if (data.success === false) {
        throw new Error(data.error || 'Scan failed');
      }

      setResults({
        ...data,
        threats: Array.isArray(data.threats) ? data.threats : [],
        threatCount: typeof data.threatCount === 'number' ? data.threatCount : (Array.isArray(data.threats) ? data.threats.length : 0),
        isSafe: typeof data.isSafe === 'boolean' ? data.isSafe : !(Array.isArray(data.threats) && data.threats.length > 0)
      });

      // Get remediation advice from Chatbot if threats found
      if (Array.isArray(data.threats) && data.threats.length > 0) {
        try {
            // Adapt structure for chatbot: expected { vulnerabilities: [{ type: ... }] }
            const scanResultForChat = {
                ...data,
                vulnerabilities: data.threats.map(t => ({ type: t.type }))
            };
            const chatResponse = await chatAPI.remediate(scanResultForChat);
            setRemediation(chatResponse.data);
        } catch (chatErr) {
            console.error("Failed to get remediation", chatErr);
        }
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-container">
      <h2>🦠 Virus Scanner</h2>
      <p>Upload files to scan for potential malware, viruses, and malicious hashes</p>

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
        {loading ? 'Scanning (checking hashes & patterns)...' : 'Scan File'}
      </button>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results">
          <div className={`risk-badge ${typeof results.riskLevel === 'string' ? results.riskLevel.toLowerCase() : ''}`}>
            {results.isSafe ? '✅ SAFE' : `⚠️ ${results.riskLevel}`}
          </div>

          <div className="file-info">
            <p><strong>File:</strong> {results.fileName || file?.name || 'Uploaded file'}</p>
            <p><strong>Threats Found:</strong> {typeof results.threatCount === 'number' ? results.threatCount : (results.threats?.length || 0)}</p>
          </div>

          {Array.isArray(results.threats) && results.threats.length > 0 ? (
            <div className="threats">
              <h3>Detected Threats</h3>
              {results.threats.map((threat, idx) => (
                <div key={idx} className={`threat-item ${threat.risk}`}>
                  <div className="threat-header">
                     <strong>{threat.type}</strong>
                     <span className="risk-badge-small">{threat.risk}</span>
                  </div>
                  <p>{threat.description}</p>
                </div>
              ))}

              {remediation && remediation.remediation && (
                  <div className="remediation-section">
                      <h3>🤖 Chatbot Remediation Advice</h3>
                      {remediation.remediation.map((item, idx) => (
                          <div key={idx} className="remediation-card">
                              <h4>How to Fix: {item.topic}</h4>
                              <p>{formatRemediationMessage(item.message)}</p>
                              {Array.isArray(item.prevention) && item.prevention.length > 0 && (
                                  <ul>
                                      {item.prevention.map((prev, pIdx) => (
                                          <li key={pIdx}>{typeof prev === 'string' ? prev : formatRemediationMessage(prev)}</li>
                                      ))}
                                  </ul>
                              )}
                          </div>
                      ))}
                  </div>
              )}

            </div>
          ) : (
            <div className="success-message">
                <h3>No threats detected!</h3>
                <p>File appears safe. No malicious patterns or known hashes found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
