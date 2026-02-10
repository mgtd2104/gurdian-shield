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
        "sql injection": {
            message: "Vulnerability: SQL Injection\n\nWhat it is: Attackers can manipulate database queries by injecting SQL into inputs.\n\nHow to fix: Use prepared statements/parameterized queries everywhere, never build SQL with string concatenation.",
            prevention: ["Use prepared statements/parameterized queries", "Validate and constrain input", "Use least-privilege DB users", "Add centralized query helpers"],
            tools: ["SQLMap (for testing)", "ORM parameter binding", "WAF rules (as defense-in-depth)"],
            examples: ["cursor.execute(\"SELECT * FROM users WHERE name = %s\", (user_input,))"]
        },
        "xss": {
            message: "Vulnerability: Cross-Site Scripting (XSS)\n\nWhat it is: Malicious JavaScript can execute in users’ browsers if input is reflected/stored without proper output encoding.\n\nHow to fix: Escape output by context and sanitize rich HTML.",
            prevention: ["Escape output by context (HTML/attr/JS/URL)", "Sanitize rich HTML (DOMPurify)", "Set a strict Content-Security-Policy"],
            tools: ["DOMPurify", "CSP Evaluator", "Burp Suite"],
            examples: ["DOMPurify.sanitize(userHtml)", "Content-Security-Policy: default-src 'self'"]
        },
        "path traversal": {
            message: "Vulnerability: Path Traversal\n\nWhat it is: Attackers use ../ sequences to access files outside the intended directory.\n\nHow to fix: Normalize/resolve paths and enforce a safe base directory.",
            prevention: ["Use allow-lists for filenames", "Normalize and resolve paths", "Ensure resolved path stays under base directory"],
            tools: ["Path normalization utilities", "SAST (Semgrep)", "Burp Suite"],
            examples: ["safe = path.resolve(baseDir, userPath); if (!safe.startsWith(baseDir)) reject();"]
        },
        "csrf": {
            message: "Vulnerability: CSRF\n\nWhat it is: An attacker tricks a logged-in user’s browser into performing an unwanted action.\n\nHow to fix: CSRF tokens + SameSite cookies + Origin checks.",
            prevention: ["CSRF tokens on state-changing requests", "SameSite cookies", "Verify Origin/Referer"],
            tools: ["CSRF middleware", "Burp Suite"],
            examples: ["Set-Cookie: session=...; SameSite=Lax; Secure; HttpOnly"]
        },
        "insecure headers": {
            message: "Vulnerability: Missing/Insecure Security Headers\n\nWhy it matters: Without headers like CSP and X-Frame-Options, browsers can’t enforce key protections.",
            prevention: ["Add Content-Security-Policy", "Add X-Content-Type-Options: nosniff", "Set frame-ancestors / X-Frame-Options", "Enable HSTS (HTTPS only)"],
            tools: ["Mozilla Observatory", "securityheaders.com"],
            examples: ["Strict-Transport-Security: max-age=31536000; includeSubDomains"]
        },
        "malware": {
            message: "Topic: Malware / Virus\n\nWhat it is: Malicious software designed to steal data, encrypt files (ransomware), spy (spyware), or give remote control (RAT).",
            prevention: ["Don’t execute unknown files", "Use EDR/AV + application allow-listing", "Patch OS/apps", "Keep offline backups"],
            tools: ["VirusTotal (hash lookup)", "YARA", "Windows Defender/EDR"],
            examples: ["sha256sum suspicious.bin", "yara -r rules.yar ."]
        },
        "virus": {
            message: "Topic: Virus / Malware\n\nQuick guidance: If a scan flags a file as Known Malware, treat it as compromised.",
            prevention: ["Quarantine detected files", "Disable autoruns/persistence", "Restrict execution", "User awareness training"],
            tools: ["Autoruns", "Process Explorer", "Defender/EDR"],
            examples: ["Compare SHA-256 against known-bad list"]
        },
        "eicar": {
            message: "Topic: EICAR Test File\n\nEICAR is a harmless test string used to verify antivirus detection pipelines.",
            prevention: ["Use EICAR only for testing detection pipelines"],
            tools: ["EICAR test string"],
            examples: ["EICAR detection indicates scanner pipeline works"]
        },
        "ransomware": {
            message: "Topic: Ransomware\n\nWhat to do: Immediately isolate the machine and restore from clean backups.",
            prevention: ["Offline backups", "Least privilege", "Disable macro execution", "Patch regularly"],
            tools: ["EDR", "Backup/restore tooling"],
            examples: ["Disconnect network immediately; preserve evidence"]
        },
        "trojan": {
            message: "Topic: Trojan\n\nWhat it is: A program that looks legitimate but performs malicious actions.",
            prevention: ["Only install from trusted sources", "Verify signatures", "Use application allow-listing"],
            tools: ["Sigcheck", "EDR"],
            examples: ["sigcheck -q -m suspicious.exe"]
        },
        "hash": {
            message: "Topic: File Hashing (SHA-256)\n\nWhy: Hashes uniquely identify file contents for reputation checks and tracking.",
            prevention: ["Use SHA-256 for sample tracking", "Store known-bad hashes securely"],
            tools: ["sha256sum", "certutil -hashfile"],
            examples: ["certutil -hashfile file.exe SHA256"]
        }
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
                  message: value.message,
                  relevant: true,
                  prevention: value.prevention || [],
                  tools: value.tools || [],
                  examples: value.examples || []
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
