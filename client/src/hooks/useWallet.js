// Custom React Hook for Wallet Management

import { useState, useEffect, useCallback } from 'react';
import blockchainService from '../services/blockchain';
import apiService from '../services/api';

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      const token = localStorage.getItem('clearcash_token');
      const savedAddress = localStorage.getItem('wallet_address');
      
      if (token && savedAddress) {
        try {
          await apiService.verifyToken();
          setAddress(savedAddress);
          setIsConnected(true);
          
          // Fetch balance
          const bal = await blockchainService.getBalance(savedAddress);
          setBalance(bal);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('clearcash_token');
          localStorage.removeItem('wallet_address');
        }
      }
    };

    checkConnection();
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Connect to Defly Wallet
      const walletAddress = await blockchainService.connect();
      
      // Authenticate with backend
      const response = await apiService.connectWallet(walletAddress);
      
      // Save to state and localStorage
      setAddress(walletAddress);
      setBalance(response.user.balance);
      setIsConnected(true);
      localStorage.setItem('wallet_address', walletAddress);
      
      return response.user;
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setLoading(true);
    
    try {
      await blockchainService.disconnect();
      apiService.clearToken();
      localStorage.removeItem('wallet_address');
      
      setAddress(null);
      setBalance(0);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!address) return;

    try {
      const bal = await blockchainService.getBalance(address);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [address]);

  return {
    isConnected,
    address,
    balance,
    loading,
    error,
    connect,
    disconnect,
    refreshBalance,
  };
};
