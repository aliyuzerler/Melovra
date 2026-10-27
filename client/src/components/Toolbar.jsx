import { useRef } from 'react';
import { TEMPLATES, PPQ, STEP, ticksPerBar, SPATIAL_EXPORTS, SPATIAL_EXPORT_IDS } from '@melovra/core';
import { useStore } from '../state/store.js';
import { api } from '../state/api.js';
import { Icon } from './ui/Icon.jsx';
import { Knob } from './ui/Knob.jsx';
import { DragNumber } from './ui/Controls.jsx';
import { Visualizer } from './Visualizer.jsx';
import { usePlayheadTick } from '../lib/hooks.js';
import {
  newPattern, clonePattern, renamePattern, deletePattern, exportWav, exportAs, exportStemsFromUi, exportSpatialFromUi, exportMidi, exportProjectJson,
  importProjectJson, importMidi
} from '../lib/actions.js';
import { connectMidi } from '../lib/midiInput.js';
import { APP_NAME, APP_VERSION } from '../lib/version.js';

/** File → Export song as…: the formats the server's ffmpeg can make (the rest shown disabled, with the reason). */
function exportFormatItems(info) {
  if (!info) return [{ label: 'Sunucuda ffmpeg kontrol ediliyor…', disabled: true }];
  const items = info.formats.filter((f) => f.id !== 'wav').map((f) => ({
    label: `${f.label}${f.bitrates ? ` (${f.defaultBitrate} kbps)` : f.lossless ? ' (24-bit)' : ''}${f.available ? '' : ' — ffmpeg gerekli'}`,
    disabled: !f.available,
    onClick: () => exportAs(f.id)
  }));
  const lossy = info.formats.filter((f) => f.available && f.bitrates);
  const more = lossy.map((f) => ({ label: `${f.label} olarak…`, submenu: f.bitrates.map((b) => ({ label: `${b} kbps`, checked: b === f.defaultBitrate, onClick: () => exportAs(f.id, { bitrate: b }) })) }));
  return [
    { header: info.ffmpeg.available ? `ffmpeg ${info.ffmpeg.version} ile` : 'Sunucuda ffmpeg mevcut değil' },
    ...items,
    ...(more.length ? ['-', ...more] : []),
    '-',
    { label: 'Ses dışa aktarma ayarları…', onClick: () => { useStore.setState({ settingsTab: 'export' }); useStore.getState().openWindow('settings'); } }
  ];
}

function TimeDisplay() {
  const project = useStore((s) => s.project);
  const tick = usePlayheadTick(30);
  const t = tick ?? 0;
  const bar = ticksPerBar(project);
  const b = Math.floor(t / bar);
  const beat = Math.floor((t - b * bar) / PPQ);
  const step = Math.floor((t - b * bar - beat * PPQ) / STEP);
  const secs = (t / PPQ) * (60 / project.bpm);
  return (
    <div className="time-display" title="Şarkı konumu (ölçü : vuruş : adım)">
      <span className="time-main">{String(b + 1).padStart(3, ' ')}:{beat + 1}:{String(step + 1).padStart(2, '0')}</span>
      <span className="time-sub">{Math.floor(secs / 60)}:{String(Math.floor(secs % 60)).padStart(2, '0')}</span>
    </div>
  );
}

function TapTempo() {
  const taps = useRef([]);
  const dispatch = useStore((s) => s.dispatch);
  return (
    <button className="tbtn small tap" title="Tap tempo" onClick={() => {
      const now = performance.now();
      taps.current = taps.current.filter((t) => now - t < 2500);
      taps.current.push(now);
      if (taps.current.length >= 3) {
        const d = taps.current.slice(1).map((t, i) => t - taps.current[i]);
        const bpm = Math.round(60000 / (d.reduce((a, b) => a + b, 0) / d.length));
        dispatch([{ type: 'project/update', patch: { bpm: Math.max(40, Math.min(300, bpm)) } }], { coalesce: 'tap' });
      }
    }}>TAP</button>
  );
}

