import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../state/store.js';
import { api } from '../state/api.js';
import { Window } from './ui/Window.jsx';
import { Icon } from './ui/Icon.jsx';
import { SNAP_OPTIONS, pickFile } from '../lib/actions.js';
import { PLUGIN_PERMISSIONS } from '@melovra/core';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : 'hiç');
const toastError = (e) => useStore.getState().toast(e.message, 'error');

function copy(text, toast) {
  navigator.clipboard?.writeText(text).then(() => toast('Panoya kopyalandı', 'success', 1200), () => toast('Kopyalama başarısız — metni seçip elle kopyalayın', 'warn'));
}

function CopyBlock({ text, secret = false }) {
  const toast = useStore((s) => s.toast);
  return (
    <div className={`copy-block ${secret ? 'secret' : ''}`}>
      <pre>{text}</pre>
      <button type="button" className="btn tiny" onClick={() => copy(text, toast)}><Icon name="copy" size={12} /> Kopyala</button>
    </div>
  );
}

// ------------------------------------------------------------------ Account
function AccountTab() {
  const user = useStore((s) => s.auth.user);
  const st = useStore.getState();
  const [name, setName] = useState(user.displayName);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null);

  const saveName = async () => {
    try {
      const r = await api.updateMe({ displayName: name });
      st.setUser(r.user);
      st.toast('Görünen ad kaydedildi', 'success');
    } catch (e) { st.toast(e.message, 'error'); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (pw.next !== pw.confirm) { setMsg({ error: 'Yeni şifreler eşleşmiyor' }); return; }
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setMsg({ ok: 'Şifre değiştirildi. Diğer cihazların oturumu kapatıldı.' });
    } catch (err) { setMsg({ error: err.message }); }
  };

  return (
    <div className="settings-section">
      <div className="settings-grid">
        <span className="k">Kullanıcı adı</span><span>{user.username}</span>
        <span className="k">Rol</span><span className={`role ${user.role}`}>{user.role}</span>
        <span className="k">Kayıt tarihi</span><span>{fmtDate(user.createdAt)}</span>
      </div>
      <h4>Görünen ad</h4>
      <div className="row">
        <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
        <button className="btn" onClick={saveName} disabled={!name.trim() || name === user.displayName}>Kaydet</button>
      </div>
      <h4>Şifre Değiştir</h4>
      <form className="stack" onSubmit={changePw} onKeyDown={(e) => e.stopPropagation()}>
        <input className="input" type="password" placeholder="Mevcut şifre" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
        <input className="input" type="password" placeholder="Yeni şifre (8+ karakter)" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <input className="input" type="password" placeholder="Yeni şifreyi doğrula" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        {msg?.error && <p className="form-error">{msg.error}</p>}
        {msg?.ok && <p className="form-ok">{msg.ok}</p>}
        <button className="btn" type="submit" disabled={!pw.current || !pw.next}>Şifre Değiştir</button>
      </form>
      <h4>Oturum</h4>
      <button className="btn danger" onClick={() => st.signOut()}>Çıkış Yap</button>
    </div>
  );
}

