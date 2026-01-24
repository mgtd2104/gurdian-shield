import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vulnerability Scanner Service
export async function scanForVulnerabilities(input) {
  try {
    // Check if it's a URL or file
    const isUrl = input.startsWith('http://') || input.startsWith('https://');

    if (isUrl) {
      return scanUrlForVulnerabilities(input);
    } else {
      return scanFileForVulnerabilities(input);
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      threats: []
    };
  }
}

function scanUrlForVulnerabilities(url) {
  // Simulate vulnerability scanning
  const vulnerabilities = [];

  // Check for common vulnerabilities
  const checks = {
    'No HTTPS': url.startsWith('http://'),
    'SQL Injection Patterns': /('|"|--|;|union|select|insert|delete|update|drop)/i.test(url),
    'XSS Vulnerable': /<script|javascript:|onerror|onclick/i.test(url),
    'Path Traversal': /\.\.\/|\.\.\\/.test(url),
  };

  for (const [vuln, found] of Object.entries(checks)) {
    if (found) {
      vulnerabilities.push({
        type: vuln,
        severity: vuln === 'No HTTPS' ? 'medium' : 'high',
        description: `Potential ${vuln} vulnerability detected`
      });
    }
  }

  return {
    success: true,
    type: 'url',
    input: url,
    vulnerabilities,
    riskLevel: vulnerabilities.length > 0 ? 'HIGH' : 'LOW',
    isSafe: vulnerabilities.length === 0
  };
}

function scanFileForVulnerabilities(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vulnerabilities = [];

    // Check for common code vulnerabilities
    const patterns = {
      'Hardcoded Credentials': /password\s*[:=]\s*['"][^'"]+['"]|api[_-]?key\s*[:=]\s*['"][^'"]+['"]|secret\s*[:=]\s*['"][^'"]+['"]|token\s*[:=]\s*['"][^'"]+['"]/gi,
      'SQL Injection': /execute\s*\(\s*['"`].*\$|query\s*\(\s*['"`].*\$|concat.*concat|UNION\s+SELECT/gi,
      'Command Injection': /exec\s*\(|system\s*\(|shell_exec\s*\(|passthru\s*\(|proc_open\s*\(/gi,
      'Insecure Deserialization': /unserialize\s*\(|pickle\.loads|json\.loads.*untrusted/gi,
      'XXE Injection': /DOCTYPE|<!ENTITY/gi
    };

    for (const [vuln, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        vulnerabilities.push({
          type: vuln,
          severity: 'high',
          description: `${vuln} vulnerability pattern detected in file`
        });
      }
    }

    return {
      success: true,
      type: 'file',
      input: path.basename(filePath),
      vulnerabilities,
      riskLevel: vulnerabilities.length > 2 ? 'CRITICAL' : vulnerabilities.length > 0 ? 'HIGH' : 'LOW',
      isSafe: vulnerabilities.length === 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      threats: []
    };
  }
}

// Virus Scanner Service
export async function scanForViruses(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    // Simulate virus scanning with pattern matching
    const threats = [];

    // Check file signature (magic bytes)
    const fileSignature = fileContent.slice(0, 4).toString('hex');
    const maliciousSignatures = {
      'MZ': '4d5a', // Windows EXE
      'PK': '504b', // ZIP/Office
      'PDF': '25504446' // PDF
    };

    if (Object.values(maliciousSignatures).includes(fileSignature)) {
      threats.push({
        type: 'Suspicious File Type',
        risk: 'medium',
        description: 'Executable or archive file detected'
      });
    }

    // Check for common malware patterns
    const contentStr = fileContent.toString('latin1');
    const malwarePatterns = {
      'Trojan Pattern': /trojan|backdoor|remote.*access|stealer|ransomware|worm/gi,
      'Exploit Kit': /shellcode|overflow|rop\s*chain|code\s*injection/gi,
      'Cryptolocker': /encrypt|crypto|ransomware|pay.*bitcoin/gi,
    };

    for (const [threat, pattern] of Object.entries(malwarePatterns)) {
      if (pattern.test(contentStr)) {
        threats.push({
          type: threat,
          risk: 'high',
          description: `Potential ${threat} detected`
        });
      }
    }

    return {
      success: true,
      fileName,
      isSafe: threats.length === 0,
      threatCount: threats.length,
      threats,
      riskLevel: threats.length > 0 ? 'HIGH' : 'SAFE'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      threats: []
    };
  }
}
