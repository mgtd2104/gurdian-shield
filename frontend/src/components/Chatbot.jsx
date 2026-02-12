import React, { useState, useEffect, useRef } from 'react';
import '../styles/Chatbot.css';

const RUNTIME_API_URL = (typeof window !== 'undefined' && window.__API_URL__) ? String(window.__API_URL__) : '';
const API_BASE = (RUNTIME_API_URL || import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hello! I\'m your security assistant. I can help you understand vulnerabilities, strengthen passwords, and resolve security issues. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [scanContext, setScanContext] = useState(null);
  const [useScanContext, setUseScanContext] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTopics();
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastScanResult');
      if (raw) setScanContext(JSON.parse(raw));
    } catch {
      return;
    }
  }, []);

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/topics`);
      const data = await res.json();
      if (data?.topics) {
        setTopics(data.topics);
      }
    } catch (err) {
      console.error('Failed to fetch topics');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = input, forceScan = false) => {
    if (!message.trim()) return;

    setMessages([...messages, { type: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const body = forceScan
        ? { scanResult: scanContext }
        : { message, scanResult: useScanContext ? scanContext : null };

      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('File exceeds 50MB limit.');
        }
        const text = await res.text();
        throw new Error(text || 'Server error');
      }

      const data = await res.json();
      const botMessage = data?.response || {};

      let botContent = botMessage.message || 'I\'m not sure about that topic.';

      if (botMessage.relevant && botMessage.prevention) {
        botContent += '\n\n**Prevention Methods:**\n' +
          botMessage.prevention.map(p => `• ${p}`).join('\n');

        if (botMessage.tools) {
          botContent += '\n\n**Useful Tools:**\n' +
            botMessage.tools.map(t => `• ${t}`).join('\n');
        }

        if (botMessage.examples) {
          botContent += '\n\n**Examples:**\n' +
            botMessage.examples.map(e => `• ${e}`).join('\n');
        }
      }

      setMessages(prev => [...prev, { type: 'bot', content: botContent }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'Guardian Shield is currently in offline mode.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainLastScan = async () => {
    if (!scanContext) {
      setMessages(prev => [...prev, { type: 'bot', content: 'No recent scan result found. Run a scan first, then come back here.' }]);
      return;
    }

    setMessages(prev => [...prev, { type: 'user', content: 'Explain my latest scan results' }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanResult: scanContext })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Server error');
      }

      const data = await res.json();
      const botMessage = data?.response || {};
      const botContent = botMessage.message || 'I could not generate scan advice.';
      setMessages(prev => [...prev, { type: 'bot', content: botContent }]);
    } catch {
      setMessages(prev => [...prev, { type: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <h2>🤖 Security Assistant Chatbot</h2>

      <div className="chat-box">
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.type}`}>
              <div className="message-content">
                {msg.type === 'bot' ? (
                  <div className="bot-message-text">
                    {msg.content.split('\n').map((line, i) => {
                      if (line.startsWith('**')) {
                         // Header
                         return <strong key={i} className="bot-header">{line.replace(/\*\*/g, '')}</strong>;
                      } else if (line.startsWith('•')) {
                         // List item
                         return <div key={i} className="bot-list-item">{line}</div>;
                      } else if (line.trim() === '') {
                         // Empty line
                         return <br key={i} />;
                      } else {
                         // Regular text
                         return <p key={i} className="bot-text">{line}</p>;
                      }
                    })}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="typing-indicator">
                <div className="bot-text">Typing...</div>
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="quick-topics">
        <p>Quick topics:</p>
        <div className="topic-buttons">
          {topics.slice(0, 5).map((topic, idx) => (
            <button
              key={idx}
              className="topic-btn"
              onClick={() => handleSendMessage(`Tell me about ${topic}`)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {scanContext && (
        <div className="quick-topics">
          <p>Scan context:</p>
          <div className="topic-buttons">
            <button className="topic-btn" onClick={handleExplainLastScan} disabled={loading}>
              Explain latest scan
            </button>
            <button
              className="topic-btn"
              onClick={() => setUseScanContext((v) => !v)}
              disabled={loading}
            >
              {useScanContext ? 'Context: ON' : 'Context: OFF'}
            </button>
          </div>
        </div>
      )}

      <div className="input-group">
        <input
          type="text"
          aria-label="Ask about security issues"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="btn-primary"
        >
          Send
        </button>
      </div>
    </div>
  );
}