// ------------------------------------------------------------------ API token & MCP
function ApiTab() {
  const st = useStore.getState();
  const mcpWithoutToken = useStore((s) => s.auth.mcpWithoutToken);
  const [info, setInfo] = useState(undefined);
  const [fresh, setFresh] = useState(null);
  const [busy, setBusy] = useState(false);
  const origin = location.origin;

  const load = useCallback(() => api.getToken().then((r) => setInfo(r.token)).catch(toastError), []);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (info && !(await st.confirm({ title: 'API token yeniden oluşturulsun mu?', message: 'Mevcut token anında geçersiz hale gelir. Kullandığınız her yerde (Claude Desktop, Claude Code, betikler) güncelleyin.', okLabel: 'Yeniden oluştur', danger: true }))) return;
    setBusy(true);
    try {
      const r = await api.generateToken();
      setFresh(r.token);
      setInfo(r.info);
    } catch (e) { st.toast(e.message, 'error'); }
    setBusy(false);
  };
  const remove = async () => {
    if (!(await st.confirm({ title: 'API token silinsin mi?', message: 'Bu tokenı kullanan her şey (MCP istemcileri, betikler) erişimini kaybeder.', okLabel: 'Tokenı sil', danger: true }))) return;
    try {
      await api.deleteToken();
      setInfo(null);
      setFresh(null);
      st.toast('Token silindi', 'success');
    } catch (e) { st.toast(e.message, 'error'); }
  };

  const tok = fresh || '<YOUR_TOKEN>';
  const desktop = JSON.stringify({
    mcpServers: { melovra: { command: 'node', args: ['/path/to/melovra/server/src/mcp/stdio.js'], env: { MELOVRA_URL: origin, ...(info || fresh ? { MELOVRA_TOKEN: tok } : {}) } } }
  }, null, 2);
  const codeCmd = info || fresh
    ? `claude mcp add --transport http melovra ${origin}/mcp --header "Authorization: Bearer ${tok}"`
    : `claude mcp add --transport http melovra ${origin}/mcp`;

  return (
    <div className="settings-section">
      <p className="muted">
        Kişisel API tokenınız, Claude'un (MCP üzerinden) ve betiklerin <b>sizin</b> stüdyonuzda çalışmasını sağlar. Sunucu tokensuz
        MCP'ye izin verdiği sürece isteğe bağlıdır; ancak token kullanmak ek bir güvenlik katmanı sağlar: yalnızca tokenı elinde
        bulunduran istemciler projelerinize erişebilir.
      </p>
      <div className={`notice ${mcpWithoutToken ? 'warn' : 'ok'}`}>
        <Icon name={mcpWithoutToken ? 'link' : 'claude'} size={14} />
        {mcpWithoutToken
          ? 'Bu sunucu, bu bilgisayardan gelen tokensuz MCP bağlantılarını kabul eder (bunlar varsayılan hesap gibi davranır). Ağ üzerinden gelen bağlantılar her zaman token ister. Yöneticiler, Ayarlar → Sunucu bölümünden her yerde token zorunlu kılabilir.'
          : 'Bu sunucu, MCP için bir API token gerektirir.'}
      </div>
      <h4>API token</h4>
      {info === undefined ? <div className="spinner" /> : info ? (
        <div className="token-card">
          <div><code>{info.prefix}••••••••••••</code></div>
          <div className="muted">Oluşturuldu {fmtDate(info.createdAt)} · son kullanım {fmtDate(info.lastUsedAt)}</div>
          <div className="row">
            <button className="btn" onClick={generate} disabled={busy}><Icon name="loop" size={13} /> Yeniden oluştur</button>
            <button className="btn danger" onClick={remove}><Icon name="trash" size={13} /> Sil</button>
          </div>
        </div>
      ) : (
        <div className="token-card">
          <div className="muted">Henüz token yok.</div>
          <button className="btn primary" onClick={generate} disabled={busy}><Icon name="plus" size={13} /> Token oluştur</button>
        </div>
      )}
      {fresh && (
        <div className="fresh-token">
          <b>Yeni tokenınızı şimdi kopyalayın — bir daha gösterilmeyecek.</b>
          <CopyBlock text={fresh} secret />
        </div>
      )}
      <h4>Claude'u bağla</h4>
      <p className="muted">Claude Code (HTTP):</p>
      <CopyBlock text={codeCmd} />
      <p className="muted">Claude Desktop (stdio) — <code>claude_desktop_config.json</code> dosyasına, bu projenin yolunu da ekleyerek ekleyin:</p>
      <CopyBlock text={desktop} />
      <p className="muted">Başlık gönderemeyen istemciler (ör. bazı uzak bağlayıcılar) tokenı URL'nin içine koyabilir — o URL'yi gizli tutun:</p>
      <CopyBlock text={`${origin}/mcp${info || fresh ? `?token=${tok}` : ''}`} />
    </div>
  );
}

