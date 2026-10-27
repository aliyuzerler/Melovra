import type { Channel, Pattern, Project } from './types';

/** Varsayılan kanal rafı — sentetik sample setiyle gelir. */
export function defaultChannels(): Channel[] {
  return [
    {
      id: 'kick',
      name: 'Kick',
      kind: 'drum',
      samples: ['kick'],
      labels: ['—'],
      volume: 0.9,
      pan: 0,
      muted: false,
      solo: false,
    },
    {
      id: 'snare',
      name: 'Trampet',
      kind: 'drum',
      samples: ['snare'],
      labels: ['—'],
      volume: 0.75,
      pan: 0,
      muted: false,
      solo: false,
    },
    {
      id: 'hihat',
      name: 'Hi-hat',
      kind: 'drum',
      samples: ['hihat'],
      labels: ['—'],
      volume: 0.55,
      pan: 0.2,
      muted: false,
      solo: false,
    },
    {
      id: 'clap',
      name: 'Clap',
      kind: 'drum',
      samples: ['clap'],
      labels: ['—'],
      volume: 0.7,
      pan: -0.2,
      muted: false,
      solo: false,
    },
    {
      id: 'bass',
      name: 'Bas',
      kind: 'bass',
      samples: ['bass_C2', 'bass_Ds2', 'bass_F2', 'bass_G2'],
      labels: ['C2', 'D♯2', 'F2', 'G2'],
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
    },
    {
      id: 'lead',
      name: 'Lead',
      kind: 'lead',
      samples: ['lead_C4', 'lead_Ds4', 'lead_G4', 'lead_As4'],
      labels: ['C4', 'D♯4', 'G4', 'A♯4'],
      volume: 0.65,
      pan: 0,
      muted: false,
      solo: false,
    },
  ];
}

let patternCounter = 0;

export function makePatternId(): string {
  patternCounter += 1;
  return `p${Date.now().toString(36)}${patternCounter}`;
}

export function emptyGrid(channels: Channel[], length: number): Pattern['grid'] {
  const grid: Pattern['grid'] = {};
  for (const ch of channels) {
    grid[ch.id] = new Array(length).fill(null);
  }
  return grid;
}

export function makePattern(channels: Channel[], length = 16, name = 'Pattern'): Pattern {
  return { id: makePatternId(), name, length, grid: emptyGrid(channels, length) };
}

function clonePattern(p: Pattern): Pattern {
  const grid: Pattern['grid'] = {};
  for (const [k, v] of Object.entries(p.grid)) grid[k] = [...v];
  return { ...p, id: makePatternId(), grid };
}

/** Demo beat: şarkı haline getirilmiş üç pattern (Güneyli trap-afro karışımı). */
export function defaultProject(): Project {
  const channels = defaultChannels();

  const p1: Pattern = makePattern(channels, 16, 'Taşıyıcı');
  // Kick: 4-on-the-floor değil, trap-afro hybrid
  [0, 6, 10].forEach((s) => (p1.grid.kick[s] = 0));
  // Snare: 4 ve 12
  [4, 12].forEach((s) => (p1.grid.snare[s] = 0));
  // Hi-hat: her adım, 16'lık his
  for (let s = 0; s < 16; s++) p1.grid.hihat[s] = s % 4 === 2 ? 0 : 0;
  // Clap: 7
  p1.grid.clap[7] = 0;
  // Bas: pentatonik groove
  p1.grid.bass[0] = 0;
  p1.grid.bass[3] = 2;
  p1.grid.bass[6] = 3;
  p1.grid.bass[8] = 0;
  p1.grid.bass[11] = 1;
  p1.grid.bass[14] = 3;

  const p2: Pattern = makePattern(channels, 16, 'Tepe Nokta');
  [0, 4, 8, 12].forEach((s) => (p2.grid.kick[s] = 0));
  [4, 12].forEach((s) => (p2.grid.snare[s] = 0));
  for (let s = 0; s < 16; s += 2) p2.grid.hihat[s] = 0;
  p2.grid.clap[4] = 0;
  p2.grid.clap[12] = 0;
  [0, 2, 4, 7, 8, 10, 12, 15].forEach((s, i) => {
    p2.grid.lead[s] = [0, 1, 2, 3, 2, 1, 3, 0][i % 8];
  });
  [0, 6, 10, 14].forEach((s) => (p2.grid.bass[s] = 0));

  const p3: Pattern = makePattern(channels, 16, 'Kopuş');
  [0, 3, 7, 10, 13].forEach((s) => (p3.grid.kick[s] = 0));
  p3.grid.snare[8] = 0;
  p3.grid.clap[12] = 0;
  for (let s = 0; s < 16; s++) p3.grid.hihat[s] = 0;
  p3.grid.lead[2] = 3;
  p3.grid.lead[6] = 1;
  p3.grid.lead[10] = 2;
  p3.grid.lead[14] = 0;

  return {
    id: 'local',
    name: 'Yeni Proje',
    bpm: 96,
    channels,
    patterns: [p1, p2, p3],
    playlist: [
      { patternId: p1.id, bar: 0 },
      { patternId: p1.id, bar: 1 },
      { patternId: p2.id, bar: 2 },
      { patternId: p3.id, bar: 3 },
      { patternId: p2.id, bar: 4 },
      { patternId: p2.id, bar: 5 },
      { patternId: p3.id, bar: 6 },
      { patternId: p2.id, bar: 7 },
    ],
  };
}

/** Şablon pattern'ları — hızlı başlangıç için hazır ritimler. */
export function buildStarterPattern(channels: Channel[], kind: 'davul' | 'lofi' | 'house'): Pattern {
  const p = makePattern(channels, 16, kind === 'davul' ? 'Davul Temeli' : kind === 'lofi' ? 'Lo-fi' : 'House');
  if (kind === 'house') {
    [0, 4, 8, 12].forEach((s) => (p.grid.kick[s] = 0));
    [2, 6, 10, 14].forEach((s) => (p.grid.hihat[s] = 0));
    [4, 12].forEach((s) => (p.grid.clap[s] = 0));
    [0, 3, 6, 8, 11, 14].forEach((s) => (p.grid.bass[s] = 0));
  } else if (kind === 'lofi') {
    [0, 7, 10].forEach((s) => (p.grid.kick[s] = 0));
    [4, 12].forEach((s) => (p.grid.snare[s] = 0));
    for (let s = 0; s < 16; s += 4) p.grid.hihat[s] = 0;
    [0, 8].forEach((s) => (p.grid.bass[s] = 2));
    [4, 11].forEach((s) => (p.grid.lead[s] = 1));
  } else {
    [0, 6, 10].forEach((s) => (p.grid.kick[s] = 0));
    [4, 12].forEach((s) => (p.grid.snare[s] = 0));
    for (let s = 0; s < 16; s++) if (s % 2 === 0) p.grid.hihat[s] = 0;
    [0, 8].forEach((s) => (p.grid.bass[s] = 0));
  }
  return p;
}

export { clonePattern };
