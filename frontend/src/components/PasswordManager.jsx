import React, { useState, useEffect } from 'react';
import { passwordManagerAPI } from '../services/api';
import '../styles/PasswordManager.css';

export default function PasswordManager() {
  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState('user1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    notes: ''
  });

  useEffect(() => {
    loadEntries();
  }, [userId]);

  const loadEntries = async () => {
    try {
      const response = await passwordManagerAPI.getEntries(userId);
      setEntries(response.data.entries);
      setError('');
    } catch (err) {
      setError('Failed to load password entries');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await passwordManagerAPI.updateEntry(editingEntry.id, userId, formData.site, formData.username, formData.password, formData.notes);
        setSuccess('Password entry updated successfully');
      } else {
        await passwordManagerAPI.addEntry(userId, formData.site, formData.username, formData.password, formData.notes);
        setSuccess('Password entry added successfully');
      }
      setFormData({ site: '', username: '', password: '', notes: '' });
      setShowForm(false);
      setEditingEntry(null);
      loadEntries();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry');
    }
  };

  const handleEdit = async (entryId) => {
    try {
      const response = await passwordManagerAPI.getEntry(userId, entryId);
      const entry = response.data.entry;
      setFormData({
        site: entry.site,
        username: entry.username,
        password: entry.password,
        notes: entry.notes
      });
      setEditingEntry({ id: entryId });
      setShowForm(true);
      setError('');
    } catch (err) {
      setError('Failed to load entry for editing');
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this password entry?')) return;
    try {
      await passwordManagerAPI.deleteEntry(userId, entryId);
      setSuccess('Password entry deleted successfully');
      loadEntries();
    } catch (err) {
      setError('Failed to delete entry');
    }
  };

  const togglePasswordVisibility = (entryId) => {
    setShowPasswords(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEntries();
      return;
    }
    try {
      const response = await passwordManagerAPI.searchEntries(userId, searchQuery);
      setEntries(response.data.entries);
      setError('');
    } catch (err) {
      setError('Search failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="password-manager-container">
      <h2>🔑 Password Manager</h2>
      <p>Securely store and manage your passwords</p>

      <div className="manager-controls">
        <div className="search-group">
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn-secondary">Search</button>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Password'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="password-form">
          <h3>{editingEntry ? 'Edit Password Entry' : 'Add New Password Entry'}</h3>
          <div className="form-group">
            <label>Website/Service:</label>
            <input
              type="text"
              value={formData.site}
              onChange={(e) => setFormData({...formData, site: e.target.value})}
              required
              placeholder="e.g., google.com"
            />
          </div>
          <div className="form-group">
            <label>Username/Email:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              placeholder="your username or email"
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              placeholder="your password"
            />
          </div>
          <div className="form-group">
            <label>Notes (optional):</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes..."
              rows="3"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingEntry ? 'Update' : 'Save'} Password
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingEntry(null); setFormData({site:'',username:'',password:'',notes:''}); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="entries-list">
        <h3>Your Passwords ({entries.length})</h3>
        {entries.length === 0 ? (
          <p className="no-entries">No password entries found. Add your first password above!</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <h4>{entry.site}</h4>
                <div className="entry-actions">
                  <button onClick={() => handleEdit(entry.id)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(entry.id)} className="btn-delete">Delete</button>
                </div>
              </div>
              <div className="entry-details">
                <p><strong>Username:</strong> {entry.username}</p>
                <p>
                  <strong>Password:</strong>
                  <span className="password-field">
                    {showPasswords[entry.id] ? entry.password : '••••••••'}
                    <button
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="toggle-password-btn"
                    >
                      {showPasswords[entry.id] ? '🙈' : '👁️'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(entry.password)}
                      className="copy-btn"
                      title="Copy password"
                    >
                      📋
                    </button>
                  </span>
                </p>
                {entry.notes && <p><strong>Notes:</strong> {entry.notes}</p>}
                <p className="entry-date">
                  Created: {new Date(entry.createdAt).toLocaleDateString()}
                  {entry.updatedAt !== entry.createdAt && (
                    <> | Updated: {new Date(entry.updatedAt).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}