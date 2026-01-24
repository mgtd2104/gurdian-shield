# Guardian Shield - Test Cases & Examples

## Testing the Application

### Test Case 1: Vulnerability Scanner - SQL Injection

**Scenario:** Test if the scanner detects SQL injection vulnerabilities

**Test Data:**
```
URL: http://example.com/search.php?q='; DROP TABLE users;--
```

**Expected Result:**
```json
{
  "success": true,
  "isSafe": false,
  "riskLevel": "HIGH",
  "vulnerabilities": [
    {
      "type": "SQL Injection Patterns",
      "severity": "high",
      "description": "Potential SQL Injection Patterns vulnerability detected"
    }
  ]
}
```

---

### Test Case 2: Vulnerability Scanner - No HTTPS

**Scenario:** Test if the scanner warns about non-HTTPS URLs

**Test Data:**
```
URL: http://unsecured-site.com/login
```

**Expected Result:**
```json
{
  "success": true,
  "isSafe": false,
  "riskLevel": "MEDIUM",
  "vulnerabilities": [
    {
      "type": "No HTTPS",
      "severity": "medium",
      "description": "Potential No HTTPS vulnerability detected"
    }
  ]
}
```

---

### Test Case 3: Vulnerability Scanner - Safe URL

**Scenario:** Test if the scanner correctly identifies safe URLs

**Test Data:**
```
URL: https://google.com
```

**Expected Result:**
```json
{
  "success": true,
  "isSafe": true,
  "riskLevel": "LOW",
  "vulnerabilities": []
}
```

---

### Test Case 4: Password Analyzer - Weak Password

**Scenario:** Analyze a weak password

**Test Data:**
```
Password: password123
```

**Expected Result:**
```json
{
  "success": true,
  "strength": 35,
  "level": "Weak",
  "feedback": [
    "Use at least 12 characters",
    "Add special characters",
    "Avoid common passwords"
  ],
  "requirements": {
    "length": false,
    "lowercase": true,
    "uppercase": false,
    "numbers": true,
    "special": false,
    "noCommon": false
  },
  "timeTocrack": "Minutes"
}
```

---

### Test Case 5: Password Analyzer - Strong Password

**Scenario:** Analyze a strong password

**Test Data:**
```
Password: Tr0p!cal$Sunset#2024
```

**Expected Result:**
```json
{
  "success": true,
  "strength": 92,
  "level": "Very Strong",
  "feedback": ["Strong password!"],
  "requirements": {
    "length": true,
    "lowercase": true,
    "uppercase": true,
    "numbers": true,
    "special": true,
    "noCommon": true
  },
  "entropy": "78.54",
  "timeTocrack": "Years"
}
```

---

### Test Case 6: Password Generator

**Scenario:** Generate a strong random password

**API Call:**
```
GET /api/password/generate?length=16&special=true
```

**Expected Result:**
```json
{
  "success": true,
  "password": "aB3#xY9$mK2@qL7!",
  "strength": 88,
  "level": "Very Strong",
  "entropy": "92.34"
}
```

---

### Test Case 7: Chatbot - SQL Injection Question

**Scenario:** Ask chatbot about SQL injection prevention

**Request:**
```json
{
  "message": "Tell me about SQL injection"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "relevant": true,
    "topic": "sql injection",
    "description": "SQL Injection is a code injection...",
    "prevention": [
      "Use parameterized queries/prepared statements",
      "Validate and sanitize all user inputs",
      "Use ORM frameworks",
      ...
    ],
    "tools": ["OWASP ZAP", "Burp Suite", "SQLMap"],
    "examples": [
      "Vulnerable: query('SELECT * FROM users WHERE id = ' + userInput)",
      "Safe: query('SELECT * FROM users WHERE id = ?', [userInput])"
    ]
  }
}
```

---

### Test Case 8: Chatbot - Password Security

**Scenario:** Ask chatbot about password best practices

**Request:**
```json
{
  "message": "How do I create a strong password?"
}
```

