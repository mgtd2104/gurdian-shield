# Guardian Shield - Security Scanning Platform

A comprehensive web-based security scanning and analysis platform featuring vulnerability detection, virus scanning, password strength analysis, and an AI-powered security chatbot.

## Features

### 🔍 Vulnerability Scanner
- Scan URLs for common web vulnerabilities
- Analyze source code for security issues
- Detect SQL injection, XSS, path traversal, and more
- Real-time vulnerability reporting

### 🦠 Virus Scanner
- Upload and scan files for malware patterns
- File signature detection
- Malware pattern recognition
- Instant threat assessment

### 🔐 Password Strength Analyzer
- Analyze password strength with detailed feedback
- Entropy calculation
- Time-to-crack estimation
- Secure password generation
- Safe password storage

### 🤖 Security Assistant Chatbot
- Interactive chatbot for security guidance
- Knowledge base with solutions for common vulnerabilities
- Prevention methods and best practices
- Tool recommendations
- Real-time remediation advice

## Tech Stack

**Backend:** Node.js, Express.js, Socket.io
**Frontend:** React 18, Vite, Axios

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Core Features

1. **Vulnerability Scanning** - Detect code vulnerabilities in URLs and files
2. **Virus Scanning** - Upload files to scan for malware patterns
3. **Password Analysis** - Analyze strength with entropy calculation and time-to-crack estimates
4. **Security Chatbot** - Get expert guidance on security issues and remediation

## API Endpoints

- `POST /api/scanner/vulnerabilities` - Scan for vulnerabilities
- `POST /api/scanner/virus` - Scan file for viruses
- `POST /api/password/analyze` - Analyze password strength
- `POST /api/password/store` - Store password securely
- `POST /api/chat/message` - Chat with security assistant

## Project Structure

```
guardian-shield/
├── backend/          # Express.js API server
├── frontend/         # React.js web application
└── README.md
```

**Guardian Shield** - Your Complete Security Scanning & Analysis Platform