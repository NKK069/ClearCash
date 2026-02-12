// TransactionsList Component - Display Recent Transactions

import React from 'react';

const TransactionsList = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">💸</div>
        <p>No transactions yet. Add your first expense!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getCategoryIcon = (category) => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('food') || lowerCategory.includes('dining')) return '🍜';
    if (lowerCategory.includes('transport') || lowerCategory.includes('travel')) return '🚌';
    if (lowerCategory.includes('bill') || lowerCategory.includes('utility')) return '💡';
    if (lowerCategory.includes('fun') || lowerCategory.includes('entertainment')) return '🎮';
    if (lowerCategory.includes('shopping')) return '🛒';
    if (lowerCategory.includes('health') || lowerCategory.includes('medical')) return '💊';
    if (lowerCategory.includes('education') || lowerCategory.includes('book')) return '📚';
    
    return '💰';
  };

  const getCategoryColor = (category) => {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('food')) return '#FF6B6B';
    if (lowerCategory.includes('transport')) return '#4ECDC4';
    if (lowerCategory.includes('bill')) return '#45B7D1';
    if (lowerCategory.includes('fun')) return '#96CEB4';
    if (lowerCategory.includes('shopping')) return '#FFA07A';
    if (lowerCategory.includes('health')) return '#98D8C8';
    if (lowerCategory.includes('education')) return '#6C5CE7';
    
    return '#95A5A6';
  };

  return (
    <div className="transactions-list">
      {transactions.map(transaction => (
        <div key={transaction.id} className="transaction-item">
          <div
            className="transaction-icon"
            style={{ backgroundColor: getCategoryColor(transaction.category) }}
          >
            {getCategoryIcon(transaction.category)}
          </div>

          <div className="transaction-details">
            <div className="transaction-category">
              {transaction.category}
              {transaction.status && (
                <span className={`status-badge status-${transaction.status}`} style={{ marginLeft: '0.5rem' }}>
                  {transaction.status}
                </span>
              )}
            </div>
            <div className="transaction-description">
              {transaction.description || 'No description'}
            </div>
          </div>

          <div>
            <div className="transaction-amount">
              -₹{transaction.amount.toFixed(2)}
            </div>
            <div className="transaction-date">
              {formatDate(transaction.created_at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsList;