**Expected Response:**
```json
{
  "success": true,
  "response": {
    "relevant": true,
    "topic": "password",
    "prevention": [
      "Use at least 12 characters",
      "Mix uppercase, lowercase, numbers, and special characters",
      "Avoid dictionary words and common patterns",
      "Use unique passwords for different services",
      "Enable two-factor authentication (2FA)",
      "Use a password manager"
    ],
    "tools": ["1Password", "Bitwarden", "LastPass"],
    "examples": [...]
  }
}
```

---

## Curl Command Examples

### Test Vulnerability Scanner
```bash
curl -X POST http://localhost:5000/api/scanner/vulnerabilities \
  -H "Content-Type: application/json" \
  -d '{"input":"http://example.com/search?q=1'"'"' OR 1=1"}'
```

### Test Password Analysis
```bash
curl -X POST http://localhost:5000/api/password/analyze \
  -H "Content-Type: application/json" \
  -d '{"password":"MySecurePass123!"}'
```

### Test Chatbot
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me about XSS attacks"}'
```

### Generate Password
```bash
curl -X GET "http://localhost:5000/api/password/generate?length=20&special=true"
```

### Get Chat Topics
```bash
curl -X GET http://localhost:5000/api/chat/topics
```

---

## Manual Testing Checklist

### ✅ Vulnerability Scanner
- [ ] Test SQL injection detection (URL with SQL patterns)
- [ ] Test XSS detection (URL with script tags)
- [ ] Test Path traversal detection (URL with ../)
- [ ] Test safe URL (should be low risk)
- [ ] Test file scanning capability

### ✅ Virus Scanner
- [ ] Upload a text file (should be safe)
- [ ] Upload file with suspicious content
- [ ] Check threat reporting
- [ ] Verify scan history

### ✅ Password Analyzer
- [ ] Test very weak password (< 20 strength)
- [ ] Test weak password (20-40 strength)
- [ ] Test fair password (40-60 strength)
- [ ] Test good password (60-80 strength)
- [ ] Test very strong password (> 80 strength)
- [ ] Test password generation
- [ ] Store secure password
- [ ] Check stored passwords list

### ✅ Chatbot
- [ ] Ask about SQL injection
- [ ] Ask about XSS
- [ ] Ask about password security
- [ ] Ask about HTTPS
- [ ] Ask about command injection
- [ ] Ask about path traversal
- [ ] Verify knowledge base topics appear
- [ ] Test quick topic buttons

### ✅ UI/UX
- [ ] Check responsive design on mobile
- [ ] Test tab navigation
- [ ] Verify animations
- [ ] Check error messages
- [ ] Test input validation
- [ ] Verify loading states

---

## Performance Testing

### Load Testing Recommendations

1. **Vulnerability Scanner**
   - Expected: < 100ms response time
   - Test with 100 concurrent requests

2. **Password Analyzer**
   - Expected: < 50ms response time
   - Test with 1000 concurrent requests

3. **Chatbot**
   - Expected: < 200ms response time
   - Test with 500 concurrent requests

---

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:** Ensure backend is running on port 5000
```bash
cd backend && npm run dev
```

### Issue: "CORS error"
**Solution:** Backend has CORS enabled for localhost:5173. Check:
1. Frontend is on correct port (5173)
2. Backend is on correct port (5000)

### Issue: "File upload fails"
**Solution:** Check file size (< 10MB) and format

### Issue: "Chatbot returns irrelevant answers"
**Solution:** Check knowledge base in `chatbotService.js`

---

## Success Criteria

All features working correctly when:

1. ✅ Vulnerability scanner identifies common vulnerabilities
2. ✅ Virus scanner processes file uploads
3. ✅ Password analyzer provides strength metrics
4. ✅ Password generator creates strong passwords
5. ✅ Chatbot provides relevant security guidance
6. ✅ UI is responsive and interactive
7. ✅ All API endpoints return correct responses
8. ✅ Error handling works properly
9. ✅ Data persists in current session
10. ✅ No console errors or warnings

---

**Guardian Shield Testing Guide** - Complete! 🛡️
