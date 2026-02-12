// EmergencyModal Component - Request Emergency Fund via SMS

import React, { useState } from 'react';

const EmergencyModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    phone: '',
    amount: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number (with country code)');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to send emergency request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🆘 Emergency Fund Request</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{
          padding: '1rem',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>How it works:</strong>
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your guardian will receive an SMS with your wallet address.
            They can send ALGO directly to help you out - no wallet required on their end!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Guardian's Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="input"
              placeholder="+919876543210"
              value={formData.phone}
              onChange={handleChange}
              required
              autoFocus
            />
            <small style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
              Include country code (e.g., +91 for India)
            </small>
          </div>

          <div className="form-group">
            <label>Amount Needed (₹) *</label>
            <input
              type="number"
              name="amount"
              className="input"
              placeholder="5000"
              value={formData.amount}
              onChange={handleChange}
              step="100"
              min="100"
              required
            />
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <textarea
              name="reason"
              className="input"
              placeholder="Medical emergency, Lost wallet, etc."
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{
            padding: '1rem',
            background: '#FFF3E0',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#E65100'
          }}>
            <strong>⚠️ Important:</strong> SMS service must be configured by admin.
            If Twilio is not set up, request will be logged but no SMS will be sent.
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, background: 'var(--error)' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyModal;
