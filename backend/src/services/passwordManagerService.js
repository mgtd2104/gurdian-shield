import { PasswordEntry, passwordManagerStorage } from '../models/PasswordManager.js';

// Password Manager Service
export class PasswordManagerService {
  // Add new password entry
  static addEntry(userId, site, username, password, notes = '') {
    const entry = new PasswordEntry(userId, site, username, password, notes);
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    passwordManagerStorage.set(id, entry);
    return { id, ...entry };
  }

  // Get all entries for a user
  static getEntries(userId) {
    const entries = [];
    for (const [id, entry] of passwordManagerStorage) {
      if (entry.userId === userId) {
        entries.push({
          id,
          site: entry.site,
          username: entry.username,
          notes: entry.notes,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        });
      }
    }
    return entries;
  }

  // Get specific entry with decrypted password
  static getEntry(userId, entryId) {
    const entry = passwordManagerStorage.get(entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error('Entry not found');
    }
    return {
      id: entryId,
      site: entry.site,
      username: entry.username,
      password: entry.getPassword(),
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    };
  }

  // Update entry
  static updateEntry(userId, entryId, site, username, password, notes) {
    const entry = passwordManagerStorage.get(entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error('Entry not found');
    }
    entry.update(site, username, password, notes);
    return { id: entryId, ...entry };
  }

  // Delete entry
  static deleteEntry(userId, entryId) {
    const entry = passwordManagerStorage.get(entryId);
    if (!entry || entry.userId !== userId) {
      return false;
    }
    passwordManagerStorage.delete(entryId);
    return true;
  }

  // Search entries
  static searchEntries(userId, query) {
    const entries = this.getEntries(userId);
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.site.toLowerCase().includes(lowerQuery) ||
      entry.username.toLowerCase().includes(lowerQuery) ||
      entry.notes.toLowerCase().includes(lowerQuery)
    );
  }
}