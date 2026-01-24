// AI Chatbot Service for security assistance
export class ChatbotService {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  initializeKnowledgeBase() {
    return {
      'sql injection': {
        description: 'SQL Injection is a code injection technique that exploits input validation flaws',
        prevention: [
          'Use parameterized queries/prepared statements',
          'Validate and sanitize all user inputs',
          'Use ORM frameworks',
          'Apply principle of least privilege to database accounts',
          'Use Web Application Firewalls (WAF)'
        ],
        examples: [
          'Vulnerable: query("SELECT * FROM users WHERE id = " + userInput)',
          'Safe: query("SELECT * FROM users WHERE id = ?", [userInput])'
        ],
        tools: ['OWASP ZAP', 'Burp Suite', 'SQLMap']
      },
      'cross-site scripting': {
        description: 'XSS is a security vulnerability that allows attackers to inject malicious scripts',
        prevention: [
          'Escape user input based on context (HTML, JavaScript, CSS, URL)',
          'Use Content Security Policy (CSP)',
          'Validate input on both client and server',
          'Use security libraries and frameworks',
          'Enable HttpOnly flag on cookies'
        ],
        examples: [
          'Vulnerable: document.innerHTML = userInput',
          'Safe: document.textContent = userInput or use framework escaping'
        ],
        tools: ['OWASP ZAP', 'Burp Suite']
      },
      'password': {
        description: 'Strong password practices protect accounts from unauthorized access',
        prevention: [
          'Use at least 12 characters',
          'Mix uppercase, lowercase, numbers, and special characters',
          'Avoid dictionary words and common patterns',
          'Use unique passwords for different services',
          'Enable two-factor authentication (2FA)',
          'Use a password manager'
        ],
        examples: [
          'Weak: password123',
          'Strong: Tr0p!cal$Sunset#2024'
        ],
        tools: ['1Password', 'Bitwarden', 'LastPass']
      },
      'https': {
        description: 'HTTPS encrypts data in transit, protecting against man-in-the-middle attacks',
        prevention: [
          'Always use HTTPS for sensitive communications',
          'Obtain valid SSL/TLS certificates',
          'Use HSTS headers',
          'Regularly update certificates before expiry',
          'Implement proper cipher suites',
          'Use certificate pinning for critical applications'
        ],
        examples: [
          'Insecure: http://example.com/login',
          'Secure: https://example.com/login'
        ],
        tools: ['Let\'s Encrypt', 'Certbot', 'SSL Labs']
      },
      'command injection': {
        description: 'Command Injection occurs when user input is executed as system commands',
        prevention: [
          'Avoid using shell execution functions with user input',
          'Use parameterized APIs',
          'Validate and sanitize all inputs',
          'Run with least privilege',
          'Use allowlists for valid inputs',
          'Disable shell metacharacters'
        ],
        examples: [
          'Vulnerable: system("ping " + userHost)',
          'Safe: Use language-native APIs for intended functionality'
        ],
        tools: ['OWASP ZAP', 'Semgrep', 'SonarQube']
      },
      'path traversal': {
        description: 'Path Traversal allows attackers to access files outside intended directories',
        prevention: [
          'Validate file paths against allowlist',
          'Use basename() to extract filename only',
          'Implement proper access controls',
          'Run application with restricted permissions',
          'Use canonicalization to resolve paths',
          'Avoid user input in file paths'
        ],
        examples: [
          'Vulnerable: readFile("/uploads/" + userPath)',
          'Safe: readFile("/uploads/" + sanitize(userPath))'
        ],
        tools: ['OWASP ZAP', 'Burp Suite']
      }
    };
  }

  // Find relevant security advice
  async getAdvice(issue) {
    const lowerIssue = issue.toLowerCase();
    
    // Try exact match first
    for (const [key, value] of Object.entries(this.knowledgeBase)) {
      if (lowerIssue.includes(key)) {
        return {
          relevant: true,
          topic: key,
          ...value
        };
      }
    }

    // Try pattern matching
    const patterns = {
      'vulnerab': 'sql injection',
      'xss': 'cross-site scripting',
      'pass': 'password',
      'secure': 'https',
      'exec': 'command injection',
      'path': 'path traversal',
      'threat': 'sql injection',
      'weak': 'password',
      'unsafe': 'https'
    };

    for (const [pattern, topic] of Object.entries(patterns)) {
      if (lowerIssue.includes(pattern)) {
        return {
          relevant: true,
          topic,
          ...this.knowledgeBase[topic]
        };
      }
    }

    return {
      relevant: false,
      message: 'I could not find specific guidance on this issue. Please provide more details.',
      suggestions: 'Try asking about: SQL Injection, XSS, Password Security, HTTPS, Command Injection, or Path Traversal'
    };
  }

  // Generate response based on scan results
  async generateScanResponse(scanResult) {
    if (!scanResult.vulnerabilities || scanResult.vulnerabilities.length === 0) {
      return {
        message: '✅ No vulnerabilities detected! Your input appears to be safe.',
        suggestions: 'Continue following security best practices and keep your systems updated.'
      };
    }

    const advice = [];
    for (const vuln of scanResult.vulnerabilities) {
      const guidance = await this.getAdvice(vuln.type);
      if (guidance.relevant) {
        advice.push(guidance);
      }
    }

    return {
      message: `⚠️ Found ${scanResult.vulnerabilities.length} potential issue(s). Here's what you should do:`,
      detectedVulnerabilities: scanResult.vulnerabilities,
      remediation: advice
    };
  }
}

export const chatbot = new ChatbotService();
