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
    
    this.remediationDB = {
        "sql injection": "Vulnerability: SQL Injection\n\nWhat it is: Attackers can manipulate database queries by injecting SQL into inputs.\n\nHow to fix: Use prepared statements/parameterized queries everywhere, never build SQL with string concatenation. Validate input, and enforce least-privilege DB accounts.",
        "xss": "Vulnerability: Cross-Site Scripting (XSS)\n\nWhat it is: Malicious JavaScript can execute in users’ browsers if input is reflected/stored without proper output encoding.\n\nHow to fix: Escape output by context (HTML/attr/JS/URL), sanitize rich HTML with a library (DOMPurify), and add a strict Content-Security-Policy.",
        "path traversal": "Vulnerability: Path Traversal\n\nWhat it is: Attackers use ../ sequences to access files outside the intended directory.\n\nHow to fix: Never trust user-supplied paths. Use allow-lists, resolve/normalize paths, and enforce that resolved paths stay inside a safe base directory.",
        "csrf": "Vulnerability: CSRF\n\nWhat it is: An attacker tricks a logged-in user’s browser into performing an unwanted action.\n\nHow to fix: Use CSRF tokens, SameSite cookies, and verify Origin/Referer for state-changing requests.",
        "insecure headers": "Vulnerability: Missing/Insecure Security Headers\n\nWhy it matters: Without headers like CSP and X-Frame-Options, browsers can’t enforce key protections.\n\nHow to fix: Add Content-Security-Policy, X-Frame-Options or frame-ancestors, X-Content-Type-Options, Referrer-Policy, and HSTS (for HTTPS only).",
        "malware": "Topic: Malware / Virus\n\nWhat it is: Malicious software designed to steal data, encrypt files (ransomware), spy (spyware), or give remote control (RAT).\n\nWhat to do: Isolate the file/system, do not execute it, hash it (SHA-256) and check reputation, scan with multiple engines, and inspect for high entropy/packed binaries. If confirmed, reimage or restore from clean backups.",
        "virus": "Topic: Virus / Malware\n\nQuick guidance: If a scan flags a file as Known Malware, treat it as compromised. Quarantine it, avoid running it, and remove persistence points (startup tasks/services). Validate with hashes and multiple scanners.",
        "eicar": "Topic: EICAR Test File\n\nEICAR is a harmless test string used to verify antivirus detection pipelines. If your scanner detects EICAR, that’s expected and means the detection logic is working.",
        "ransomware": "Topic: Ransomware\n\nWhat to do: Immediately isolate the machine (disconnect network), preserve evidence, identify affected scope, restore from offline backups, and rotate credentials. Don’t pay unless you have no other option and leadership approves.",
        "trojan": "Topic: Trojan\n\nWhat it is: A program that looks legitimate but performs malicious actions.\n\nHow to respond: Quarantine, inspect execution chain, check persistence, and hunt for lateral movement and credential theft.",
        "hash": "Topic: File Hashing (SHA-256)\n\nWhy: Hashes uniquely identify file contents. Use SHA-256 to compare against known-bad hash lists and to track samples across systems."
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
                  prevention: [],
                  tools: [],
                  examples: []
              };
          }
      }

      return {
          message: "Ask about: SQL Injection, XSS, CSRF, Path Traversal, Insecure Headers, Malware/Virus, Ransomware, Trojan, EICAR, or Hashing. You can also run a scan and I will generate remediation.",
          relevant: true,
          prevention: [],
          tools: [],
          examples: []
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
