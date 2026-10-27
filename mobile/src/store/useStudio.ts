/**
 * Melovra mobil — stüdyo durumu (zustand).
 * Proje AsyncStorage'da saklanır; transport ses motorunu yönlendirir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { engine } from '../audio/engine';
import {
  buildStarterPattern,
  clonePattern,
  defaultProject,
  makePattern,
} from '../model/factory';
import type { Channel, Pattern, Project } from '../model/types';

const STORAGE_KEY = 'melovra.project.v1';

interface StudioState {
  project: Project;
  playing: boolean;
  mode: 'pattern' | 'song';
  currentStep: number;
  currentPatternId: string;
  loaded: boolean;

  hydrate: () => Promise<void>;
  persist: () => Promise<void>;

  play: () => void;
  stop: () => void;
  setMode: (mode: 'pattern' | 'song') => void;

  toggleStep: (channelId: string, step: number, pitchIndex?: number) => void;
  setBpm: (bpm: number) => void;
  renameProject: (name: string) => void;

  setChannelProp: (channelId: string, patch: Partial<Channel>) => void;
  previewChannel: (channelId: string) => void;

  addPattern: (kind?: 'davul' | 'lofi' | 'house') => void;
  duplicatePattern: (patternId: string) => void;
  deletePattern: (patternId: string) => void;
  selectPattern: (patternId: string) => void;
  renamePattern: (patternId: string, name: string) => void;
  clearPattern: (patternId: string) => void;

  setPlaylistBar: (bar: number, patternId: string) => void;
  setPlaylistBars: (bars: number) => void;
  playlistBars: number;
}

export const useStudio = create<StudioState>((set, get) => ({
  project: defaultProject(),
  playing: false,
  mode: 'pattern',
  currentStep: -1,
  currentPatternId: '',
  playlistBars: 8,
  loaded: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const project = JSON.parse(raw) as Project;
        if (project && Array.isArray(project.channels) && project.channels.length > 0) {
          set({ project, loaded: true, currentPatternId: project.patterns[0]?.id ?? '' });
          await engine.load(project.channels);
          engine.setPatterns(project.patterns);
          return;
        }
      }
    } catch {
      /* bozuk kayıt — varsayılana dön */
    }
    const project = defaultProject();
    set({ project, loaded: true, currentPatternId: project.patterns[0].id });
    await engine.load(project.channels);
    engine.setPatterns(project.patterns);
  },

  persist: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().project));
    } catch {
      /* depolama dolu olabilir */
    }
  },

  play: () => {
    const { project, mode, currentPatternId, playlistBars } = get();
    engine.bpm = project.bpm;
    engine.setOnStep((step) => set({ currentStep: step }));
    if (mode === 'song') {
      const slots = project.playlist.slice(0, playlistBars);
      engine.start(project.patterns[0], slots);
    } else {
      const pat = project.patterns.find((p) => p.id === currentPatternId) ?? project.patterns[0];
      engine.start(pat, null);
    }
    set({ playing: true });
  },

  stop: () => {
    engine.stop();
    set({ playing: false, currentStep: -1 });
  },

  setMode: (mode) => set({ mode }),

  toggleStep: (channelId, step, pitchIndex = 0) => {
    const { project, currentPatternId, persist } = get();
    const pat = project.patterns.find((p) => p.id === currentPatternId) ?? project.patterns[0];
    const row = [...pat.grid[channelId]];
    row[step] = row[step] === pitchIndex ? null : pitchIndex;
    const patterns = project.patterns.map((p) =>
      p.id === pat.id ? { ...p, grid: { ...p.grid, [channelId]: row } } : p,
    );
    const next = { ...project, patterns };
    set({ project: next });
    if (row[step] != null) {
      const ch = project.channels.find((c) => c.id === channelId);
      if (ch) engine.trigger(channelId, pitchIndex, ch.volume);
    }
    void persist();
  },

  setBpm: (bpm) => {
    const bpmClamped = Math.max(40, Math.min(240, Math.round(bpm)));
    engine.bpm = bpmClamped;
    const next = { ...get().project, bpm: bpmClamped };
    set({ project: next });
    void get().persist();
  },

  renameProject: (name) => {
    set({ project: { ...get().project, name } });
    void get().persist();
  },

  setChannelProp: (channelId, patch) => {
    const channels = get().project.channels.map((c) =>
      c.id === channelId ? { ...c, ...patch } : c,
    );
    set({ project: { ...get().project, channels } });
    void get().persist();
  },

  previewChannel: (channelId) => {
    const ch = get().project.channels.find((c) => c.id === channelId);
    if (ch) engine.trigger(ch.id, 0, ch.volume);
  },

  addPattern: (kind) => {
    const { project, persist } = get();
    const pat = kind ? buildStarterPattern(project.channels, kind) : makePattern(project.channels, 16, 'Pattern');
    const next = { ...project, patterns: [...project.patterns, pat] };
    set({ project: next, currentPatternId: pat.id });
    engine.setPatterns(next.patterns);
    void persist();
  },

  duplicatePattern: (patternId) => {
    const { project } = get();
    const src = project.patterns.find((p) => p.id === patternId);
    if (!src) return;
    const copy = clonePattern(src);
    const next = { ...project, patterns: [...project.patterns, copy] };
    set({ project: next, currentPatternId: copy.id });
    engine.setPatterns(next.patterns);
    void get().persist();
  },

  deletePattern: (patternId) => {
    const { project } = get();
    if (project.patterns.length <= 1) return;
    const patterns = project.patterns.filter((p) => p.id !== patternId);
    const playlist = project.playlist.filter((s) => s.patternId !== patternId);
    const next = { ...project, patterns, playlist };
    set({
      project: next,
      currentPatternId:
        get().currentPatternId === patternId ? patterns[0].id : get().currentPatternId,
    });
    engine.setPatterns(patterns);
    void get().persist();
  },

  selectPattern: (patternId) => set({ currentPatternId: patternId }),

  renamePattern: (patternId, name) => {
    const patterns = get().project.patterns.map((p) => (p.id === patternId ? { ...p, name } : p));
    set({ project: { ...get().project, patterns } });
    void get().persist();
  },

  clearPattern: (patternId) => {
    const patterns = get().project.patterns.map((p) => {
      if (p.id !== patternId) return p;
      const grid: Pattern['grid'] = {};
      for (const k of Object.keys(p.grid)) grid[k] = new Array(p.length).fill(null);
      return { ...p, grid };
    });
    set({ project: { ...get().project, patterns } });
    void get().persist();
  },

  setPlaylistBar: (bar, patternId) => {
    const { project, playlistBars } = get();
    const playlist = [...project.playlist];
    playlist[bar] = { patternId, bar };
    const next = { ...project, playlist };
    set({ project: next });
    if (bar + 1 > playlistBars) set({ playlistBars: bar + 1 });
    void get().persist();
  },

  setPlaylistBars: (bars) => {
    const clamped = Math.max(1, Math.min(64, bars));
    const { project } = get();
    const playlist = [...project.playlist];
    while (playlist.length < clamped) {
      playlist.push({ patternId: project.patterns[0].id, bar: playlist.length });
    }
    set({ project: { ...project, playlist }, playlistBars: clamped });
    void get().persist();
  },
}));
