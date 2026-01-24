import React, { useState } from 'react';
import { passwordAPI } from '../services/api';
import '../styles/PasswordAnalyzer.css';

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [stored, setStored] = useState([]);
  const [userId, setUserId] = useState('user1');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAnalyze = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    try {
      const response = await passwordAPI.analyzePassword(password);
      setAnalysis(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    }
  };

  const handleStore = async () => {
    if (!password || !analysis) {
      setError('Analyze password first');
      return;
    }

    try {
      const response = await passwordAPI.storePassword(password, userId);
      setStored([...stored, response.data]);
      setPassword('');
      setAnalysis(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Storage failed');
    }
  };

  const handleGenerate = async () => {
    try {
      const response = await passwordAPI.generatePassword(16, true);
      setPassword(response.data.password);
      setAnalysis(response.data);
      setError('');
    } catch (err) {
      setError('Failed to generate password');
    }
  };

  const getStrengthColor = (strength) => {
    if (strength < 20) return '#e74c3c';
    if (strength < 40) return '#e67e22';
    if (strength < 60) return '#f39c12';
    if (strength < 80) return '#27ae60';
    return '#2ecc71';
  };

  return (
    <div className="analyzer-container">
      <h2>🔐 Password Strength Analyzer</h2>
      <p>Analyze and securely store strong passwords</p>

      <div className="input-group">
        <div className="password-input-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <button
            className="toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        <button onClick={handleAnalyze} className="btn-primary">
          Analyze
        </button>
        <button onClick={handleGenerate} className="btn-secondary">
          Generate Strong
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {analysis && (
        <div className="analysis-results">
          <div className="strength-meter">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${analysis.strength}%`,
                  backgroundColor: getStrengthColor(analysis.strength)
                }}
              />
            </div>
            <span className="strength-label">{analysis.level}</span>
            <span className="strength-score">{analysis.strength}/100</span>
          </div>

          <div className="details">
            <h3>Entropy: {analysis.entropy} bits</h3>
            <p><strong>Time to crack:</strong> {analysis.timeTocrack}</p>

            <div className="requirements">
              <h4>Requirements:</h4>
              {Object.entries(analysis.requirements).map(([req, met]) => (
                <div key={req} className={`requirement ${met ? 'met' : 'unmet'}`}>
                  <span>{met ? '✅' : '❌'} {req}</span>
                </div>
              ))}
            </div>

            {analysis.feedback && (
              <div className="feedback">
                <h4>Suggestions:</h4>
                {analysis.feedback.map((tip, idx) => (
                  <p key={idx}>💡 {tip}</p>
                ))}
              </div>
            )}

            {analysis.strength >= 60 && (
              <button onClick={handleStore} className="btn-success">
                Store Password Securely
              </button>
            )}
          </div>
        </div>
      )}

      {stored.length > 0 && (
        <div className="stored-passwords">
          <h3>Stored Passwords: {stored.length}</h3>
          {stored.map((pwd, idx) => (
            <div key={idx} className="stored-item">
              <span>Password ID: {pwd.id}</span>
              <span className="strength">Strength: {pwd.strength}/100</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
