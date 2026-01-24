import crypto from 'crypto';

// Password strength analyzer
export function analyzePasswordStrength(password) {
  if (!password) {
    return {
      strength: 0,
      level: 'Very Weak',
      feedback: ['Password is empty'],
      score: 0
    };
  }

  let strength = 0;
  const feedback = [];
  const requirements = {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !isCommonPassword(password)
  };

  // Check length
  if (password.length >= 12) strength += 20;
  else if (password.length >= 8) strength += 10;
  else feedback.push('Use at least 12 characters');

  // Check lowercase
  if (requirements.lowercase) strength += 15;
  else feedback.push('Add lowercase letters');

  // Check uppercase
  if (requirements.uppercase) strength += 15;
  else feedback.push('Add uppercase letters');

  // Check numbers
  if (requirements.numbers) strength += 15;
  else feedback.push('Add numbers');

  // Check special characters
  if (requirements.special) strength += 20;
  else feedback.push('Add special characters');

  // Check for common passwords
  if (requirements.noCommon) strength += 15;
  else feedback.push('Avoid common passwords');

  // Calculate entropy
  const entropy = calculateEntropy(password);
  if (entropy < 30) feedback.push('Password has low entropy - add more variety');

  const level = getStrengthLevel(strength);

  return {
    strength: Math.min(strength, 100),
    level,
    feedback: feedback.length > 0 ? feedback : ['Strong password!'],
    score: Math.min(strength, 100),
    requirements,
    entropy: entropy.toFixed(2),
    timeTocrack: estimateTimeTocrack(strength)
  };
}

function isCommonPassword(password) {
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'qwerty', 'abc123', 'password1'
  ];
  return commonPasswords.includes(password.toLowerCase());
}

function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/\d/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

  return password.length * Math.log2(charsetSize);
}

function estimateTimeTocrack(strength) {
  const guessesPerSecond = 1e12; // 1 trillion guesses/sec
  const possibilities = Math.pow(2, strength * 1.35);
  const secondsToHack = possibilities / (2 * guessesPerSecond);

  if (secondsToHack < 1) return 'Less than 1 second';
  if (secondsToHack < 60) return `${Math.round(secondsToHack)} seconds`;
  if (secondsToHack < 3600) return `${Math.round(secondsToHack / 60)} minutes`;
  if (secondsToHack < 86400) return `${Math.round(secondsToHack / 3600)} hours`;
  if (secondsToHack < 31536000) return `${Math.round(secondsToHack / 86400)} days`;
  return 'Years';
}

function getStrengthLevel(strength) {
  if (strength < 20) return 'Very Weak';
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  return 'Very Strong';
}

// Store password hash
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Validate password before storage
export function validatePasswordForStorage(password) {
  const analysis = analyzePasswordStrength(password);
  return {
    valid: analysis.strength >= 60,
    analysis,
    hash: hashPassword(password)
  };
}
