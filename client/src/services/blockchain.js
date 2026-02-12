// Blockchain Service for Algorand Integration

import algosdk from 'algosdk';
import { DeflyWalletConnect } from '@blockshake/defly-connect';

class BlockchainService {
  constructor() {
    this.algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      443
    );
    
    this.deflyWallet = null;
    this.currentAddress = null;
  }

  // Initialize Defly Wallet
  async initializeWallet() {
    if (!this.deflyWallet) {
      this.deflyWallet = new DeflyWalletConnect();
    }
    return this.deflyWallet;
  }

  // Connect to wallet
  async connect() {
    try {
      const wallet = await this.initializeWallet();
      const accounts = await wallet.connect();
      
      if (accounts && accounts.length > 0) {
        this.currentAddress = accounts[0];
        return this.currentAddress;
      }
      
      throw new Error('No accounts found');
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect() {
    if (this.deflyWallet) {
      await this.deflyWallet.disconnect();
      this.currentAddress = null;
    }
  }

  // Get account balance
  async getBalance(address = this.currentAddress) {
    if (!address) {
      throw new Error('No address provided');
    }

    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      return accountInfo.amount / 1000000; // Convert microAlgos to ALGO
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Get account information
  async getAccountInfo(address = this.currentAddress) {
    if (!address) {
      throw new Error('No address provided');
    }

    try {
      return await this.algodClient.accountInformation(address).do();
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  // Sign and send transaction
  async signTransaction(unsignedTxnB64) {
    if (!this.deflyWallet || !this.currentAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const unsignedTxn = Buffer.from(unsignedTxnB64, 'base64');
      const signedTxns = await this.deflyWallet.signTransaction([unsignedTxn]);
      
      if (!signedTxns || signedTxns.length === 0) {
        throw new Error('Transaction signing failed');
      }

      return Buffer.from(signedTxns[0]).toString('base64');
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  // Send signed transaction to blockchain
  async sendTransaction(signedTxnB64) {
    try {
      const signedTxn = Buffer.from(signedTxnB64, 'base64');
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(this.algodClient, txId, 4);
      
      return txId;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Get transaction details
  async getTransaction(txId) {
    try {
      const txInfo = await this.algodClient.pendingTransactionInformation(txId).do();
      return txInfo;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  // Check if address is valid
  isValidAddress(address) {
    return algosdk.isValidAddress(address);
  }

  // Format ALGO amount
  formatAlgo(microAlgos) {
    return (microAlgos / 1000000).toFixed(6);
  }

  // Convert ALGO to microAlgos
  toMicroAlgos(algos) {
    return Math.round(algos * 1000000);
  }
}

export default new BlockchainService();
