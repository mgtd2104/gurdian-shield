# Guardian Shield - Development Guide

## Quick Start

### Option 1: Using NPM (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # Only needed once
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # Only needed once
npm run dev
```

Then open: http://localhost:5173

### Option 2: Using Docker Compose

```bash
docker-compose up
```

Then open: http://localhost:5173

## Project Features

### 1. Vulnerability Scanner 🔍
- **Input:** URL or file path
- **Detection:** SQL Injection, XSS, Path Traversal, etc.
- **Output:** Risk level, detailed vulnerabilities

**Example:**
- Scan: `http://vulnerable-site.com/page.php?id=1' OR '1'='1`
- Result: SQL Injection detected - HIGH severity

### 2. Virus Scanner 🦠
- **Input:** Upload any file
- **Detection:** Malware patterns, file signatures
- **Output:** Threat assessment, risk level

**Example:**
- Upload a suspicious .exe file
- Result: Potential trojan pattern detected

### 3. Password Analyzer 🔐
- **Input:** Any password
- **Analysis:** 
  - Strength score (0-100)
  - Entropy bits
  - Time to crack
  - Requirements met
- **Generation:** Create strong random passwords
- **Storage:** Securely store analyzed passwords

**Example:**
- Input: `Tr0p!cal$Sunset#2024`
- Result: Very Strong (92/100), ~2000 years to crack

### 4. Security Chatbot 🤖
- **Topics:** SQL Injection, XSS, Password Security, HTTPS, Command Injection, Path Traversal
- **Guidance:** Prevention methods, tools, examples
- **Context:** Learns from scan results

**Example:**
- Question: "Tell me about SQL injection"
- Response: Prevention methods, examples, recommended tools

## File Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── scanner.js      # Vulnerability & virus scanning endpoints
│   │   ├── password.js     # Password analysis endpoints
│   │   └── chat.js         # Chatbot endpoints
│   ├── services/
│   │   ├── scannerService.js   # Scanning logic
│   │   ├── passwordService.js  # Password analysis
│   │   └── chatbotService.js   # AI chatbot logic
│   ├── models/
│   │   ├── ScanResult.js   # Scan data model
│   │   └── Password.js     # Password data model
│   └── server.js           # Express setup
├── uploads/                # Scanned files storage
├── .env                    # Environment variables
└── package.json

frontend/
├── src/
│   ├── components/
│   │   ├── VulnerabilityScanner.jsx
│   │   ├── VirusScanner.jsx
│   │   ├── PasswordAnalyzer.jsx
│   │   └── Chatbot.jsx
│   ├── services/
│   │   └── api.js         # API client
│   ├── styles/            # Component styles
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## API Documentation

### Scanner Endpoints

**Scan for Vulnerabilities**
```
POST /api/scanner/vulnerabilities
Body: { "input": "http://example.com" }
Response: { "vulnerabilities": [...], "riskLevel": "HIGH/MEDIUM/LOW" }
```

**Scan File for Virus**
```
POST /api/scanner/virus
Body: FormData with file
Response: { "threats": [...], "riskLevel": "SAFE/HIGH" }
```

### Password Endpoints

**Analyze Password**
```
POST /api/password/analyze
Body: { "password": "myPassword" }
Response: { "strength": 75, "level": "Good", "feedback": [...] }
```

**Generate Strong Password**
```
GET /api/password/generate?length=16&special=true
Response: { "password": "...", "strength": 92, "level": "Very Strong" }
```

### Chat Endpoints

**Send Message**
```
POST /api/chat/message
Body: { "message": "Tell me about SQL injection" }
Response: { "relevant": true, "prevention": [...], "tools": [...] }
```

## Testing the Application

### Test Vulnerability Scanner
1. Enter: `http://site.com/search.php?q='; DROP TABLE users;--`
2. Should detect SQL Injection

### Test Password Analyzer
1. Enter: `password123` → Very Weak
2. Enter: `Tr0p!cal$2024#Sun` → Very Strong

### Test Chatbot
1. Ask: "What is XSS?"
2. Get detailed prevention methods and examples

## Troubleshooting

**Port Already in Use:**
```bash
# Change port in backend/.env or frontend/vite.config.js
```

**Module Not Found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**CORS Issues:**
```bash
# Backend server allows localhost:5173
# Check that backend is running on port 5000
```

## Environment Variables

Create `backend/.env`:
```
PORT=5000
NODE_ENV=development
```

## Performance Tips

- Backend uses in-memory storage (demo mode)
- For production, integrate with MongoDB
- Add caching for chatbot responses
- Implement rate limiting for APIs

## Future Enhancements

- Real antivirus integration (VirusTotal API)
- Machine learning-based threat detection
- User authentication system
- Scan history and analytics
- PDF report generation
- Email alerts for threats

## Support

For issues or questions, check:
1. Browser console for errors
2. Backend terminal for logs
3. Check API endpoint responses
4. Verify both servers are running

---

**Happy Scanning! 🛡️**
