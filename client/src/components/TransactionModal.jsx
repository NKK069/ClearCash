// TransactionModal Component - Add New Transaction

import React, { useState } from 'react';

const TransactionModal = ({ jars, selectedJar, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    jarId: selectedJar?.id || '',
    amount: '',
    description: '',
    category: selectedJar?.name || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!formData.category) {
      alert('Please select a category');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        jarId: formData.jarId || null,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category
      });
    } catch (error) {
      console.error('Submit error:', error);
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

    // Update category when jar changes
    if (name === 'jarId') {
      const jar = jars.find(j => j.id === parseInt(value));
      if (jar) {
        setFormData(prev => ({
          ...prev,
          category: jar.name
        }));
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Expense</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              className="input"
              placeholder="120"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Budget Jar (Optional)</label>
            <select
              name="jarId"
              className="select"
              value={formData.jarId}
              onChange={handleChange}
            >
              <option value="">No jar (general expense)</option>
              {jars.map(jar => (
                <option key={jar.id} value={jar.id}>
                  {jar.icon} {jar.name} (₹{(jar.budget_amount - jar.spent_amount).toFixed(2)} left)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              name="category"
              className="input"
              placeholder="Food, Transport, etc."
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input
              type="text"
              name="description"
              className="input"
              placeholder="Chai with friends"
              value={formData.description}
              onChange={handleChange}
            />
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
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
