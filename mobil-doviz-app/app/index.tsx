import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { API_BASE } from '../src/config';

export default function Index() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await fetch(API_BASE + '/health');
        const data = await res.json();
        setStatus('ok');
        setMessage(data.message || 'Backend bağlantısı başarılı.');
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Bağlantı hatası.');
      }
    }
    checkBackend();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mobil Döviz Değişim Sistemi</Text>
        <Text style={styles.subtitle}>(Mobil istemci – Backend test ekranı)</Text>

        {status === 'loading' && (
          <View style={styles.card}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.text}>Backend ile bağlantı kuruluyor...</Text>
          </View>
        )}

        {status === 'ok' && (
          <View style={styles.card}>
            <Text style={styles.ok}>✅ Backend çalışıyor</Text>
            <Text style={styles.text}>{message}</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.card}>
            <Text style={styles.error}>❌ Backend’e ulaşılamadı</Text>
            <Text style={styles.text}>{message}</Text>
            <Text style={styles.hint}>
              Bilgisayarında Node backend’in `npm start` ile çalıştığından ve
              API_BASE adresinin doğru olduğundan emin ol.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020617' },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  title: {
    color: '#e5e7eb',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  text: { color: '#e5e7eb', marginTop: 8, textAlign: 'center' },
  ok: { color: '#6ee7b7', fontSize: 16, fontWeight: '600' },
  error: { color: '#fca5a5', fontSize: 16, fontWeight: '600' },
  hint: { color: '#9ca3af', fontSize: 12, marginTop: 8, textAlign: 'center' },
});