// ------------------------------------------------------------------ Studio prefs
/** ON/OFF switch row (defined at module level so re-renders never remount it and steal focus). */
function Toggle({ on, onChange, label, hint }) {
  return (
    <label className="pref">
      <button type="button" className={`toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => onChange(!on)}>{on ? 'ON' : 'OFF'}</button>
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

function StudioTab() {
  const followClaude = useStore((s) => s.followClaude);
  const recordQuantize = useStore((s) => s.recordQuantize);
  const metronome = useStore((s) => s.metronome);
  const kbOctave = useStore((s) => s.kbOctave);
  const snap = useStore((s) => s.snap);
  const st = useStore.getState();
  return (
    <div className="settings-section">
      <Toggle on={followClaude} onChange={(v) => st.setPref('followClaude', v)} label="Claude'u takip et" hint="Claude bir proje oluşturduğunda veya açtığında otomatik olarak aç" />
      <Toggle on={recordQuantize} onChange={(v) => st.setPref('recordQuantize', v)} label="Kaydedilen notaları kuantize et" hint="Klavye / MIDI ile çalınan notaları 16'lık adımlara hizalar" />
      <Toggle on={metronome} onChange={() => st.toggleMetronome()} label="Metronom" hint="Çalarken her vuruşta tık sesi" />
      <label className="pref">
        <select className="ui-select" value={kbOctave} onChange={(e) => st.setPref('kbOctave', Number(e.target.value))} onKeyDown={(e) => e.stopPropagation()}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((o) => <option key={o} value={o}>C{o}</option>)}
        </select>
        <span><b>Bilgisayar klavyesi oktavı</b><small>Z sırasındaki piyano tuşlarının en düşük notası</small></span>
      </label>
      <label className="pref">
        <select className="ui-select" value={snap} onChange={(e) => st.setPref('snap', e.target.value)} onKeyDown={(e) => e.stopPropagation()}>
          {SNAP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span><b>Varsayılan snap</b><small>Piano roll ve playlist için grid</small></span>
      </label>
      <button className="btn" onClick={st.resetLayout}>Pencere düzenini sıfırla</button>
    </div>
  );
}

// ------------------------------------------------------------------ Admin: users
function UsersTab() {
  const st = useStore.getState();
  const me = useStore((s) => s.auth.user);
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'user' });
  const [err, setErr] = useState(null);
  const load = useCallback(() => api.adminUsers().then(setUsers).catch(toastError), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, okMsg) => {
    try { await fn(); if (okMsg) st.toast(okMsg, 'success'); await load(); } catch (e) { st.toast(e.message, 'error'); }
  };
  const create = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.adminCreateUser(form);
      setForm({ username: '', displayName: '', password: '', role: 'user' });
      st.toast('Kullanıcı oluşturuldu', 'success');
      load();
    } catch (x) { setErr(x.message); }
  };

  return (
    <div className="settings-section">
      {!users ? <div className="spinner" /> : (
        <table className="users-table">
          <thead><tr><th>Kullanıcı</th><th>Rol</th><th>Projeler</th><th>Son giriş</th><th /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.disabled ? 'disabled' : ''}>
                <td><b>{u.displayName}</b><br /><span className="muted">@{u.username}{u.id === me.id ? ' (siz)' : ''}{u.disabled ? ' · devre dışı' : ''}{u.apiToken ? ' · token var' : ''}</span></td>
                <td><span className={`role ${u.role}`}>{u.role}</span></td>
                <td>{u.projects}</td>
                <td className="muted">{fmtDate(u.lastLoginAt)}</td>
                <td className="actions">
                  {u.id !== me.id && (
                    <button className="btn tiny" onClick={(e) => st.showContextMenu(e, [
                      { label: u.role === 'admin' ? 'Normal kullanıcı yap' : 'Yönetici yap', onClick: () => act(() => api.adminUpdateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' }), 'Rol güncellendi') },
                      { label: u.disabled ? 'Hesabı etkinleştir' : 'Hesabı devre dışı bırak', onClick: () => act(() => api.adminUpdateUser(u.id, { disabled: !u.disabled }), u.disabled ? 'Etkinleştirildi' : 'Devre dışı bırakıldı (her yerde oturum kapatıldı)') },
                      { label: 'Şifreyi sıfırla…', onClick: async () => {
                        const pw = await st.prompt({ title: `@${u.username} için yeni şifre`, label: 'En az 8 karakter' });
                        if (pw) act(() => api.adminUpdateUser(u.id, { password: pw }), 'Şifre sıfırlandı — kullanıcıyla güvenli bir şekilde paylaşın');
                      } },
                      '-',
                      { label: 'Kullanıcıyı ve verilerini sil…', danger: true, onClick: async () => {
                        if (await st.confirm({ title: `@${u.username} silinsin mi?`, message: `Bu işlem, hesabı, ${u.projects} projeyi ve ${u.samples} sample'ı kalıcı olarak siler.`, danger: true, okLabel: 'Sil' })) {
                          act(() => api.adminDeleteUser(u.id), 'Kullanıcı silindi');
                        }
                      } }
                    ])}>Yönet ▾</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h4>Kullanıcı ekle</h4>
      <form className="stack" onSubmit={create} onKeyDown={(e) => e.stopPropagation()}>
        <div className="row">
          <input className="input" placeholder="Kullanıcı adı" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
          <input className="input" placeholder="Görünen ad" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </div>
        <div className="row">
          <input className="input" type="password" placeholder="Başlangıç şifresi (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          <select className="ui-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="user">Kullanıcı</option>
            <option value="admin">Yönetici</option>
          </select>
        </div>
        {err && <p className="form-error">{err}</p>}
        <button className="btn primary" type="submit" disabled={!form.username || !form.password}>Kullanıcı oluştur</button>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ Admin: server
