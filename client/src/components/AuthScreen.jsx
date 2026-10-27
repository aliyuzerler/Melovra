import { useEffect, useState } from 'react';
import { useStore } from '../state/store.js';

function Field({ label, type = 'text', value, onChange, autoComplete, autoFocus, hint }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input type={type} value={value} autoComplete={autoComplete} autoFocus={autoFocus} spellCheck={false}
        onChange={(e) => onChange(e.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Sign-in, sign-up and first-run setup. */
export function AuthScreen() {
  const auth = useStore((s) => s.auth);
  const st = useStore.getState();
  const [mode, setMode] = useState(auth.phase === 'setup' ? 'setup' : 'login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(auth.error || null);
  useEffect(() => { setError(auth.error || null); }, [auth.error]);

  if (auth.phase === 'loading') {
    return <div className="auth-wrap"><div className="auth-card"><div className="spinner" /></div></div>;
  }
  if (auth.phase === 'offline') {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <Brand />
          <p className="auth-error">Melovra sunucusuna ulaşılamıyor ({auth.error}). Yeniden deneniyor…</p>
          <p className="muted">Çalıştığından emin olun: <code>npm start</code> veya <code>npm run dev</code>.</p>
        </div>
      </div>
    );
  }

  const isSetup = auth.phase === 'setup';
  const current = isSetup ? 'setup' : mode;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if ((current === 'setup' || current === 'register') && password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    setBusy(true);
    try {
      if (current === 'setup') await st.setupAdmin({ username, password, displayName, setupCode });
      else if (current === 'register') await st.signUp({ username, password, displayName });
      else await st.signIn({ username, password });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit} onKeyDown={(e) => e.stopPropagation()}>
        <Brand />
        {current === 'setup' && (
          <>
            <h2>Hoş geldiniz! Yönetici hesabını oluşturun</h2>
            <p className="muted">Bu ilk hesap stüdyoyu yönetir: kullanıcılar, kayıt olma ve MCP erişimi. Projeleriniz hesabınıza özel kalır.</p>
          </>
        )}
        {current === 'login' && <h2>Stüdyonuza giriş yapın</h2>}
        {current === 'register' && <h2>Hesabınızı oluşturun</h2>}
        {current === 'setup' && auth.setupCodeRequired && (
          <Field label="Kurulum kodu" value={setupCode} onChange={setSetupCode} autoComplete="one-time-code" autoFocus
            hint="Sunucu başlarken sunucu günlüğüne yazılır — bu sunucuyu çalıştırdığınızı kanıtlar." />
        )}
        {(current === 'setup' || current === 'register') && (
          <Field label="Görünen ad" value={displayName} onChange={setDisplayName} autoComplete="name" autoFocus={!auth.setupCodeRequired} />
        )}
        <Field label="Kullanıcı adı" value={username} onChange={setUsername} autoComplete="username" autoFocus={current === 'login'}
          hint={current !== 'login' ? '3–32 karakter: harfler, rakamlar, _ . -' : undefined} />
        <Field label="Şifre" type="password" value={password} onChange={setPassword}
          autoComplete={current === 'login' ? 'current-password' : 'new-password'} hint={current !== 'login' ? 'En az 8 karakter' : undefined} />
        {(current === 'setup' || current === 'register') && (
          <Field label="Şifreyi doğrula" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn primary auth-submit" type="submit" disabled={busy || !username || !password}>
          {busy ? 'Lütfen bekleyin…' : current === 'setup' ? 'Yönetici oluştur ve stüdyoyu aç' : current === 'register' ? 'Hesap oluştur' : 'Giriş Yap'}
        </button>
        {!isSetup && auth.allowRegistration && (
          <p className="auth-switch">
            {mode === 'login'
              ? <>Yeni misiniz? <button type="button" className="link" onClick={() => { setMode('register'); setError(null); }}>Hesap oluşturun</button></>
              : <>Zaten hesabınız var mı? <button type="button" className="link" onClick={() => { setMode('login'); setError(null); }}>Giriş Yap</button></>}
          </p>
        )}
        {!isSetup && !auth.allowRegistration && <p className="auth-switch muted">Hesabınız mı gerekiyor? Stüdyo yöneticinize danışın.</p>}
      </form>
    </div>
  );
}

function Brand() {
  return (
    <div className="auth-brand">
      <span className="logo-mark">◆</span>
      <div>
        <div className="auth-title">Melovra</div>
        <div className="auth-sub">Tarayıcınızda beat yapın — Claude ortak yapımcınız olarak</div>
      </div>
    </div>
  );
}
