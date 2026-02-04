import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { API_BASE } from '../../src/config';

type User = {
  userId: number;
  name?: string;
  email: string;
};

type Wallet = {
  walletId: number;
  currency: string;
  balance: number;
};

type Rate = {
  code: string;
  currency: string;
  mid: number;
};

type Transaction = {
  transactionId: number;
  type: 'BUY' | 'SELL';
  currencyPair: string;
  amount: number;
  rate: number;
  createdAt: string;
};

function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(path: string, options: RequestInit = {}) {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your network connection.');
      } else {
        setError(err.message || 'Unexpected network error.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, request, setError };
}

function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (u: User) => void;
}) {
  const { loading, error, request, setError } = useApi();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    setError(null);
    try {
      // E-posta adresine otomatik @gmail.com ekle
      const fullEmail = email.includes('@') ? email : `${email}@gmail.com`;
      
      if (mode === 'register') {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email: fullEmail, password }),
        });
      }
      const user = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: fullEmail, password }),
      });
      onAuthenticated(user);
    } catch {
      // hata useApi içinde set edildi
    }
  };

  const handleTestLogin = async () => {
    setError(null);
    try {
      // Test kullanıcısıyla otomatik giriş
      const user = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ 
          email: 'test@example.com', 
          password: 'test123' 
        }),
      });
      onAuthenticated(user);
    } catch {
      // Eğer test kullanıcısı yoksa, oluştur
      try {
        await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ 
            name: 'Test User', 
            email: 'test@example.com', 
            password: 'test123' 
          }),
        });
        const user = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ 
            email: 'test@example.com', 
            password: 'test123' 
          }),
        });
        onAuthenticated(user);
      } catch {
        // hata useApi içinde set edildi
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.containerCentered}>
        <Text style={styles.titleCentered}>Mobile Currency Exchange System</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Login / Register</Text>
            <TouchableOpacity
              onPress={() =>
                setMode((m) => (m === 'login' ? 'register' : 'login'))
              }
              style={styles.modeButton}
            >
              <Text style={styles.modeButtonText}>
                {mode === 'login' ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#64748b"
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email (username only)</Text>
            <Text style={styles.mutedSmall}>@gmail.com will be added automatically</Text>
            <View style={styles.emailInputContainer}>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="username"
                keyboardType="default"
                autoCapitalize="none"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.emailSuffix}>@gmail.com</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#64748b"
            />
          </View>

          {error && <Text style={styles.errorText}>{String(error)}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Login' : 'Register + Login'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DashboardScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { loading, error, request, setError } = useApi();
  const [rates, setRates] = useState<Rate[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedCode, setSelectedCode] = useState('');
  const [amount, setAmount] = useState('');
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setError(null);
    try {
      const [ratesRes, walletsRes, txRes] = await Promise.all([
        request('/rates'),
        request(`/users/${user.userId}/wallets`),
        request(`/users/${user.userId}/transactions`),
      ]);
      const table = Array.isArray(ratesRes) ? ratesRes[0] : ratesRes;
      setRates(table.rates || []);
      setWallets(walletsRes);
      setTransactions(txRes);
    } catch {
      // hata zaten set edildi
    }
  }

  async function handleTrade() {
    setError(null);
    setLastMessage(null);

    const rateObj = rates.find((r) => r.code === selectedCode);
    if (!rateObj) {
      setError('Please select a currency.');
      return;
    }
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      const res = await request(`/users/${user.userId}/trade`, {
        method: 'POST',
        body: JSON.stringify({
          type: tradeType,
          currencyPair: rateObj.code + '/PLN',
          amount: numericAmount,
          rate: rateObj.mid,
        }),
      });

      setWallets((prev) =>
        prev.map((w) => (w.walletId === res.wallet.walletId ? res.wallet : w))
      );
      setTransactions((prev) => [res.transaction, ...prev]);
      setAmount('');
      setLastMessage('Transaction completed successfully.');
    } catch {
      // hata useApi içinde
    }
  }

  const renderWallet = ({ item }: { item: Wallet }) => (
    <View style={styles.listItem}>
      <Text style={styles.listTitle}>
        {item.currency} – {Number(item.balance).toFixed(2)}
      </Text>
    </View>
  );

  const renderRate = ({ item }: { item: Rate }) => (
    <View style={styles.listItemSmall}>
      <TouchableOpacity
        onPress={() => setSelectedCode(item.code)}
        style={[styles.rateChip, selectedCode === item.code && styles.rateChipSelected]}
      >
        <Text
          style={[
            styles.rateChipText,
            selectedCode === item.code && styles.rateChipTextSelected,
          ]}
        >
          {item.code} ({item.currency}) – {item.mid}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTx = ({ item }: { item: Transaction }) => (
    <View style={styles.listItem}>
      <View style={styles.rowBetween}>
        <Text style={[styles.badge, item.type === 'BUY' ? styles.badgeBuy : styles.badgeSell]}>
          {item.type}
        </Text>
        <Text style={styles.listSubtitle}>
          {new Date(item.createdAt).toLocaleString('en-US')}
        </Text>
      </View>
      <Text style={styles.listTitle}>{item.currencyPair}</Text>
      <Text style={styles.listSubtitle}>
        Amount: {item.amount} | Rate: {item.rate}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <Text style={styles.title}>Hello, {user.name || user.email}</Text>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Wallet</Text>
            <TouchableOpacity onPress={loadAll} style={styles.smallButton} disabled={loading}>
              <Text style={styles.smallButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {wallets.length === 0 ? (
            <Text style={styles.muted}>Wallet not found (demo).</Text>
          ) : (
            <FlatList
              data={wallets}
              keyExtractor={(item) => String(item.walletId)}
              renderItem={renderWallet}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buy / Sell</Text>

          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={[styles.switchButton, tradeType === 'BUY' && styles.switchButtonActive]}
              onPress={() => setTradeType('BUY')}
            >
              <Text style={[styles.switchButtonText, tradeType === 'BUY' && styles.switchButtonTextActive]}>
                Buy (BUY)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, tradeType === 'SELL' && styles.switchButtonActive]}
              onPress={() => setTradeType('SELL')}
            >
              <Text style={[styles.switchButtonText, tradeType === 'SELL' && styles.switchButtonTextActive]}>
                Sell (SELL)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Select Currency</Text>
            <Text style={styles.mutedSmall}>Tap a currency from the list below.</Text>
            <FlatList
              data={rates.slice(0, 15)}
              keyExtractor={(item) => item.code}
              renderItem={renderRate}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="e.g. 100"
              placeholderTextColor="#64748b"
            />
          </View>

          {error && <Text style={styles.errorText}>{String(error)}</Text>}
          {lastMessage && <Text style={styles.successText}>{lastMessage}</Text>}

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleTrade} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Execute Trade</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exchange Rates</Text>
          {rates.length === 0 ? (
            <Text style={styles.muted}>No data available. Please check network or backend.</Text>
          ) : (
            <FlatList
              data={rates.slice(0, 15)}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <View style={styles.listItemSmall}>
                  <Text style={styles.listTitle}>
                    {item.code} – {item.currency}
                  </Text>
                  <Text style={styles.listSubtitle}>mid: {item.mid}</Text>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <Text style={styles.muted}>No transactions yet.</Text>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => String(item.transactionId)}
              renderItem={renderTx}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />;
  }

  return <DashboardScreen user={user} onLogout={() => setUser(null)} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  containerCentered: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#020617',
  },
  titleCentered: {
    color: '#e5e7eb',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    color: '#e5e7eb',
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formGroup: { marginTop: 8, marginBottom: 8 },
  label: { color: '#cbd5f5', fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2933',
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2933',
    paddingHorizontal: 10,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 8,
    color: '#f9fafb',
    fontSize: 14,
  },
  emailSuffix: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 4,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  testButton: {
    marginTop: 8,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    marginTop: 4,
  },
  successText: {
    color: '#6ee7b7',
    fontSize: 13,
    marginTop: 4,
  },
  muted: { color: '#94a3b8', fontSize: 13 },
  mutedSmall: { color: '#94a3b8', fontSize: 11 },
  listItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2933',
  },
  listItemSmall: {
    paddingVertical: 4,
  },
  listTitle: { color: '#e5e7eb', fontSize: 14 },
  listSubtitle: { color: '#9ca3af', fontSize: 12 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeBuy: { backgroundColor: '#16a34a33', color: '#4ade80' },
  badgeSell: { backgroundColor: '#dc262633', color: '#fca5a5' },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  smallButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1d4ed8',
  },
  smallButtonText: { color: '#e5e7eb', fontSize: 11 },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  logoutButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginRight: 6,
  },
  rateChipSelected: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  rateChipText: { color: '#e5e7eb', fontSize: 12 },
  rateChipTextSelected: { color: '#f9fafb', fontWeight: '600' },
  switchButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginRight: 6,
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  switchButtonText: { color: '#e5e7eb', fontSize: 13 },
  switchButtonTextActive: { color: '#f9fafb', fontWeight: '600' },
});