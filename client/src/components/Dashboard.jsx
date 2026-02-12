// Dashboard Component - Main App View

import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { useSocket } from '../hooks/useSocket';
import JarCard from './JarCard';
import TransactionModal from './TransactionModal';
import TransactionsList from './TransactionsList';
import EmergencyModal from './EmergencyModal';

const Dashboard = ({ user, balance, onDisconnect, onBalanceUpdate }) => {
  const [jars, setJars] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedJar, setSelectedJar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(user?.streakCount || 0);

  // Real-time sync
  useSocket(
    user?.id,
    (updatedJars) => setJars(updatedJars),
    (newTransaction) => setTransactions(prev => [newTransaction, ...prev]),
    (newBalance) => onBalanceUpdate(newBalance)
  );

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jarsData, transactionsData] = await Promise.all([
        apiService.getJars(),
        apiService.getTransactions({ limit: 20 })
      ]);

      setJars(jarsData.jars || []);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const response = await apiService.addTransaction(transactionData);
      setTransactions(prev => [response.transaction, ...prev]);
      
      if (response.streakCount) {
        setStreakCount(response.streakCount);
      }

      // Reload jars to get updated spent amounts
      const jarsData = await apiService.getJars();
      setJars(jarsData.jars || []);

      setShowTransactionModal(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      alert('Failed to add transaction: ' + error.message);
    }
  };

  const handleSettleTransactions = async () => {
    if (!window.confirm('Settle all pending transactions to blockchain?')) {
      return;
    }

    try {
      // This would integrate with the blockchain service
      // For now, just show a message
      alert('Settlement feature requires Defly Wallet signing. Check console for transaction details.');
      console.log('Settlement initiated');
    } catch (error) {
      console.error('Settlement failed:', error);
      alert('Settlement failed: ' + error.message);
    }
  };

  const handleEmergencyRequest = async (data) => {
    try {
      await apiService.requestEmergencyFund(data.phone, data.amount, data.reason);
      alert('Emergency request sent! Your guardian will receive an SMS.');
      setShowEmergencyModal(false);
    } catch (error) {
      console.error('Emergency request failed:', error);
      alert('Failed to send emergency request: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <div className="balance-card">
            <div className="balance-label">Your Balance</div>
            <div className="balance-amount">
              ₹{(balance * 100).toFixed(2)} {/* Assuming 1 ALGO = ₹100 for demo */}
            </div>
            <div className="wallet-address">
              {user?.walletAddress?.slice(0, 8)}...{user?.walletAddress?.slice(-6)}
            </div>
            
            {streakCount > 0 && (
              <div className="streak-badge">
                <span className="emoji">🔥</span>
                <span>{streakCount} day streak!</span>
              </div>
            )}

            <button
              className="btn btn-outline"
              onClick={onDisconnect}
              style={{ marginTop: '1rem', color: 'white', borderColor: 'white' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons container">
        <button
          className="action-btn"
          onClick={() => setShowTransactionModal(true)}
        >
          <span className="icon">💸</span>
          <span className="label">Add Expense</span>
        </button>

        <button
          className="action-btn"
          onClick={handleSettleTransactions}
          disabled={pendingCount === 0}
        >
          <span className="icon">⛓️</span>
          <span className="label">
            Settle ({pendingCount})
          </span>
        </button>

        <button
          className="action-btn"
          onClick={() => setShowEmergencyModal(true)}
        >
          <span className="icon">🆘</span>
          <span className="label">Emergency Fund</span>
        </button>
      </div>

      {/* Jars Grid */}
      <div className="container">
        <h2 style={{ marginBottom: '1rem' }}>Budget Jars</h2>
        <div className="jars-grid">
          {jars.map(jar => (
            <JarCard
              key={jar.id}
              jar={jar}
              onClick={() => {
                setSelectedJar(jar);
                setShowTransactionModal(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Recent Transactions</h2>
        <TransactionsList transactions={transactions.slice(0, 10)} />
      </div>

      {/* Modals */}
      {showTransactionModal && (
        <TransactionModal
          jars={jars}
          selectedJar={selectedJar}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedJar(null);
          }}
          onSubmit={handleAddTransaction}
        />
      )}

      {showEmergencyModal && (
        <EmergencyModal
          onClose={() => setShowEmergencyModal(false)}
          onSubmit={handleEmergencyRequest}
        />
      )}
    </div>
  );
};

export default Dashboard;
