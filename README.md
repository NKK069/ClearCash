# ClearCash
Clear Cash Repo
# 💰 ClearCash - Web3 Budget App for Indian Students

A UPI-like Web3 budget application running on Algorand blockchain. Zero assumptions about lifestyle, complete user control, real-time multi-device sync.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Algorand](https://img.shields.io/badge/blockchain-Algorand-00D4AA)
![React](https://img.shields.io/badge/react-18.2.0-61DAFB)
![Node](https://img.shields.io/badge/node-18%2B-339933)

## 🎯 Hackathon Track: Future of Finance

**Problem**: Indian students struggle with budgeting apps that assume Western lifestyles, require crypto knowledge, or use fake money.

**Solution**: ClearCash combines familiar UPI patterns with Web3 transparency - real money, real blockchain, zero learning curve.

## ✨ Features

### Core Features
- 🔐 **Defly Wallet Integration** - One-click Algorand authentication
- 💵 **Real Balance Display** - Live ALGO balance from blockchain
- 🏺 **Budget Jars** - 4 customizable categories (Food, Transport, Bills, Fun)
- 💸 **Transaction Management** - Add expenses, track spending
- ⛓️ **Blockchain Proof** - Merkle roots stored on-chain
- 🔄 **Multi-Device Sync** - Real-time WebSocket synchronization
- 🔥 **Daily Streaks** - Gamified habit building
- 🆘 **Emergency Fund** - SMS to guardians (no wallet required)
- 🎨 **Beautiful UI** - Indian-inspired, mobile-first design

### Technical Highlights
- **Off-chain pending, batch settlement** - Gas-efficient transactions
- **SQLite database** - Lightweight, portable storage
- **JWT authentication** - Secure session management
- **WebSocket real-time** - Instant cross-device updates
- **Twilio SMS** - Emergency fund accessibility

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Defly Wallet (mobile or browser extension)
- Algorand testnet account with some ALGO

### Installation

```bash
# 1. Clone and setup
git clone <your-repo>
cd clearcash
chmod +x setup.sh
./setup.sh

# 2. Configure environment
cd server
cp .env.example .env
# Edit .env with your values:
# - JWT_SECRET (required)
# - TWILIO credentials (optional)

# 3. Run the application

# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173
```

### Quick Setup (All-in-One)
```bash
chmod +x setup.sh verify.sh
./setup.sh          # Setup everything
./verify.sh         # Verify before demo
```

## 📁 Project Structure

```
clearcash/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API & blockchain services
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   └── index.js       # Express server + WebSocket
│   ├── .env.example
│   └── package.json
├── docs/                  # Documentation
│   ├── API.md
│   ├── FEATURES.md
│   └── ARCHITECTURE.md
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/wallet` - Connect Defly wallet
- `POST /api/auth/verify` - Verify JWT token

### User Operations
- `GET /api/user/profile` - Get user profile
- `POST /api/user/jars` - Update budget jars

### Transactions
- `POST /api/transactions` - Add transaction
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions/settle` - Settle to blockchain

### Emergency
- `POST /api/emergency/request` - Request emergency fund

### WebSocket Events
- `sync:jars` - Real-time jar updates
- `sync:transactions` - Real-time transaction updates
- `sync:balance` - Real-time balance updates

See [API.md](docs/API.md) for complete API documentation.

## 🎮 Demo Script (60 seconds)

**[0-10s] Hook**
> "Ever tried budgeting apps that assume you eat out daily? ClearCash doesn't. Watch."

**[10-25s] Connect & Show**
1. Click "Connect Wallet"
2. Approve in Defly
3. Show real ALGO balance appear
4. Show pre-filled Indian student jars

**[25-45s] Use**
1. Add ₹120 chai expense → Food jar updates instantly
2. Open second device → show real-time sync
3. Click Emergency → show SMS feature

**[45-60s] Close**
> "Real money, real blockchain, zero learning curve. Built for students who need budgeting that understands their life."

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Express    │ ◄─────► │  Algorand   │
│  (React)    │  HTTP   │   Server     │  SDK    │  Testnet    │
│             │ ◄─────► │              │         │             │
└─────────────┘  WS     └──────────────┘         └─────────────┘
       │                        │
       │                        ▼
       │                 ┌──────────────┐
       │                 │   SQLite     │
       │                 │   Database   │
       └─────────────────┤              │
         Defly SDK       └──────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Socket.IO Client** - Real-time sync
- **Defly Wallet SDK** - Algorand integration

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Socket.IO** - WebSocket server
- **SQLite** - Database
- **Algorand JS SDK** - Blockchain interaction
- **Twilio** - SMS service
- **JWT** - Authentication

## 🧪 Testing

```bash
# Verify setup
./verify.sh

# Manual testing checklist
# ✅ Wallet connects
# ✅ Balance appears
# ✅ Jar creation works
# ✅ Transactions add
# ✅ Multi-device sync works
# ✅ Emergency SMS sends
```

## 🐛 Troubleshooting

### Wallet won't connect
- Install Defly Wallet extension/app
- Switch to Algorand testnet
- Fund account with testnet ALGO from dispenser

### Sync not working
- Check WebSocket connection in browser console
- Verify server is running on port 3000
- Check firewall/proxy settings

### Database errors
- Delete `server/clearcash.db` and restart
- Run `npm run dev` to recreate tables

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed help.


## 🎯 What Makes This Special

1. **No Demo Data** - Everything connects to real Algorand testnet
2. **Gas Efficient** - Batch settlement with Merkle proofs
3. **Accessible** - Emergency SMS works without wallet
4. **Real-time** - Multi-device sync via WebSocket
5. **Student-Focused** - Indian lifestyle, rupee amounts, realistic jars

## 📚 Documentation

- [API Reference](docs/API.md) - Complete endpoint documentation
- [Features Guide](docs/FEATURES.md) - All features explained
- [Architecture](docs/ARCHITECTURE.md) - System design diagrams
- [Hackathon Demo](docs/HACKATHON.md) - 60-second pitch script


## 🙏 Acknowledgments

- Algorand Foundation for blockchain infrastructure
- Defly Wallet for seamless Web3 UX
- Indian student community for real-world insights


Built with ❤️ for Indian students by Obscidian Code

