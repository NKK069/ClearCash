import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import algosdk from 'algosdk';
import twilio from 'twilio';
import { nanoid } from 'nanoid';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new Database(process.env.DATABASE_PATH || './clearcash.db');
db.pragma('journal_mode = WAL');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    last_streak_date DATE
  );

  CREATE TABLE IF NOT EXISTS jars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    budget_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    jar_id INTEGER,
    amount REAL NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    txn_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    settled_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (jar_id) REFERENCES jars(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merkle_root TEXT NOT NULL,
    txn_hash TEXT NOT NULL,
    transaction_ids TEXT NOT NULL,
    settled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS emergency_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    guardian_phone TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Algorand client setup
const algodClient = new algosdk.Algodv2(
  process.env.ALGORAND_TOKEN || '',
  process.env.ALGORAND_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGORAND_PORT || 443
);

// Twilio client (optional)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper: Calculate streak
const calculateStreak = (userId) => {
  const user = db.prepare('SELECT streak_count, last_streak_date FROM users WHERE id = ?').get(userId);
  if (!user) return 0;

  const today = new Date().toISOString().split('T')[0];
  const lastDate = user.last_streak_date;

  if (!lastDate) {
    // First time
    db.prepare('UPDATE users SET streak_count = 1, last_streak_date = ? WHERE id = ?').run(today, userId);
    return 1;
  }

  const daysDiff = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // Same day, no change
    return user.streak_count;
  } else if (daysDiff === 1) {
    // Consecutive day
    const newStreak = user.streak_count + 1;
    db.prepare('UPDATE users SET streak_count = ?, last_streak_date = ? WHERE id = ?').run(newStreak, today, userId);
    return newStreak;
  } else {
    // Streak broken
    db.prepare('UPDATE users SET streak_count = 1, last_streak_date = ? WHERE id = ?').run(today, userId);
    return 1;
  }
};

// Helper: Create Merkle Root
const createMerkleRoot = (transactionIds) => {
  const hashes = transactionIds.map(id => {
    const hash = algosdk.createHash('sha256');
    hash.update(id.toString());
    return hash.digest();
  });

  while (hashes.length > 1) {
    const newHashes = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const hash = algosdk.createHash('sha256');
      hash.update(hashes[i]);
      if (i + 1 < hashes.length) {
        hash.update(hashes[i + 1]);
      }
      newHashes.push(hash.digest());
    }
    hashes.length = 0;
    hashes.push(...newHashes);
  }

  return Buffer.from(hashes[0]).toString('base64');
};

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: db.open ? 'connected' : 'disconnected',
      algorand: 'connected',
      twilio: twilioClient ? 'configured' : 'not configured'
    }
  });
});

// ============================================
// AUTH ROUTES
// ============================================