function ServerTab() {
  const st = useStore.getState();
  const [s, setS] = useState(null);
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.adminSettings().then(setS).catch(toastError);
    api.adminUsers().then(setUsers).catch(() => {});
  }, []);
  const update = async (patch) => {
    try {
      const next = await api.adminUpdateSettings(patch);
      setS(next);
      useStore.setState((x) => ({ auth: { ...x.auth, allowRegistration: next.allowRegistration, mcpWithoutToken: next.mcpWithoutToken } }));
      st.toast('Kaydedildi', 'success', 1200);
    } catch (e) { st.toast(e.message, 'error'); }
  };
  if (!s) return <div className="settings-section"><div className="spinner" /></div>;
  return (
    <div className="settings-section">
      <Toggle on={s.allowRegistration} onChange={(v) => update({ allowRegistration: v })} label="Açık kayıt" hint="Bu sunucuya ulaşabilen herkesin hesap oluşturmasına izin ver" />
      <Toggle on={s.allowPlugins !== false} onChange={(v) => update({ allowPlugins: v }).then(() => useStore.getState().loadPlugins())} label="Pluginlere izin ver" hint="Kullanıcılar kendi enstrüman, efekt ve generator pluginlerini kurabilir (sandbox içinde, yalnızca kendi hesapları için). PLUGINS_ENABLED=false bunları her koşulda kapatır." />
      <label className="pref">
        <button type="button" className={`toggle ${s.mcpWithoutToken ? 'on' : ''}`} aria-pressed={s.mcpWithoutToken} onClick={() => update({ mcpWithoutToken: !s.mcpWithoutToken })}>{s.mcpWithoutToken ? 'ON' : 'OFF'}</button>
        <span><b>Bu bilgisayardan tokensuz MCP'ye izin ver</b><small>Sunucuyu çalıştıran makinedeki Claude Desktop / Claude Code için kullanışlıdır. Yalnızca bu bilgisayardan gelen (localhost'a yapılan) istekler kapsama girer — ağ üzerinden gelen her şey her zaman kişisel bir API token ister. Her yerde token zorunlu kılmak için KAPALI konumuna getirin.</small></span>
      </label>
      <label className="pref">
        <select className="ui-select" value={s.mcpDefaultUserId || ''} disabled={!s.mcpWithoutToken} onChange={(e) => update({ mcpDefaultUserId: e.target.value || null })}>
          <option value="">İlk yönetici</option>
          {users.map((u) => <option key={u.id} value={u.id}>@{u.username}</option>)}
        </select>
        <span><b>Tokensuz MCP şu hesap gibi davranır</b><small>Token olmadan bağlandığında Claude'un kimin stüdyosunu düzenlediği</small></span>
      </label>
    </div>
  );
}

