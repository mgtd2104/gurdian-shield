// Password Manager model for storing encrypted password entries
import crypto from 'crypto';

export class PasswordEntry {
  constructor(userId, site, username, password, notes = '') {
    this.userId = userId;
    this.site = site;
    this.username = username;
    this.encryptedPassword = this.encrypt(password);
    this.notes = notes;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Simple encryption using AES-256-CBC (in production, use proper key management)
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('guardian-shield-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt password
  static decrypt(encryptedText) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync('guardian-shield-key', 'salt', 32);
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Get decrypted password
  getPassword() {
    return PasswordEntry.decrypt(this.encryptedPassword);
  }

  // Update entry
  update(site, username, password, notes) {
    this.site = site;
    this.username = username;
    this.encryptedPassword = this.encrypt(password);
    this.notes = notes;
    this.updatedAt = new Date();
  }
}

// In-memory storage for demo (replace with MongoDB)
export const passwordManagerStorage = new Map();