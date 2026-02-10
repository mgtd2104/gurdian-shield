// Password model for storing analyzed passwords
export class PasswordEntry {
  constructor(userId, password, strength, analysis, createdAt = new Date()) {
    this.userId = userId;
    this.password = password;
    this.strength = strength;
    this.analysis = analysis;
    this.createdAt = createdAt;
  }

  static getStrengthLevel(strength) {
    if (strength < 20) return 'Very Weak';
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Very Strong';
  }
}

export const passwordStorage = new Map();