export function Toolbar() {
  const project = useStore((s) => s.project);
  const mode = useStore((s) => s.mode);
  const playing = useStore((s) => s.playing);
  const recording = useStore((s) => s.recording);
  const metronome = useStore((s) => s.metronome);
  const selectedPatternId = useStore((s) => s.selectedPatternId);
  const windows = useStore((s) => s.windows);
  const browserOpen = useStore((s) => s.browserOpen);
  const connected = useStore((s) => s.connected);
  const claudeActive = useStore((s) => s.claudeActive);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const midiStatus = useStore((s) => s.midiStatus);
  const st = useStore.getState();

  const fileMenu = (e) => st.showContextMenu(e, [
    { header: 'Proje' },
    { label: 'Şablondan yeni', submenu: Object.entries(TEMPLATES).map(([key, t]) => ({ label: t.label, onClick: async () => {
      const name = await st.prompt({ title: 'Yeni proje', value: key === 'empty' || key === 'default' ? 'İsimsiz' : t.label.split(' (')[0] });
      if (name !== null) st.createProject({ name: name || 'İsimsiz', template: key });
    } })) },
    { label: 'Projeyi yeniden adlandır…', onClick: async () => {
      const name = await st.prompt({ title: 'Projeyi yeniden adlandır', value: project.name });
      if (name) st.dispatch([{ type: 'project/update', patch: { name } }]);
    } },
    { label: 'Ölçü işareti…', onClick: async () => {
      const v = await st.prompt({ title: 'Ölçü işareti', value: project.timeSig.join('/'), label: 'Ölçü başına vuruş / vuruş birimi (örn. 4/4, 3/4, 6/8)' });
      const m = /^(\d+)\s*\/\s*(\d+)$/.exec(v || '');
      if (m) st.dispatch([{ type: 'project/update', patch: { timeSig: [Number(m[1]), Number(m[2])] } }]);
    } },
    { label: 'Sürümler…', onClick: () => st.openWindow('versions') },
    { label: 'Kopyasını kaydet', onClick: async () => {
      const p = await api.duplicateProject(project.id, `${project.name} (copy)`);
      st.refreshProjects();
      st.toast(`Kopya kaydedildi: "${p.name}"`, 'success');
    } },
    '-',
    { header: 'Dışa Aktar' },
    { label: 'Şarkıyı WAV olarak dışa aktar', submenu: [
      { label: '16-bit (ditherli, paylaşım için)', onClick: () => exportWav('song', { bitDepth: 16 }) },
      { label: '24-bit (mastering için)', onClick: () => exportWav('song', { bitDepth: 24 }) }
    ] },
    { label: 'Şarkıyı farklı formatta dışa aktar…', submenu: exportFormatItems(st.exportFormats) },
    { label: 'Pattern loop\'unu WAV olarak dışa aktar', onClick: () => exportWav('pattern') },
    { label: 'Stemleri dışa aktar (her kanal, Dışa Aktarımlar bölümüne)', onClick: exportStemsFromUi },
    { label: 'Spatial miks (3D) dışa aktar…', submenu: SPATIAL_EXPORT_IDS.map((k) => ({ label: SPATIAL_EXPORTS[k].label, onClick: () => exportSpatialFromUi(k) })) },
    { label: 'MIDI dışa aktar (şarkı)', onClick: () => exportMidi('song') },
    { label: 'Proje dosyası dışa aktar (.json)', onClick: exportProjectJson },
    '-',
    { header: 'İçe Aktar' },
    { label: 'Geçerli pattern\'e MIDI içe aktar…', onClick: importMidi },
    { label: 'Proje dosyası içe aktar…', onClick: importProjectJson },
    '-',
    { label: 'Ayarlar…', onClick: () => st.openWindow('settings') },
    { label: 'Claude\'a bağlan (API token ve MCP)…', onClick: () => { useStore.setState({ settingsTab: 'api' }); st.openWindow('settings'); } },
    { label: 'Claude\'u takip et (projelerini otomatik aç)', checked: st.followClaude, onClick: () => st.setPref('followClaude', !st.followClaude) },
    { label: 'Pencere düzenini sıfırla', onClick: st.resetLayout },
    { label: 'Klavye kısayolları ve yardım', onClick: () => st.openWindow('help') },
    { label: `${APP_NAME} Hakkında…`, onClick: () => st.showAbout() }
  ]);

  const user = useStore.getState().auth.user;
  const initials = (user?.displayName || user?.username || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const userMenu = (e) => st.showContextMenu(e, [
    { header: `${user.displayName} (@${user.username})` },
    { label: 'Hesap ayarları', onClick: () => { useStore.setState({ settingsTab: 'account' }); st.openWindow('settings'); } },
    { label: 'API token ve MCP', onClick: () => { useStore.setState({ settingsTab: 'api' }); st.openWindow('settings'); } },
    user.role === 'admin' && { label: 'Kullanıcıları yönet', onClick: () => { useStore.setState({ settingsTab: 'users' }); st.openWindow('settings'); } },
    '-',
    { label: 'Çıkış yap', onClick: () => st.signOut() }
  ].filter(Boolean));

  const patternMenu = (e) => st.showContextMenu(e, [
    { label: 'Yeni pattern', shortcut: 'F4', onClick: () => newPattern() },
    { label: 'Pattern\'i çoğalt', onClick: () => clonePattern(selectedPatternId) },
    { label: 'Yeniden adlandır…', onClick: () => renamePattern(selectedPatternId) },
    { label: 'Sil', danger: true, onClick: () => deletePattern(selectedPatternId) }
  ]);

  const master = project.mixer[0];
  const winBtn = (name, icon, label, key) => (
    <button className={`tbtn win ${windows[name]?.open ? 'active' : ''}`} title={`${label} (${key})`} onClick={() => st.toggleWindow(name)}>
      <Icon name={icon} size={16} />
    </button>
  );

  return (
    <div className="toolbar" role="toolbar">
      <div className="tb-group">
        <button className="tbtn logo" onClick={fileMenu} title="Menü">
          <span className="logo-mark">◆</span><span className="logo-text">Melovra</span><Icon name="chevronDown" size={12} />
        </button>
        <button className="tbtn" title="Geri Al (Ctrl+Z)" disabled={!canUndo} onClick={st.undo}><Icon name="undo" /></button>
        <button className="tbtn" title="Yinele (Ctrl+Y)" disabled={!canRedo} onClick={st.redo}><Icon name="redo" /></button>
      </div>

      <div className="tb-group transport">
        <div className="mode-switch" role="radiogroup" aria-label="Çalma modu">
          <button role="radio" aria-checked={mode === 'pattern'} className={mode === 'pattern' ? 'on pat' : ''} onClick={() => st.setMode('pattern')} title="Pattern modu: seçili pattern'i looplar (Shift+L ile değişir)">PAT</button>
          <button role="radio" aria-checked={mode === 'song'} className={mode === 'song' ? 'on song' : ''} onClick={() => st.setMode('song')} title="Şarkı modu: playlist'i çalar (Shift+L ile değişir)">SONG</button>
        </div>
        <button className={`tbtn play ${playing ? 'active' : ''}`} title="Oynat / Durdur (Boşluk)" onClick={st.togglePlay}>
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </button>
        <button className="tbtn" title="Durdur" onClick={st.stop}><Icon name="stop" size={16} /></button>
        <button className={`tbtn rec ${recording ? 'active' : ''}`} title="Kayıt Al: çalarken bilgisayar klavyesinde / MIDI'de çaldığın notalar pattern'e yazılır" onClick={() => useStore.setState({ recording: !recording })}>
          <Icon name="record" size={16} />
        </button>
        <button className="tbtn mic" title="Ses kaydı (mikrofon): kaydediciyi açar" aria-label="Ses kaydı" onClick={() => st.toggleWindow('recorder')}>
          <Icon name="mic" size={16} />
        </button>
        <div className="tempo" title="Tempo (BPM)">
          <DragNumber value={project.bpm} min={20} max={400} step={1} sensitivity={0.3}
            format={(v) => v.toFixed(v % 1 ? 2 : 0)} className="tempo-num"
            onChange={(v) => st.dispatch([{ type: 'project/update', patch: { bpm: v } }], { coalesce: 'bpm' })} />
          <span className="tempo-label">BPM</span>
        </div>
        <TapTempo />
        <button className={`tbtn metro ${metronome ? 'active' : ''}`} title="Metronom" onClick={st.toggleMetronome}><Icon name="metronome" /></button>
        <TimeDisplay />
      </div>

      <div className="tb-group pattern-pick">
        <button className="tbtn small" title="Önceki pattern" onClick={() => {
          const i = project.patterns.findIndex((p) => p.id === selectedPatternId);
          if (i > 0) st.selectPattern(project.patterns[i - 1].id);
        }}>‹</button>
        <select className="ui-select pattern-select" value={selectedPatternId || ''} onChange={(e) => st.selectPattern(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()} title="Geçerli pattern">
          {project.patterns.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="tbtn small" title="Sonraki pattern" onClick={() => {
          const i = project.patterns.findIndex((p) => p.id === selectedPatternId);
          if (i < project.patterns.length - 1) st.selectPattern(project.patterns[i + 1].id);
        }}>›</button>
        <button className="tbtn small" title="Pattern seçenekleri" onClick={patternMenu}><Icon name="plus" size={14} /></button>
      </div>

      <div className="tb-group">
        <Knob value={master.volume} min={0} max={1.25} def={1} size={28} title={`Master ses düzeyi ${Math.round(master.volume * 100)}%`}
          onChange={(v) => st.dispatch([{ type: 'mixer/update', index: 0, patch: { volume: v } }], { coalesce: 'mastervol' })} />
        <Visualizer />
      </div>

      <div className="tb-group windows">
        <button className={`tbtn win ${browserOpen ? 'active' : ''}`} title="Browser (Alt+F8)" onClick={() => st.setPref('browserOpen', !browserOpen)}><Icon name="folder" /></button>
        {winBtn('playlist', 'playlist', 'Playlist', 'F5')}
        {winBtn('channelRack', 'rack', 'Kanal Rafı', 'F6')}
        {winBtn('pianoRoll', 'piano', 'Piano roll', 'F7')}
        {winBtn('mixer', 'mixer', 'Mikser', 'F9')}
        {winBtn('channelSettings', 'sliders', 'Kanal ayarları', 'F8')}
        <button className={`tbtn win ${windows.spatial?.open ? 'active' : ''}`} title="Spatial mikser (3D / Atmos tarzı)" onClick={() => st.toggleWindow('spatial')}><Icon name="spatial" size={16} /></button>
        <button className={`tbtn win ${windows.settings?.open ? 'active' : ''}`} title="Ayarlar" onClick={() => st.toggleWindow('settings')}><Icon name="gear" /></button>
      </div>

      <div className="tb-group status">
        <button className={`tbtn small ${midiStatus ? 'active' : ''}`} title={midiStatus || 'MIDI klavye bağla'} onClick={connectMidi}><Icon name="midi" /></button>
        <span className={`claude-indicator ${claudeActive ? 'active' : ''}`} title={claudeActive ? 'Claude düzenliyor…' : 'Claude (MCP) düzenlemeleri burada canlı görünür'}>
          <Icon name="claude" size={14} />{claudeActive ? 'Claude düzenliyor…' : ''}
        </span>
        <span className={`conn ${connected ? 'ok' : 'down'}`} title={connected ? 'Sunucuya bağlı (canlı senkron)' : 'Bağlantı kesildi — yeniden bağlanılıyor…'} />
        <button className="tbtn small about-btn" title={`${APP_NAME} Hakkında (sürüm ${APP_VERSION})`} aria-label={`${APP_NAME} Hakkında`} data-testid="about-button" onClick={() => st.showAbout()}>
          <Icon name="info" size={16} />
        </button>
        <button className="avatar" title={`${user?.displayName} — hesap menüsü`} onClick={userMenu} aria-label="Hesap menüsü">{initials}</button>
      </div>
    </div>
  );
}
