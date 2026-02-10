function hasUpper(s) {
  return /[A-Z]/.test(s);
}

function hasLower(s) {
  return /[a-z]/.test(s);
}

function hasNumber(s) {
  return /\d/.test(s);
}

function hasSpecial(s) {
  return /[^A-Za-z0-9]/.test(s);
}

function getCharsetSize(password) {
  let size = 0;
  if (hasLower(password)) size += 26;
  if (hasUpper(password)) size += 26;
  if (hasNumber(password)) size += 10;
  if (hasSpecial(password)) size += 33;
  return Math.max(size, 1);
}

function entropyBits(password) {
  const charset = getCharsetSize(password);
  return Math.round(password.length * Math.log2(charset));
}

function timeToCrackString(entropy) {
  const guessesPerSecond = 1e9;
  const seconds = Math.pow(2, entropy) / guessesPerSecond;

  if (!Number.isFinite(seconds) || seconds > 1e20) return 'centuries+';
  if (seconds < 1) return 'instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} days`;
  const years = days / 365;
  if (years < 100) return `${Math.round(years)} years`;
  return `${Math.round(years)} years`;
}

function scorePassword(password) {
  const requirements = {
    'Length >= 8': password.length >= 8,
    'Uppercase': hasUpper(password),
    'Lowercase': hasLower(password),
    'Number': hasNumber(password),
    'Special': hasSpecial(password)
  };

  let score = 0;
  score += Math.min(password.length, 20) * 2;
  score += requirements['Uppercase'] ? 10 : 0;
  score += requirements['Lowercase'] ? 10 : 0;
  score += requirements['Number'] ? 10 : 0;
  score += requirements['Special'] ? 10 : 0;
  score += password.length >= 12 ? 10 : 0;
  score += password.length >= 16 ? 10 : 0;
  score = Math.max(0, Math.min(100, score));

  const level = score < 40 ? 'Weak' : score < 70 ? 'Moderate' : 'Strong';
  const entropy = entropyBits(password);

  const feedback = [];
  if (!requirements['Length >= 8']) feedback.push('Use at least 8 characters (12+ recommended).');
  if (!requirements['Uppercase']) feedback.push('Add at least one uppercase letter.');
  if (!requirements['Lowercase']) feedback.push('Add at least one lowercase letter.');
  if (!requirements['Number']) feedback.push('Add at least one number.');
  if (!requirements['Special']) feedback.push('Add at least one special character.');

  return {
    strength: score,
    level,
    entropy,
    timeTocrack: timeToCrackString(entropy),
    requirements,
    feedback
  };
}

function generatePassword(length, special) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const specials = '!@#$%^&*()-_=+[]{};:,.?/';
  const pool = lower + upper + digits + (special ? specials : '');
  const required = [
    lower[Math.floor(Math.random() * lower.length)],
    upper[Math.floor(Math.random() * upper.length)],
    digits[Math.floor(Math.random() * digits.length)]
  ];
  if (special) required.push(specials[Math.floor(Math.random() * specials.length)]);

  const out = [...required];
  while (out.length < length) {
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}

module.exports = {
  scorePassword,
  generatePassword
};

