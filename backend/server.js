const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const EXTERNAL_RATES_API_URL =
  process.env.EXTERNAL_RATES_API_URL ||
  'https://api.nbp.pl/api/exchangerates/tables/A?format=json';

app.use(cors());
app.use(express.json());

// In-memory data store (demo purposes)
const users = [];
const wallets = [];
const transactions = [];
const rateAlerts = [];

let nextUserId = 1;
let nextWalletId = 1;
let nextTransactionId = 1;
let nextAlertId = 1;

// Convert any existing TRY wallets to PLN on startup
// This ensures compatibility with old user data
function migrateTryToPln() {
  wallets.forEach((wallet) => {
    if (wallet.currency === 'TRY') {
      wallet.currency = 'PLN';
    }
  });
}

// Basit helper: kullanıcıyı email ile bul
function findUserByEmail(email) {
  return users.find((u) => u.email === email);
}

// Helper to simulate network errors
async function fetchRatesWithNetworkHandling() {
  try {
    const response = await axios.get(EXTERNAL_RATES_API_URL, {
      timeout: 5000 // 5 sec timeout
    });
    return { data: response.data, error: null };
  } catch (err) {
    // Simplified error handling
    let message = 'An error occurred while accessing the exchange rate service.';
    if (err.code === 'ECONNABORTED') {
      message = 'Exchange rate service timed out.';
    } else if (err.response) {
      message = `Exchange rate service returned an error: ${err.response.status}`;
    } else if (err.request) {
      message =
        'Could not reach the exchange rate service. Please check your network connection.';
    }
    return { data: null, error: message };
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running.' });
});

// User registration
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (findUserByEmail(email)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    userId: nextUserId++,
    name,
    email,
    // Demo için plain text, gerçekte hash kullanılmalı
    password,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);

  // Default PLN wallet (Polish Zloty)
  const wallet = {
    walletId: nextWalletId++,
    userId: newUser.userId,
    currency: 'PLN',
    balance: 10000 // demo balance
  };
  wallets.push(wallet);

  res.status(201).json({
    userId: newUser.userId,
    name: newUser.name,
    email: newUser.email
  });
});

// Login (simple, no token)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({
    userId: user.userId,
    name: user.name,
    email: user.email
  });
});

// Döviz kurları
app.get('/api/rates', async (req, res) => {
  const result = await fetchRatesWithNetworkHandling();
  if (result.error) {
    return res.status(503).json({ error: result.error });
  }
  res.json(result.data);
});

// Historical rates for charts (NBP: last N quotations, max 93)
const NBP_HISTORY_URL = (code, count) =>
  `https://api.nbp.pl/api/exchangerates/rates/A/${code}/last/${Math.min(93, count)}/?format=json`;
app.get('/api/rates/history/:code', async (req, res) => {
  const code = (req.params.code || '').toUpperCase();
  const days = Math.min(93, Math.max(1, parseInt(req.query.days, 10) || 30));
  if (!/^[A-Z]{3}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid currency code (e.g. USD, EUR).' });
  }
  try {
    const response = await axios.get(NBP_HISTORY_URL(code, days), { timeout: 5000 });
    const data = response.data;
    res.json({ code: data.code, rates: (data.rates || []).map((r) => ({ date: r.effectiveDate, mid: r.mid })) });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'No history for this currency.' });
    }
    const message = err.code === 'ECONNABORTED' ? 'Request timed out.' : (err.response && err.response.data) || err.message;
    res.status(503).json({ error: message });
  }
});

// Rate alerts: list
app.get('/api/users/:userId/alerts', (req, res) => {
  const userId = Number(req.params.userId);
  const userAlerts = rateAlerts.filter((a) => a.userId === userId);
  res.json(userAlerts);
});

