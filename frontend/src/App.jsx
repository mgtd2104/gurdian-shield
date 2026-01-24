import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('vulnerability');

  // ✅ Vulnerability Scanner demo logic
  const VulnerabilityScanner = () => {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState('');

    const scanUrl = () => {
      if (!url) {
        setResult('Please enter a URL to scan.');
        return;
      }
      if (url.includes("testphp.vulnweb.com")) {
        setResult("⚠️ Vulnerabilities found: SQL Injection, XSS");
      } else {
        setResult("✅ No major vulnerabilities detected (demo result)");
      }
    };

    return (
      <div className="box-container">
        <h2>Vulnerability Scanner</h2>
        <p>Enter a website URL to check for common vulnerabilities</p>
        <div className="box-input">
          <input
            type="text"
            placeholder="Enter website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <button className="scan-btn" onClick={scanUrl}>Scan</button>
        {result && <div className="analysis-results"><p>{result}</p></div>}
      </div>
    );
  };

  // ✅ Virus Scanner demo logic
  const VirusScanner = () => {
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState('');

    const handleFileChange = (e) => {
      if (e.target.files.length > 0) {
        setFileName(e.target.files[0].name);
        setResult('');
      }
    };

    const scanFile = () => {
      if (!fileName) {
        setResult('Please select a file first.');
        return;
      }
      if (fileName.toLowerCase().includes("test")) {
        setResult("⚠️ Potential malware detected in " + fileName);
      } else {
        setResult("✅ " + fileName + " is clean (demo result)");
      }
    };

    return (
      <div className="box-container">
        <h2>Virus Scanner</h2>
        <p>Upload files to scan for potential malware and viruses</p>
        <div className="box-input">
          <input type="file" onChange={handleFileChange} />
        </div>
        <button className="scan-btn" onClick={scanFile}>Scan File</button>
        {result && <div className="analysis-results"><p>{result}</p></div>}
      </div>
    );
  };

  // ✅ Password Analyzer logic (unchanged)
  const PasswordAnalyzer = () => {
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState('');
    const [score, setScore] = useState(0);

    const analyzePassword = () => {
      let s = 0;
      if (password.length >= 8) s++;
      if (/[A-Z]/.test(password)) s++;
      if (/[0-9]/.test(password)) s++;
      if (/[^A-Za-z0-9]/.test(password)) s++;

      setScore(s);

      if (s <= 1) setStrength('Weak ❌');
      else if (s === 2) setStrength('Moderate ⚠️');
      else if (s >= 3) setStrength('Strong ✅');
    };

    return (
      <div className="box-container">
        <h2>Password Strength Analyzer</h2>
        <p>Analyze and securely store strong passwords</p>

        <div className="box-input">
          <input
            type="text"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="scan-btn" onClick={analyzePassword}>Analyze</button>

        <div className="analysis-results">
          <div className="strength-bar">
            <div
              className="strength-fill"
              style={{
                width: `${(score / 4) * 100}%`,
                background: score <= 1 ? '#e74c3c' : score === 2 ? '#f1c40f' : '#27ae60'
              }}
            ></div>
          </div>
          <p>{strength}</p>
        </div>
      </div>
    );
  };

  // ✅ Password Manager logic (unchanged)
  const PasswordManager = () => {
    const [storedPasswords, setStoredPasswords] = useState([]);

    const addPassword = () => {
      const newPass = prompt("Enter a password to store:");
      if (newPass) {
        setStoredPasswords([...storedPasswords, newPass]);
      }
    };

    return (
      <div className="box-container">
        <h2>Password Manager</h2>
        <p>Securely store and manage your passwords</p>

        <button className="scan-btn" onClick={addPassword}>Add Password</button>

        <div className="stored-passwords">
          {storedPasswords.length === 0 ? (
            <p>No passwords stored yet.</p>
          ) : (
            storedPasswords.map((pass, idx) => (
              <div key={idx} className="stored-item">
                <span>{pass}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // ✅ Security Chat demo logic
  const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = () => {
      if (!input) return;
      setMessages([...messages, { from: 'user', text: input }, { from: 'bot', text: "Demo reply: I received '" + input + "'" }]);
      setInput('');
    };

    return (
      <div className="box-container">
        <h2>Security Chat</h2>
        <p>Ask security questions and get instant answers (demo)</p>
        <div className="box-input">
          <input
            type="text"
            placeholder="Type your question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="scan-btn" onClick={sendMessage}>Send</button>
        <div className="stored-passwords">
          {messages.map((msg, idx) => (
            <div key={idx} className="stored-item">
              <span><b>{msg.from}:</b> {msg.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ✅ Tab rendering
  const renderContent = () => {
    switch (activeTab) {
      case 'vulnerability':
        return <VulnerabilityScanner />;
      case 'virus':
        return <VirusScanner />;
      case 'password':
        return <PasswordAnalyzer />;
      case 'password-manager':
        return <PasswordManager />;
      case 'chat':
        return <Chatbot />;
      default:
        return <VulnerabilityScanner />;
    }
  };

  return (
    <div className="app">
      {/* Background video */}
      <video autoPlay muted loop playsInline className="background-video">
        <source src="background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src="logo.png" alt="Guardian Shield Logo" className="logo" />
            <div className="title-section">
              <h1>🛡️ Guardian Shield</h1>
              <p>Your Complete Security Scanning & Analysis Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="navigation">
        <button
          className={`nav-btn ${activeTab === 'vulnerability' ? 'active' : ''}`}
          onClick={() => setActiveTab('vulnerability')}
        >
          🔍 Vulnerability Scanner
        </button>
        <button
          className={`nav-btn ${activeTab === 'virus' ? 'active' : ''}`}
          onClick={() => setActiveTab('virus')}
        >
          🦠 Virus Scanner
        </button>
        <button
          className={`nav-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          🔐 Password Analyzer
        </button>
        <button
          className={`nav-btn ${activeTab === 'password-manager' ? 'active' : ''}`}
          onClick={() => setActiveTab('password-manager')}
        >
          🔑 Password Manager
        </button>
        <button
          className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          🤖 Security Chat
        </button>
      </nav>

      {/* Main content */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Guardian Shield - Your Security, Our Priority - by: mohit</p>
      </footer>
    </div>
  );
}

export default App;