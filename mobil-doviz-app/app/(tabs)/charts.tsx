import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { API_BASE } from '../../src/config';
import { useI18n } from '../../src/i18n';

const CHART_COLORS = { line: '#3b82f6', grid: '#334155', text: '#e5e7eb', muted: '#94a3b8' };
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 40;
const CHART_WIDTH = SCREEN_WIDTH - 32 - CHART_PADDING * 2;
const CHART_HEIGHT = 200;

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];

export default function ChartsScreen() {
  const { t } = useI18n();
  const [code, setCode] = useState('EUR');
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Array<{ date: string; mid: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_BASE}/rates/history/${code}?days=${days}`, {
        signal: controller.signal,
      });
      clearTimeout(tid);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.rates || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [code, days]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const points = data.map((r) => r.mid);
  const min = points.length ? Math.min(...points) : 0;
  const max = points.length ? Math.max(...points) : 1;
  const range = max - min || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('charts.title')}</Text>

      <View style={styles.currencyRow}>
        <Text style={styles.label}>{t('charts.selectCurrency')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {CURRENCY_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCode(c)}
              style={[styles.chip, code === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, code === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.daysRow}>
        {[7, 30, 93].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDays(d)}
            style={[styles.daysBtn, days === d && styles.daysBtnActive]}
          >
            <Text style={[styles.daysBtnText, days === d && styles.daysBtnTextActive]}>
              {t('charts.lastDays', { count: d })}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={CHART_COLORS.line} />
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadHistory} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && data.length > 0 && (
        <View style={styles.card}>
          <View style={styles.chartContainer}>
            <View style={styles.chartInner}>
              {data.map((r, i) => {
                const h = ((r.mid - min) / range) * (CHART_HEIGHT - 20);
                return (
                  <View
                    key={`${r.date}-${i}`}
                    style={[
                      styles.bar,
                      {
                        height: Math.max(4, h),
                        width: Math.max(2, (CHART_WIDTH - 2) / data.length - 2),
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabelMuted}>{min.toFixed(4)}</Text>
              <Text style={styles.chartLabelMuted}>{max.toFixed(4)}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesRow}>
            {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map((r) => (
              <Text key={r.date} style={styles.dateText}>
                {r.date}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}

      {!loading && !error && data.length === 0 && (
        <Text style={styles.muted}>{t('charts.noData')}</Text>
      )}

      {!loading && data.length > 0 && (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>{code}/PLN – {t('charts.lastDays', { count: days })}</Text>
          {data.slice(0, 10).map((r) => (
            <View key={r.date} style={styles.listRow}>
              <Text style={styles.listDate}>{r.date}</Text>
              <Text style={styles.listRate}>{r.mid.toFixed(4)}</Text>
            </View>
          ))}
          {data.length > 10 && (
            <Text style={styles.muted}>... and {data.length - 10} more</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#f9fafb', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  currencyRow: { marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { color: '#e5e7eb', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  daysBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  daysBtnActive: { backgroundColor: '#1e3a5f', borderColor: '#2563eb' },
  daysBtnText: { color: '#94a3b8', fontSize: 12 },
  daysBtnTextActive: { color: '#93c5fd' },
  centered: { padding: 40, alignItems: 'center' },
  errorBox: { backgroundColor: '#1f2937', borderRadius: 10, padding: 14, marginBottom: 12 },
  errorText: { color: '#fca5a5', marginBottom: 8 },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  retryBtnText: { color: '#60a5fa' },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  chartContainer: { marginBottom: 8 },
  chartInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    paddingHorizontal: 4,
  },
  bar: { backgroundColor: CHART_COLORS.line, borderRadius: 2 },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  chartLabelMuted: { color: CHART_COLORS.muted, fontSize: 10 },
  datesRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  dateText: { color: CHART_COLORS.muted, fontSize: 10 },
  listCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  listTitle: { color: '#e5e7eb', fontWeight: '600', marginBottom: 10 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  listDate: { color: CHART_COLORS.muted, fontSize: 12 },
  listRate: { color: CHART_COLORS.text, fontSize: 12 },
  muted: { color: CHART_COLORS.muted, fontSize: 13 },
});
