import React, { useState } from 'react';
import './App.css';
import VulnerabilityScanner from './components/VulnerabilityScanner';
import VirusScanner from './components/VirusScanner';
import PasswordAnalyzer from './components/PasswordAnalyzer';
import Chatbot from './components/Chatbot';

function App() {
  const [activeTab, setActiveTab] = useState('vulnerability');

  const renderContent = () => {
    switch (activeTab) {
      case 'vulnerability':
        return <VulnerabilityScanner />;
      case 'virus':
        return <VirusScanner />;
      case 'password':
        return <PasswordAnalyzer />;
      case 'chat':
        return <Chatbot />;
      default:
        return <VulnerabilityScanner />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🛡️ Guardian Shield</h1>
          <p>Your Complete Security Scanning & Analysis Platform</p>
        </div>
      </header>

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
          className={`nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          🤖 Security Chat
        </button>
      </nav>

      <main className="main-content">
        {renderContent()}
      </main>

      <footer className="footer">
        <p>&copy; 2024 Guardian Shield - Your Security, Our Priority</p>
      </footer>
    </div>
  );
}

export default App;
