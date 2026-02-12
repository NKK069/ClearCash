// Main App Component - ClearCash

import React, { useState } from 'react';
import { useWallet } from './hooks/useWallet';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';

function App() {
  const {
    isConnected,
    address,
    balance,
    loading,
    error,
    connect,
    disconnect,
    refreshBalance,
  } = useWallet();

  const [user, setUser] = useState(null);

  const handleConnect = async () => {
    try {
      const userData = await connect();
      setUser(userData);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setUser(null);
  };

  const handleBalanceUpdate = (newBalance) => {
    refreshBalance();
  };

  if (!isConnected) {
    return (
      <Landing
        onConnect={handleConnect}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <Dashboard
      user={user || { walletAddress: address }}
      balance={balance}
      onDisconnect={handleDisconnect}
      onBalanceUpdate={handleBalanceUpdate}
    />
  );
}

export default App;
