// JarCard Component - Individual Budget Jar Display

import React from 'react';

const JarCard = ({ jar, onClick }) => {
  const percentage = Math.min((jar.spent_amount / jar.budget_amount) * 100, 100);
  const isOverBudget = jar.spent_amount > jar.budget_amount;

  return (
    <div
      className="jar-card"
      style={{ color: jar.color, borderLeftColor: jar.color }}
      onClick={onClick}
    >
      <div className="jar-header">
        <div className="jar-icon" style={{ backgroundColor: jar.color }}>
          {jar.icon}
        </div>
        <div className="jar-info">
          <h3>{jar.name}</h3>
          <div className="jar-budget">
            Budget: ₹{jar.budget_amount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="jar-amount" style={{ color: isOverBudget ? 'var(--error)' : 'var(--text-primary)' }}>
        ₹{jar.spent_amount.toFixed(2)}
        {isOverBudget && ' ⚠️'}
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverBudget ? 'var(--error)' : jar.color
          }}
        />
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {percentage.toFixed(0)}% used • ₹{(jar.budget_amount - jar.spent_amount).toFixed(2)} left
      </div>
    </div>
  );
};

export default JarCard;
