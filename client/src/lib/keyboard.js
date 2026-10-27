// Global keyboard: transport/window shortcuts and the "typing keyboard to piano".
import { useStore } from '../state/store.js';
import { newPattern } from './actions.js';

// Two rows: Z-row = lower octave, Q-row = upper octave
const PIANO = {
  KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11,
  Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16,
  KeyQ: 12, Digit2: 13, KeyW: 14, Digit3: 15, KeyE: 16, KeyR: 17, Digit5: 18, KeyT: 19, Digit6: 20, KeyY: 21,
  Digit7: 22, KeyU: 23, KeyI: 24, Digit9: 25, KeyO: 26, Digit0: 27, KeyP: 28, BracketLeft: 29, Equal: 30, BracketRight: 31
};

// physical key -> { key, channelId } captured at key-down, so key-up releases the same note even if
// the octave or selected channel changed while the key was held
const heldKeys = new Map();

function isTyping(e) {
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}

export function installKeyboard() {
  const down = (e) => {
    if (isTyping(e)) return;
    const st = useStore.getState();
    if (!st.project) return;
    const mod = e.ctrlKey || e.metaKey;
    if (st.modal) return;

    if (mod && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) st.redo(); else st.undo(); return; }
    if (mod && e.code === 'KeyY') { e.preventDefault(); st.redo(); return; }
    if (mod && e.code === 'KeyS') { e.preventDefault(); st.toast('Projeler otomatik kaydedilir', 'info', 1800); return; }
    if (mod) return; // leave other ctrl shortcuts to focused editors / browser

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        st.unlockAudio();
        st.togglePlay();
        return;
      case 'F5': e.preventDefault(); st.toggleWindow('playlist'); return;
      case 'F6': e.preventDefault(); st.toggleWindow('channelRack'); return;
      case 'F7': e.preventDefault(); st.toggleWindow('pianoRoll'); return;
      case 'F8':
        e.preventDefault();
        if (e.altKey) st.setPref('browserOpen', !st.browserOpen);
        else st.toggleWindow('channelSettings');
        return;
      case 'F9': e.preventDefault(); st.toggleWindow('mixer'); return;
      case 'F4': e.preventDefault(); newPattern(); return;
      case 'Escape': st.hideContextMenu(); return;
      default:
    }
    if (e.altKey) return;
    if (e.code === 'KeyL' && e.shiftKey) { st.setMode(st.mode === 'song' ? 'pattern' : 'song'); return; }
    if (e.code === 'NumpadAdd' || (e.code === 'ArrowUp' && e.shiftKey && !e.target.closest?.('.piano-roll'))) {
      const i = st.project.patterns.findIndex((p) => p.id === st.selectedPatternId);
      if (i < st.project.patterns.length - 1) st.selectPattern(st.project.patterns[i + 1].id);
      return;
    }
    if (e.code === 'NumpadSubtract') {
      const i = st.project.patterns.findIndex((p) => p.id === st.selectedPatternId);
      if (i > 0) st.selectPattern(st.project.patterns[i - 1].id);
      return;
    }
    if (e.target.closest?.('.piano-roll-grid, .playlist-grid') && ['Delete', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
    if (e.code === 'ArrowDown' && e.shiftKey) return;
    if (e.code === 'Minus' && !e.repeat) { const o = Math.max(0, st.kbOctave - 1); st.setPref('kbOctave', o); st.toast(`Klavye oktavı C${o}`, 'info', 1000); return; }
    if (e.code === 'Equal' && e.shiftKey && !e.repeat) { const o = Math.min(8, st.kbOctave + 1); st.setPref('kbOctave', o); st.toast(`Klavye oktavı C${o}`, 'info', 1000); return; }
    if (e.shiftKey) return;
    const semi = PIANO[e.code];
    if (semi !== undefined) {
      e.preventDefault();
      if (e.repeat || heldKeys.has(e.code)) return;
      const key = (st.kbOctave + 1) * 12 + semi;
      if (key <= 127 && st.selectedChannelId) {
        heldKeys.set(e.code, { key, channelId: st.selectedChannelId });
        st.liveNoteOn(key, 0.8, st.selectedChannelId);
      }
    }
  };
  const up = (e) => {
    const h = heldKeys.get(e.code);
    if (!h) return;
    heldKeys.delete(e.code);
    useStore.getState().liveNoteOff(h.key, h.channelId);
  };
  const blur = () => {
    heldKeys.clear();
    useStore.getState().finishRecordingNotes();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}

export const SHORTCUTS = [
  ['Space', 'Oynat / durdur'],
  ['Shift+L', 'Pattern / şarkı modu arasında geçiş yap'],
  ['F4', 'Yeni pattern'],
  ['F5 / F6 / F7 / F8 / F9', 'Playlist / Kanal Rafı / Piano Roll / Kanal Ayarları / Mikser'],
  ['Alt+F8', 'Tarayıcıyı aç / kapat'],
  ['Ctrl+Z / Ctrl+Y', 'Geri al / yinele (Claude\'un düzenlemeleri de geri alınır)'],
  ['Z S X D C V … / Q 2 W 3 E …', 'Seçili kanalı bilgisayar klavyesinden çal (iki oktav)'],
  ['- / Shift+=', 'Klavye oktavı aşağı / yukarı'],
  ['Numpad + / -', 'Sonraki / önceki pattern'],
  ['Channel rack: Ctrl+click a channel light', 'Kanalı solo yap'],
  ['Piano roll: click / drag', 'Nota çiz, sürükleyerek taşı, sağ kenardan sürükleyerek boyutlandır, sağ tıkla sil'],
  ['Piano roll: Shift+click / Ctrl+drag', 'Seçime ekle / alan seçimi yap'],
  ['Piano roll: Alt+drag', 'Sürüklenen notaları çoğalt'],
  ['Piano roll: Ctrl+A, Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+D, Del', 'Tümünü seç, kopyala, kes, yapıştır, çoğalt, sil'],
  ['Piano roll: Ctrl+Q', 'Quantize et (seçim veya tümü)'],
  ['Piano roll: ↑ ↓ (Shift = octave), ← →', 'Seçili notaları transpoze et / ince kaydır'],
  ['Playlist: click / drag', 'Seçili patterni boyay, klipleri sürükle; kenarlar boyutlandırır/kırpır, seçenekler için sağ tıkla'],
  ['Playlist: Shift+drag, Ctrl+A, Ctrl+D, Del', 'Klipleri çoğalt, tümünü seç, seçimi çoğalt, sil'],
  ['Wave editor: drag / Shift+click / double-click', 'Bir aralık seç / uzat / her şeyi seç'],
  ['Wave editor: Space, Ctrl+Z, Ctrl+Shift+Z', 'Seçimi oynat; geri al / yinele (editörün kendi geçmişi)'],
  ['Wave editor: Ctrl+X, Ctrl+C, Ctrl+V, Ctrl+A, Del, + / −', 'Kes, kopyala, yapıştır, tümünü seç, sil, yakınlaştır'],
  ['Pitch correction: drag a note (Alt = fine), ↑ ↓, 0, B, [ ], Esc', 'Taşı, ince kaydır, gamına geri döndür, bypass, önceki / sonraki nota, seçimden çık'],
  ['Knobs & faders', 'Yukarı/aşağı sürükle (Shift = ince), tekerlek, sıfırlamak için çift tık; odak için Tab, sonra ok tuşları, Home/End, Delete']
];
