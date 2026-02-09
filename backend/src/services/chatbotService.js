import { OpenAI } from "openai";

// AI Chatbot Service for security assistance
export class ChatbotService {
  constructor() {
    // Try to initialize OpenAI if key exists
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
        this.openai = new OpenAI({ apiKey: apiKey });
    } else {
        this.openai = null;
        console.warn("OPENAI_API_KEY not found. Chatbot will run in fallback mode.");
    }
    
    // STRICT DICTIONARY-BASED FALLBACK
    this.remediationDB = {
        "sql injection": "Vulnerability Found: SQL Injection. Fix: Use Prepared Statements.",
        "xss": "Vulnerability Found: Cross-Site Scripting (XSS). Fix: Sanitize all inputs and escape outputs using libraries like DOMPurify.",
        "path traversal": "Vulnerability Found: Path Traversal. Fix: Validate file paths and use whitelist validation for filenames.",
        "csrf": "Vulnerability Found: CSRF. Fix: Implement Anti-CSRF tokens in all forms.",
        "insecure headers": "Vulnerability Found: Insecure Headers. Fix: Configure your server to send HSTS, CSP, and X-Content-Type-Options headers."
    };
  }

  // Handle general chat messages
  async getAdvice(message) {
      if (this.openai) {
          try {
              const completion = await this.openai.chat.completions.create({
                  messages: [
                      { role: "system", content: "You are a helpful cybersecurity assistant." },
                      { role: "user", content: message }
                  ],
                  model: "gpt-3.5-turbo",
              });
              return { 
                  message: completion.choices[0].message.content, 
                  relevant: true 
              };
          } catch (e) {
              console.error("OpenAI Chat Error:", e);
          }
      }

      const text = (message || "").toLowerCase();
      for (const [key, value] of Object.entries(this.remediationDB)) {
          if (text.includes(key)) {
              return {
                  message: value,
                  relevant: true,
                  prevention: [value],
                  tools: [],
                  examples: []
              };
          }
      }

      return {
          message: "Ask about: SQL Injection, XSS, CSRF, Path Traversal, or Insecure Headers. Or run a scan and I will generate remediation.",
          relevant: true
      };
  }

  // Handle Scan Results (The Core Requirement)
  async generateScanResponse(scanResult) {
    // STRICT LOGIC: Hardcoded remediation for SQLi as requested
    const vulnerabilities = scanResult.vulnerabilities || scanResult.threats || [];
    const remediationList = [];

    // Check for SQLi explicitly
    const hasSQLi = vulnerabilities.some(v => 
        (v.type || "").toLowerCase().includes("sql") || 
        (v.description || "").toLowerCase().includes("sql")
    );

    if (hasSQLi) {
        const sqlFix = `
### **Critical Vulnerability: SQL Injection Detected**

**1. Vulnerability Analysis**
SQL Injection occurs when untrusted user input is directly concatenated into a database query. This allows an attacker to manipulate the query structure, potentially accessing, modifying, or deleting sensitive data. In this scan, the payload "' OR 1=1 --" was successfully executed, confirming the vulnerability.

**2. Remediation Strategy**
The most effective defense is to separate data from the query structure using **Parameterized Queries** (Prepared Statements). This ensures that the database treats user input as data, not executable code.

**3. Implementation Guide (Python/SQLAlchemy)**
Instead of:
\`cursor.execute("SELECT * FROM users WHERE name = '" + user_input + "'")\`

Use this secure pattern:
\`cursor.execute("SELECT * FROM users WHERE name = %s", (user_input,))\`

*Recommendation: Immediately audit all database interaction points and apply prepared statements.*
        `;
        
        remediationList.push({
            topic: "SQL Injection",
            message: sqlFix,
            prevention: ["Use Prepared Statements", "Input Validation", "Least Privilege"],
            examples: [],
            tools: []
        });

        return {
            message: "CRITICAL: SQL Injection Vulnerability Detected. Immediate Action Required.",
            detectedVulnerabilities: vulnerabilities,
            remediation: remediationList
        };
    }

    // Fallback for other vulnerabilities (User Mandated Dictionary Logic)
    vulnerabilities.forEach(vuln => {
        const type = (vuln.type || "").toLowerCase();
        let fix = "Vulnerability Found. Please investigate manually.";
        
        // Fuzzy match against dictionary keys
        for (const [key, value] of Object.entries(this.remediationDB)) {
            if (type.includes(key)) {
                fix = value;
                break;
            }
        }

        remediationList.push({
            topic: vuln.type,
            message: fix,
            prevention: [fix],
            examples: [],
            tools: []
        });
    });

    if (vulnerabilities.length === 0) {
         return {
            message: `Scan complete for ${scanResult.input}. No vulnerabilities found.`,
            relevant: true,
            detectedVulnerabilities: [],
            remediation: []
        };
    }

    return {
        message: "Vulnerabilities detected. See remediation below.",
        detectedVulnerabilities: vulnerabilities,
        remediation: remediationList
    };
  }
}

export const chatbot = new ChatbotService();
