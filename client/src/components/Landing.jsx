// Landing Page Component - Connect Wallet

import React from 'react';

const Landing = ({ onConnect, loading, error }) => {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1>💰 ClearCash</h1>
        <p className="tagline">
          Budget like UPI, powered by Web3. Made for Indian students.
        </p>

        <div className="features">
          <div className="feature-badge">
            <strong>🔐</strong>
            <span>Real Wallet</span>
          </div>
          <div className="feature-badge">
            <strong>💵</strong>
            <span>Real Money</span>
          </div>
          <div className="feature-badge">
            <strong>⛓️</strong>
            <span>Real Blockchain</span>
          </div>
          <div className="feature-badge">
            <strong>🔄</strong>
            <span>Real-time Sync</span>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            color: 'white',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={onConnect}
          disabled={loading}
          style={{
            marginTop: '2rem',
            fontSize: '1.125rem',
            padding: '16px 32px',
            background: 'white',
            color: '#667eea',
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
              Connecting...
            </>
          ) : (
            <>
              🔗 Connect Defly Wallet
            </>
          )}
        </button>

        <div style={{
          marginTop: '3rem',
          fontSize: '0.875rem',
          opacity: 0.8,
        }}>
          <p>✨ No signup. No email. Just your wallet.</p>
          <p style={{ marginTop: '0.5rem' }}>
            Don't have Defly? Download from{' '}
            <a
              href="https://defly.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'white', textDecoration: 'underline' }}
            >
              defly.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
