import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import '../styles/Chatbot.css';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hello! I\'m your security assistant. I can help you understand vulnerabilities, strengthen passwords, and resolve security issues. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTopics();
    scrollToBottom();
  }, [messages]);

  const fetchTopics = async () => {
    try {
      const response = await chatAPI.getTopics();
      setTopics(response.data.topics);
    } catch (err) {
      console.error('Failed to fetch topics');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = input) => {
    if (!message.trim()) return;

    setMessages([...messages, { type: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(message);
      const botMessage = response.data.response;

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
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
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
                  <div dangerouslyInnerHTML={{
                    __html: msg.content
                      .split('\n')
                      .map(line => {
                        if (line.startsWith('**')) {
                          return `<strong>${line.replace(/\*\*/g, '')}</strong>`;
                        }
                        if (line.startsWith('•')) {
                          return `<div class="list-item">${line}</div>`;
                        }
                        return line;
                      })
                      .join('<br>')
                  }} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="message bot">
              <div className="typing-indicator">
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

      <div className="input-group">
        <input
          type="text"
          placeholder="Ask me about security issues, vulnerabilities, passwords..."
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
