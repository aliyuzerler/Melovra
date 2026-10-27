import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiClient, normalizeBaseUrl, type ServerProject } from '../api/client';
import { colors, fontSize, spacing } from '../theme';

const KEY_BASE = 'melovra.server.base';
const KEY_TOKEN = 'melovra.server.token';

/** Sunucu bağlantısı: web DAW'ınızdaki projeleri görüntüleyin (salt okunur). */
export default function ConnectScreen() {
  const [base, setBase] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<ServerProject[]>([]);
  const [summary, setSummary] = useState<{ name: string; text: string } | null>(null);

  useEffect(() => {
    void (async () => {
      const b = (await AsyncStorage.getItem(KEY_BASE)) ?? '';
      const t = (await AsyncStorage.getItem(KEY_TOKEN)) ?? '';
      setBase(b);
      setToken(t);
    })();
  }, []);

  const connect = useCallback(async () => {
    const url = normalizeBaseUrl(base);
    if (!url) {
      setStatus('err');
      setMessage('Sunucu adresi girin (örn. http://192.168.1.10:3001).');
      return;
    }
    setStatus('busy');
    setMessage('');
    const client = new ApiClient(url, token.trim());
    try {
      await client.health();
      const list = token.trim() ? await client.projects() : [];
      await AsyncStorage.setItem(KEY_BASE, url);
      await AsyncStorage.setItem(KEY_TOKEN, token.trim());
      setProjects(list);
      setStatus('ok');
      setMessage(
        list.length > 0
          ? `Bağlantı başarılı — ${list.length} proje bulundu.`
          : 'Sunucu erişilebilir. Proje listesi için API token girin.',
      );
    } catch (e) {
      setStatus('err');
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }, [base, token]);

  const openSummary = useCallback(
    async (p: ServerProject) => {
      if (!projects.length) return;
      setStatus('busy');
      try {
        const client = new ApiClient(normalizeBaseUrl(base), token.trim());
        const text = await client.projectSummary(p.id);
        setSummary({ name: p.name, text });
        setStatus('ok');
      } catch (e) {
        setStatus('err');
        setMessage(e instanceof Error ? e.message : String(e));
      }
    },
    [base, token, projects.length],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={status === 'busy'} onRefresh={connect} tintColor={colors.accent} />}
    >
      <Text style={styles.title}>Melovra Sunucusuna Bağlan</Text>
      <Text style={styles.desc}>
        Web stüdyonuzu (Node.js sunucusu) aynı ağ üzerinden kullanın. Token'ı web arayüzünde
        Ayarlar → API &amp; MCP bölümünden üretebilirsiniz.
      </Text>

      <Text style={styles.label}>Sunucu adresi</Text>
      <TextInput
        style={styles.input}
        value={base}
        onChangeText={setBase}
        placeholder="http://192.168.1.10:3001"
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      <Text style={styles.label}>API token (gtd_…)</Text>
      <TextInput
        style={styles.input}
        value={token}
        onChangeText={setToken}
        placeholder="gtd_..."
        placeholderTextColor={colors.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
      />

      <Pressable
        onPress={connect}
        style={[styles.btn, status === 'busy' && styles.btnBusy]}
        disabled={status === 'busy'}
      >
        {status === 'busy' ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.btnTxt}>Bağlan</Text>
        )}
      </Pressable>

      {message ? (
        <Text style={[styles.message, status === 'err' ? styles.msgErr : styles.msgOk]}>
          {message}
        </Text>
      ) : null}

      {projects.length > 0 ? (
        <View style={styles.listWrap}>
          <Text style={styles.label}>Projeler</Text>
          {projects.map((p) => (
            <Pressable key={p.id} style={styles.projRow} onPress={() => void openSummary(p)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.projName}>{p.name}</Text>
                <Text style={styles.projMeta}>
                  {p.bpm} BPM · rev {p.rev}
                </Text>
              </View>
              <Text style={styles.projOpen}>Özet →</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {summary ? (
        <View style={styles.summaryWrap}>
          <Text style={styles.summaryTitle}>{summary.name} — Özet</Text>
          <Text style={styles.summaryTxt}>{summary.text}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  desc: { color: colors.textDim, fontSize: fontSize.sm, lineHeight: 20, marginBottom: spacing.sm },
  label: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '700', marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnBusy: { opacity: 0.6 },
  btnTxt: { color: colors.bg, fontWeight: '800', fontSize: fontSize.md },
  message: { fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 19 },
  msgErr: { color: colors.danger },
  msgOk: { color: colors.accent },
  listWrap: { marginTop: spacing.lg, gap: spacing.sm },
  projRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.sm,
  },
  projName: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  projMeta: { color: colors.textDim, fontSize: fontSize.xs, marginTop: 2 },
  projOpen: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '700' },
  summaryWrap: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: spacing.md,
  },
  summaryTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.sm },
  summaryTxt: { color: colors.textDim, fontSize: fontSize.xs, fontFamily: undefined, lineHeight: 18 },
});