// Connect wallet
app.post('/api/auth/wallet', async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !algosdk.isValidAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress);

    if (!user) {
      // Create new user
      const result = db.prepare(
        'INSERT INTO users (wallet_address, display_name) VALUES (?, ?)'
      ).run(walletAddress, `User ${walletAddress.slice(0, 8)}`);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

      // Create default jars for new users
      const defaultJars = [
        { name: 'Food & Dining', budget: 5000, color: '#FF6B6B', icon: '🍜' },
        { name: 'Transport', budget: 2000, color: '#4ECDC4', icon: '🚌' },
        { name: 'Bills & Utilities', budget: 3000, color: '#45B7D1', icon: '💡' },
        { name: 'Fun & Entertainment', budget: 2000, color: '#96CEB4', icon: '🎮' }
      ];

      const insertJar = db.prepare(
        'INSERT INTO jars (user_id, name, budget_amount, color, icon) VALUES (?, ?, ?, ?, ?)'
      );

      for (const jar of defaultJars) {
        insertJar.run(user.id, jar.name, jar.budget, jar.color, jar.icon);
      }
    } else {
      // Update last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.wallet_address },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get account info from blockchain
    let accountInfo = null;
    try {
      accountInfo = await algodClient.accountInformation(walletAddress).do();
    } catch (error) {
      console.error('Error fetching account info:', error);
    }

    res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        displayName: user.display_name,
        streakCount: user.streak_count,
        balance: accountInfo ? accountInfo.amount / 1000000 : 0 // Convert microAlgos to ALGO
      }
    });
  } catch (error) {
    console.error('Wallet connect error:', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// Verify token
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, userId: req.user.userId });
});

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get blockchain balance
    let balance = 0;
    try {
      const accountInfo = await algodClient.accountInformation(user.wallet_address).do();
      balance = accountInfo.amount / 1000000;
    } catch (error) {
      console.error('Error fetching balance:', error);
    }

    // Calculate current streak
    const streakCount = calculateStreak(user.id);

    res.json({
      id: user.id,
      walletAddress: user.wallet_address,
      displayName: user.display_name,
      balance,
      streakCount,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user jars
app.get('/api/user/jars', authenticateToken, (req, res) => {
  try {
    const jars = db.prepare('SELECT * FROM jars WHERE user_id = ?').all(req.user.userId);
    res.json({ jars });
  } catch (error) {
    console.error('Jars fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch jars' });
  }
});

// Update jars
app.post('/api/user/jars', authenticateToken, (req, res) => {
  try {
    const { jars } = req.body;

    if (!Array.isArray(jars)) {
      return res.status(400).json({ error: 'Jars must be an array' });
    }

    // Delete existing jars
    db.prepare('DELETE FROM jars WHERE user_id = ?').run(req.user.userId);

    // Insert new jars
    const insertJar = db.prepare(
      'INSERT INTO jars (user_id, name, budget_amount, spent_amount, color, icon) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (const jar of jars) {
      insertJar.run(
        req.user.userId,
        jar.name,
        jar.budget_amount,
        jar.spent_amount || 0,
        jar.color,
        jar.icon
      );
    }

    const updatedJars = db.prepare('SELECT * FROM jars WHERE user_id = ?').all(req.user.userId);

    // Broadcast to all user's connected clients
    io.to(`user:${req.user.userId}`).emit('sync:jars', { jars: updatedJars });

    res.json({ jars: updatedJars });
  } catch (error) {
    console.error('Jars update error:', error);
    res.status(500).json({ error: 'Failed to update jars' });
  }
});

// ============================================
// TRANSACTION ROUTES
// ============================================

// Get transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [req.user.userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);

    res.json({ transactions });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Add transaction
app.post('/api/transactions', authenticateToken, (req, res) => {
  try {
    const { jarId, amount, description, category } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Category required' });
    }

    // Insert transaction
    const result = db.prepare(
      'INSERT INTO transactions (user_id, jar_id, amount, description, category, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.userId, jarId || null, amount, description || '', category, 'pending');

    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);

    // Update jar spent amount if jar specified
    if (jarId) {
      db.prepare('UPDATE jars SET spent_amount = spent_amount + ? WHERE id = ?').run(amount, jarId);
      const updatedJars = db.prepare('SELECT * FROM jars WHERE user_id = ?').all(req.user.userId);
      io.to(`user:${req.user.userId}`).emit('sync:jars', { jars: updatedJars });
    }

    // Update streak
    const streakCount = calculateStreak(req.user.userId);

    // Broadcast transaction to all user's devices
    io.to(`user:${req.user.userId}`).emit('sync:transactions', { transaction });

    res.json({ transaction, streakCount });
  } catch (error) {
    console.error('Transaction add error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Settle transactions to blockchain
app.post('/api/transactions/settle', authenticateToken, async (req, res) => {
  try {
    // Get all pending transactions
    const pendingTxns = db.prepare(
      'SELECT * FROM transactions WHERE user_id = ? AND status = ?'
    ).all(req.user.userId, 'pending');

    if (pendingTxns.length === 0) {
      return res.status(400).json({ error: 'No pending transactions to settle' });
    }

    // Create Merkle root
    const transactionIds = pendingTxns.map(t => t.id);
    const merkleRoot = createMerkleRoot(transactionIds);

    // Get user wallet address
    const user = db.prepare('SELECT wallet_address FROM users WHERE id = ?').get(req.user.userId);

    // Create note transaction on Algorand
    const suggestedParams = await algodClient.getTransactionParams().do();
    const note = new TextEncoder().encode(JSON.stringify({
      type: 'CLEARCASH_SETTLEMENT',
      merkleRoot,
      count: transactionIds.length,
      timestamp: Date.now()
    }));

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: user.wallet_address,
      to: user.wallet_address, // Self-transaction
      amount: 0, // Zero amount, just storing note
      note,
      suggestedParams
    });

    // Return unsigned transaction for client to sign
    const txnB64 = Buffer.from(txn.toByte()).toString('base64');

    res.json({
      unsignedTxn: txnB64,
      merkleRoot,
      transactionIds,
      count: transactionIds.length
    });
  } catch (error) {
    console.error('Settle error:', error);
    res.status(500).json({ error: 'Failed to prepare settlement' });
  }
});

// Confirm settlement
app.post('/api/transactions/settle/confirm', authenticateToken, async (req, res) => {
  try {
    const { signedTxn, transactionIds, merkleRoot } = req.body;

    // Send signed transaction to blockchain
    const txnBuffer = Buffer.from(signedTxn, 'base64');
    const { txId } = await algodClient.sendRawTransaction(txnBuffer).do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Update transactions status
    const updateStmt = db.prepare('UPDATE transactions SET status = ?, txn_hash = ?, settled_at = CURRENT_TIMESTAMP WHERE id = ?');
    
    for (const txnId of transactionIds) {
      updateStmt.run('settled', txId, txnId);
    }

    // Create settlement record
    db.prepare(
      'INSERT INTO settlements (user_id, merkle_root, txn_hash, transaction_ids) VALUES (?, ?, ?, ?)'
    ).run(req.user.userId, merkleRoot, txId, JSON.stringify(transactionIds));

    res.json({
      success: true,
      txId,
      settledCount: transactionIds.length
    });
  } catch (error) {
    console.error('Confirm settlement error:', error);
    res.status(500).json({ error: 'Failed to confirm settlement' });
  }
});

// ============================================
// EMERGENCY ROUTES
// ============================================

// Request emergency fund
app.post('/api/emergency/request', authenticateToken, async (req, res) => {
  try {
    const { guardianPhone, amount, reason } = req.body;

    if (!guardianPhone || !amount) {
      return res.status(400).json({ error: 'Guardian phone and amount required' });
    }

    // Create emergency request
    const result = db.prepare(
      'INSERT INTO emergency_requests (user_id, guardian_phone, amount, reason) VALUES (?, ?, ?, ?)'
    ).run(req.user.userId, guardianPhone, amount, reason || 'Emergency fund request');

    const request = db.prepare('SELECT * FROM emergency_requests WHERE id = ?').get(result.lastInsertRowid);

    // Send SMS via Twilio (if configured)
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const user = db.prepare('SELECT wallet_address FROM users WHERE id = ?').get(req.user.userId);
        const message = `ClearCash Emergency Request: ${user.wallet_address.slice(0, 8)}... needs ₹${amount}. Reason: ${reason || 'Not specified'}. Send ALGO to: ${user.wallet_address}`;

        await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: guardianPhone
        });

        db.prepare('UPDATE emergency_requests SET status = ? WHERE id = ?').run('sent', request.id);
      } catch (smsError) {
        console.error('SMS send error:', smsError);
        // Continue even if SMS fails
      }
    }

    res.json({
      success: true,
      request: {
        id: request.id,
        amount: request.amount,
        status: twilioClient ? 'sent' : 'created'
      }
    });
  } catch (error) {
    console.error('Emergency request error:', error);
    res.status(500).json({ error: 'Failed to create emergency request' });
  }
});

// ============================================
// WEBSOCKET
// ============================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(`user:${decoded.userId}`);
      console.log(`User ${decoded.userId} authenticated on socket ${socket.id}`);
      socket.emit('authenticated', { userId: decoded.userId });
    } catch (error) {
      socket.emit('auth_error', { error: 'Invalid token' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║     💰 ClearCash Server Running 💰       ║
║                                           ║
║     Port: ${PORT}                            ║
║     Environment: ${process.env.NODE_ENV || 'development'}              ║
║     Database: Connected                   ║
║     Algorand: ${process.env.ALGORAND_NETWORK || 'testnet'}                  ║
║     Twilio: ${twilioClient ? 'Configured' : 'Not configured'}               ║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});