// ------------------------------------------------------------------ Plugins
const TYPE_LABEL = { instrument: 'Enstrüman', effect: 'Efekt', generator: 'Generator' };
const kb = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** What an uploaded plugin asks for, and the trust warning the user must confirm before it's installed. */
function InstallReview({ info, onDone, onCancel }) {
  const [trusted, setTrusted] = useState(false);
  const [busy, setBusy] = useState(false);
  const m = info.manifest;
  const install = async () => {
    setBusy(true);
    try {
      await api.installPlugin(info.token);
      useStore.getState().toast(`${m.name} ${m.version} kuruldu`, 'success');
      onDone();
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  };
  return (
    <div className="plugin-review" role="dialog" aria-label={`${m.name} kurulumu`} data-testid="plugin-review">
      <div className="plugin-warning">
        <Icon name="warn" size={18} />
        <div>
          <b>Yalnızca güvendiğiniz kişilerin pluginlerini kurun.</b>
          <small>
            Bir plugin başkasının kodudur. Melovra onu bir sandbox içinde çalıştırır — ağ yok, hesabınıza, projelerinize,
            dosyalarınıza veya diğer pluginlerin verilerine erişim yok — ve ürettiği her şeyi denetler; ancak kötü niyetli veya
            hatalı bir plugin yine de çok yüksek veya zararlı ses çıkarabilir, çok CPU kullanabilir ya da açıklamasından farklı davranabilir.
          </small>
        </div>
      </div>
      <h4>{m.name} <span className="muted">{m.version}{info.update ? ` (${info.update.from} sürümünden güncelleme)` : ''}</span></h4>
      <div className="settings-grid">
        <span className="k">Tür</span><span>{TYPE_LABEL[m.type]}{m.samples.length ? ` (${m.samples.length} sample)` : ''}</span>
        <span className="k">Yazar</span><span>{m.author || 'bilinmiyor'}</span>
        <span className="k">ID</span><span><code>{m.id}</code></span>
        {m.license && <><span className="k">Lisans</span><span>{m.license}</span></>}
        {m.homepage && <><span className="k">Web sitesi</span><span className="break">{m.homepage}</span></>}
        <span className="k">Boyut</span><span>{info.files.length} dosya, {kb(info.totalBytes)}</span>
        <span className="k">SHA-256</span><span className="break mono small">{info.sha256}</span>
      </div>
      {m.description && <p>{m.description}</p>}
      <h4>İzin istekleri</h4>
      <ul className="perm-list">
        {m.permissions.length ? m.permissions.map((p) => <li key={p}><b>{p}</b> — {PLUGIN_PERMISSIONS[p]}</li>) : <li>sample'larını çalmak dışında bir şey istemiyor</li>}
        <li className="muted">Hiçbir plugine asla verilmeyen: ağ, depolama, hesabınız, dosyalar, diğer projeler.</li>
      </ul>
      <label className="trust-check">
        <input type="checkbox" checked={trusted} onChange={(e) => setTrusted(e.target.checked)} data-testid="plugin-trust" />
        {m.author ? `"${m.author}"` : 'bu pluginin yazarına'} güveniyorum ve kurulmasını istiyorum.
      </label>
      <div className="row">
        <button className="btn primary" disabled={!trusted || busy} onClick={install}>{busy ? 'Kuruluyor…' : info.update ? 'Plugini güncelle' : 'Plugini kur'}</button>
        <button className="btn" onClick={onCancel} disabled={busy}>İptal</button>
      </div>
    </div>
  );
}

function PluginsTab() {
  const plugins = useStore((s) => s.plugins);
  const errors = useStore((s) => s.pluginErrors);
  const isAdmin = useStore((s) => s.auth.user?.role === 'admin');
  const [review, setReview] = useState(null);
  const st = useStore.getState();
  useEffect(() => { useStore.getState().loadPlugins(); }, []);
  const choose = async () => {
    const f = await pickFile('.zip,application/zip');
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f, f.name);
    try { setReview(await api.inspectPlugin(fd)); } catch (e) { toastError(e); }
  };
  const done = () => { setReview(null); st.loadPlugins(); };
  if (!plugins.allowed) {
    return (
      <div className="settings-section">
        <p className="notice warn"><Icon name="warn" size={14} /> Pluginler bu sunucuda kapalı.{isAdmin ? ' Ayarlar → Sunucu bölümünden açabilirsiniz (PLUGINS_ENABLED=false atanmadıysa).' : ' Açması için bir yöneticiye sorun.'}</p>
      </div>
    );
  }
  return (
    <div className="settings-section plugins-settings">
      <p className="muted">Kendi enstrümanlarınızı, efektlerinizi ve nota generatorlarınızı ekleyin (<code>plugin.json</code> içeren .zip paketleri). Her plugin yalnızca sizin hesabınız için kurulur. Nasıl yazılacağını öğrenin: <code>docs/plugins.md</code>.</p>
      {review
        ? <InstallReview info={review} onDone={done} onCancel={() => setReview(null)} />
        : <button className="btn primary" onClick={choose} data-testid="plugin-install"><Icon name="upload" size={13} /> Plugin kur…</button>}
      <h4>Kurulu ({plugins.plugins.length})</h4>
      {!plugins.plugins.length && <p className="empty-hint">Henüz plugin yok.</p>}
      <div className="plugin-list">
        {plugins.plugins.map((p) => (
          <div key={p.id} className={`plugin-row ${p.enabled ? '' : 'off'}`} data-testid={`plugin-${p.id}`}>
            <span className="plugin-dot" style={{ background: p.manifest.color }} />
            <div className="plugin-info">
              <b>{p.name}</b> <span className="muted">{p.version} · {TYPE_LABEL[p.type]}{p.manifest.author ? ` · ${p.manifest.author}` : ''}</span>
              <small>{p.manifest.description}</small>
              <small className="perm-chips">{p.manifest.permissions.map((x) => <span key={x} className="chip">{x}</span>)}</small>
              {errors[p.id] && <small className="form-error">{errors[p.id]}</small>}
            </div>
            <button type="button" className={`toggle ${p.enabled ? 'on' : ''}`} aria-pressed={p.enabled} title={p.enabled ? 'Devre dışı bırak' : 'Etkinleştir'}
              onClick={async () => { try { await api.setPluginEnabled(p.id, !p.enabled); st.loadPlugins(); } catch (e) { toastError(e); } }}>{p.enabled ? 'ON' : 'OFF'}</button>
            <button className="tbtn small" title="Kaldır" onClick={async () => {
              if (!(await st.confirm({ title: `${p.name} kaldırılsın mı?`, message: 'Onu kullanan kanallar sessize döner ve efekt slotları sesi olduğu gibi geçirir. Ayarları korunur; yeniden kurmak eski haline getirir.', danger: true, okLabel: 'Kaldır' }))) return;
              try { await api.removePlugin(p.id); st.loadPlugins(); } catch (e) { toastError(e); }
            }}><Icon name="trash" size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Audio export (ffmpeg)
function ExportTab() {
  const info = useStore((s) => s.exportFormats);
  const isAdmin = useStore((s) => s.auth.user?.role === 'admin');
  const [busy, setBusy] = useState(false);
  useEffect(() => { useStore.getState().loadExportFormats(); }, []);
  const recheck = async () => {
    setBusy(true);
    await useStore.getState().loadExportFormats(true);
    setBusy(false);
  };
  if (!info) return <div className="settings-section"><div className="spinner" /></div>;
  const { ffmpeg, formats } = info;
  return (
    <div className="settings-section export-settings">
      <div className={`ffmpeg-status ${ffmpeg.available ? 'ok' : 'missing'}`} data-testid="ffmpeg-status">
        <Icon name={ffmpeg.available ? 'check' : 'warn'} size={16} />
        <div>
          <b>{ffmpeg.available ? `ffmpeg ${ffmpeg.version} kullanılabilir` : 'ffmpeg kullanılamıyor'}</b>
          <small>
            {ffmpeg.available
              ? 'Sunucu, çıktılarınızı MP3, AAC, Ogg, Opus, FLAC, Apple Lossless ve AIFF formatlarına dönüştürür (Dosya → Parçayı farklı dışa aktar…). Claude da isteyebilir (list_export_formats, export_audio).'
              : `${ffmpeg.reason || 'Bulunamadı'}. WAV dışa aktarma onsuz da çalışır. Diğer formatları etkinleştirmek için sunucuya ffmpeg kurun (apt install ffmpeg · brew install ffmpeg · winget install ffmpeg) ya da FFMPEG_PATH ile yolunu gösterin, sonra yeniden kontrol edin. Docker imajında hazır gelir.`}
          </small>
        </div>
        {isAdmin && <button className="btn" onClick={recheck} disabled={busy}>{busy ? 'Kontrol ediliyor…' : 'Yeniden kontrol et'}</button>}
      </div>
      <table className="export-formats">
        <thead><tr><th>Format</th><th>Kalite</th><th>Durum</th></tr></thead>
        <tbody>
          {formats.map((f) => (
            <tr key={f.id} className={f.available ? '' : 'off'}>
              <td><b>{f.label}</b><small>{f.description}</small></td>
              <td>{f.bitrates ? `${f.bitrates[0]}–${f.bitrates.at(-1)} kbps (varsayılan ${f.defaultBitrate})` : f.id === 'wav' ? '16 veya 24-bit' : 'kayıpsız, 16/24-bit'}</td>
              <td>{f.available ? <span className="ok-badge">{f.encoder ? f.encoder : 'yerleşik'}</span> : <span className="off-badge" title={f.reason}>kullanılamıyor</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ffmpeg.checkedAt && <p className="muted">Kontrol edildi {fmtDate(ffmpeg.checkedAt)}.</p>}
    </div>
  );
}

const TABS = [
  ['account', 'Hesap', 'user'],
  ['api', 'API & MCP', 'key'],
  ['studio', 'Stüdyo', 'music'],
  ['export', 'Ses Dışa Aktarma', 'download'],
  ['plugins', 'Pluginler', 'plugin'],
  ['users', 'Kullanıcılar', 'rack', true],
  ['server', 'Sunucu', 'gear', true]
];

export function Settings() {
  const user = useStore((s) => s.auth.user);
  const tab = useStore((s) => s.settingsTab) || 'account';
  if (!user) return null;
  const tabs = TABS.filter(([, , , admin]) => !admin || user.role === 'admin');
  return (
    <Window name="settings" title="Ayarlar" icon="gear" minW={420} minH={320} className="settings">
      <div className="settings-layout">
        <nav className="settings-tabs" role="tablist">
          {tabs.map(([k, label, icon]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => useStore.setState({ settingsTab: k })}>
              <Icon name={icon} size={14} /> {label}
            </button>
          ))}
        </nav>
        <div className="settings-body">
          {tab === 'account' && <AccountTab />}
          {tab === 'api' && <ApiTab />}
          {tab === 'studio' && <StudioTab />}
          {tab === 'export' && <ExportTab />}
          {tab === 'plugins' && <PluginsTab />}
          {tab === 'users' && user.role === 'admin' && <UsersTab />}
          {tab === 'server' && user.role === 'admin' && <ServerTab />}
        </div>
      </div>
    </Window>
  );
}
