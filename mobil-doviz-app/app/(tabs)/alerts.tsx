import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_BASE } from '../../src/config';
import { useAuth } from '../../src/AuthContext';
import { useI18n } from '../../src/i18n';

type AlertItem = {
  alertId: number;
  userId: number;
  currencyPair: string;
  direction: string;
  thresholdValue: number;
  isActive: boolean;
  createdAt: string;
};

export default function AlertsScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const userId = user?.userId ?? null;
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('');
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [threshold, setThreshold] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    const uid = user?.userId ?? null;
    if (!uid) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${uid}/alerts`);
      const data = await res.json().catch(() => []);
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load alerts.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const createAlert = async () => {
    const uid = user?.userId ?? null;
    if (!uid) {
      setError('Please log in on the Home tab first.');
      return;
    }
    const code = (currency || '').trim().toUpperCase();
    if (!code || code.length !== 3) {
      setError('Enter a 3-letter currency code (e.g. EUR, USD).');
      return;
    }
    const num = Number(threshold);
    if (Number.isNaN(num) || num <= 0) {
      setError('Enter a valid positive threshold.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/${uid}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyPair: `${code}/PLN`,
          direction,
          thresholdValue: num,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create alert');
      setAlerts((prev) => [...prev, data]);
      setCurrency('');
      setThreshold('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  };

  const deleteAlert = (alertId: number) => {
    const uid = user?.userId ?? null;
    if (!uid) return;
    Alert.alert(t('alerts.delete'), 'Remove this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/users/${uid}/alerts/${alertId}`, { method: 'DELETE' });
            setAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
          } catch {
            setError('Could not delete alert.');
          }
        },
      },
    ]);
  };

  if (!userId && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('alerts.title')}</Text>
        <View style={styles.card}>
          <Text style={styles.muted}>{t('alerts.noAlerts')}</Text>
          <Text style={styles.mutedSmall}>Log in on the Home tab to add rate alerts.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('alerts.title')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('alerts.addAlert')}</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('alerts.currencyPair')}</Text>
          <TextInput
            style={styles.input}
            value={currency}
            onChangeText={setCurrency}
            placeholder="EUR"
            placeholderTextColor="#64748b"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('alerts.direction')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.directionBtn, direction === 'UP' && styles.directionBtnActive]}
              onPress={() => setDirection('UP')}
            >
              <Text style={[styles.directionBtnText, direction === 'UP' && styles.directionBtnTextActive]}>
                {t('alerts.directionUp')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.directionBtn, direction === 'DOWN' && styles.directionBtnActive]}
              onPress={() => setDirection('DOWN')}
            >
              <Text style={[styles.directionBtnText, direction === 'DOWN' && styles.directionBtnTextActive]}>
                {t('alerts.directionDown')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('alerts.threshold')}</Text>
          <TextInput
            style={styles.input}
            value={threshold}
            onChangeText={setThreshold}
            placeholder="4.25"
            placeholderTextColor="#64748b"
            keyboardType="decimal-pad"
          />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={createAlert}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('alerts.create')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('alerts.yourAlerts')}</Text>
        {loading ? (
          <ActivityIndicator color="#3b82f6" style={{ marginVertical: 16 }} />
        ) : alerts.length === 0 ? (
          <Text style={styles.muted}>{t('alerts.noAlerts')}</Text>
        ) : (
          alerts.map((a) => (
            <View key={a.alertId} style={styles.alertRow}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertPair}>{a.currencyPair}</Text>
                <Text style={styles.alertDetail}>
                  {a.direction === 'UP' ? '≥' : '≤'} {a.thresholdValue}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteAlert(a.alertId)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>{t('alerts.delete')}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#f9fafb', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTitle: { color: '#f9fafb', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  formGroup: { marginBottom: 12 },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
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
  row: { flexDirection: 'row', gap: 8 },
  directionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  directionBtnActive: { backgroundColor: '#1e3a5f', borderColor: '#2563eb' },
  directionBtnText: { color: '#94a3b8', fontSize: 13 },
  directionBtnTextActive: { color: '#93c5fd' },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  errorText: { color: '#fca5a5', fontSize: 12, marginTop: 8 },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  alertInfo: { flex: 1 },
  alertPair: { color: '#e5e7eb', fontWeight: '600' },
  alertDetail: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtnText: { color: '#f87171', fontSize: 12 },
  muted: { color: '#94a3b8', fontSize: 13 },
  mutedSmall: { color: '#64748b', fontSize: 11, marginTop: 4 },
});
