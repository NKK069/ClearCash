// API Service for ClearCash Backend Communication

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('clearcash_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('clearcash_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('clearcash_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async connectWallet(walletAddress) {
    const data = await this.request('/auth/wallet', {
      method: 'POST',
      body: { walletAddress },
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async verifyToken() {
    return this.request('/auth/verify', { method: 'POST' });
  }

  // User endpoints
  async getProfile() {
    return this.request('/user/profile');
  }

  async getJars() {
    return this.request('/user/jars');
  }

  async updateJars(jars) {
    return this.request('/user/jars', {
      method: 'POST',
      body: { jars },
    });
  }

  // Transaction endpoints
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions?${query}`);
  }

  async addTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  async settleTransactions() {
    return this.request('/transactions/settle', { method: 'POST' });
  }

  async confirmSettlement(signedTxn, transactionIds, merkleRoot) {
    return this.request('/transactions/settle/confirm', {
      method: 'POST',
      body: { signedTxn, transactionIds, merkleRoot },
    });
  }

  // Emergency endpoints
  async requestEmergencyFund(guardianPhone, amount, reason) {
    return this.request('/emergency/request', {
      method: 'POST',
      body: { guardianPhone, amount, reason },
    });
  }
}

export default new ApiService();