// Rate alerts: create
app.post('/api/users/:userId/alerts', (req, res) => {
  const userId = Number(req.params.userId);
  const { currencyPair, direction, thresholdValue } = req.body;
  if (!currencyPair || !direction || thresholdValue == null) {
    return res.status(400).json({ error: 'currencyPair, direction (UP/DOWN), and thresholdValue are required.' });
  }
  if (!['UP', 'DOWN'].includes(String(direction).toUpperCase())) {
    return res.status(400).json({ error: 'direction must be UP or DOWN.' });
  }
  const numericThreshold = Number(thresholdValue);
  if (Number.isNaN(numericThreshold) || numericThreshold <= 0) {
    return res.status(400).json({ error: 'thresholdValue must be a positive number.' });
  }
  const user = users.find((u) => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  const alert = {
    alertId: nextAlertId++,
    userId,
    currencyPair: String(currencyPair).toUpperCase(),
    direction: String(direction).toUpperCase(),
    thresholdValue: numericThreshold,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  rateAlerts.push(alert);
  res.status(201).json(alert);
});

// Rate alerts: delete
app.delete('/api/users/:userId/alerts/:alertId', (req, res) => {
  const userId = Number(req.params.userId);
  const alertId = Number(req.params.alertId);
  const index = rateAlerts.findIndex((a) => a.alertId === alertId && a.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Alert not found.' });
  }
  rateAlerts.splice(index, 1);
  res.status(204).send();
});

// Rate alerts: check which are triggered (compare current rates with alerts)
app.get('/api/users/:userId/alerts/check', async (req, res) => {
  const userId = Number(req.params.userId);
  const result = await fetchRatesWithNetworkHandling();
  if (result.error) {
    return res.status(503).json({ error: result.error });
  }
  const table = Array.isArray(result.data) ? result.data[0] : result.data;
  const rates = table && table.rates ? table.rates : [];
  const ratesByCode = {};
  rates.forEach((r) => { ratesByCode[r.code] = r.mid; });

  const userAlerts = rateAlerts.filter((a) => a.userId === userId && a.isActive);
  const triggered = [];
  userAlerts.forEach((a) => {
    const pair = a.currencyPair.replace('/PLN', '');
    const current = ratesByCode[pair];
    if (current == null) return;
    if (a.direction === 'UP' && current >= a.thresholdValue) {
      triggered.push({ ...a, currentRate: current });
    } else if (a.direction === 'DOWN' && current <= a.thresholdValue) {
      triggered.push({ ...a, currentRate: current });
    }
  });
  res.json({ triggered });
});

// User wallet information
app.get('/api/users/:userId/wallets', (req, res) => {
  const userId = Number(req.params.userId);
  const userWallets = wallets.filter((w) => w.userId === userId);
  // Convert any TRY wallets to PLN (for backward compatibility)
  userWallets.forEach((wallet) => {
    if (wallet.currency === 'TRY') {
      wallet.currency = 'PLN';
    }
  });
  res.json(userWallets);
});

// Buy / Sell transaction
app.post('/api/users/:userId/trade', (req, res) => {
  const userId = Number(req.params.userId);
  const { type, currencyPair, amount, rate } = req.body;

  if (!['BUY', 'SELL'].includes(type)) {
    return res.status(400).json({ error: 'Type must be BUY or SELL.' });
  }
  if (!currencyPair || !amount || !rate) {
    return res.status(400).json({ error: 'Missing transaction information.' });
  }

  const user = users.find((u) => u.userId === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Simple example: only PLN wallet transactions
  const wallet = wallets.find(
    (w) => w.userId === userId && w.currency === 'PLN'
  );
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found.' });
  }

  const numericAmount = Number(amount);
  const numericRate = Number(rate);
  if (Number.isNaN(numericAmount) || Number.isNaN(numericRate)) {
    return res.status(400).json({ error: 'Invalid amount or rate.' });
  }

  const cost = numericAmount * numericRate;

  if (type === 'BUY') {
    // User spends PLN
    if (wallet.balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }
    wallet.balance -= cost;
  } else if (type === 'SELL') {
    // Increase PLN balance for simplicity
    wallet.balance += cost;
  }

  const transaction = {
    transactionId: nextTransactionId++,
    userId,
    walletId: wallet.walletId,
    type,
    currencyPair,
    amount: numericAmount,
    rate: numericRate,
    createdAt: new Date().toISOString()
  };
  transactions.push(transaction);

  res.status(201).json({
    transaction,
    wallet
  });
});

// Transaction history
app.get('/api/users/:userId/transactions', (req, res) => {
  const userId = Number(req.params.userId);
  const userTransactions = transactions.filter((t) => t.userId === userId);
  res.json(userTransactions);
});

// Simple error handler middleware
app.use((err, req, res, next) => {
  console.error('Unexpected server error:', err);
  res
    .status(500)
    .json({ error: 'An unexpected error occurred on the server.' });
});

app.listen(PORT, '0.0.0.0', () => {
  // Migrate any existing TRY wallets to PLN
  migrateTryToPln();
  console.log(`Server is running on port ${PORT}`);
});



