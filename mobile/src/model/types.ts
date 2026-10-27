/**
 * Melovra mobil — veri modeli.
 * Web uygulamasındaki modelin (packages/core) mobil için sadeleştirilmiş hali.
 */

/** Kanal türü: davul tek sample, bas/lead çoklu nota sample'ı kullanır. */
export type ChannelKind = 'drum' | 'bass' | 'lead';

export interface Channel {
  id: string;
  name: string;
  kind: ChannelKind;
  /** Bu kanalın kullanabileceği sample'lar (assets/samples altındaki dosya adları, uzantısız). */
  samples: string[];
  /** Her sample için görüntülenecek nota etiketi (davulda tek '—'). */
  labels: string[];
  volume: number; // 0..1
  pan: number; // -1..1 (UI için; expo-av pan desteklemez, stereo dengesi mikserde önizlemedir)
  muted: boolean;
  solo: boolean;
}

/** Bir pattern'de kanalın adım dizisi: null = boş, sayı = sample/pitch indeksi. */
export type StepValue = number | null;

export interface Pattern {
  id: string;
  name: string;
  length: number; // adım sayısı (16 = 1 bar)
  /** channelId -> [StepValue x length] */
  grid: Record<string, StepValue[]>;
}

export interface PlaylistSlot {
  patternId: string;
  bar: number;
}

export interface Project {
  id: string;
  name: string;
  bpm: number;
  channels: Channel[];
  patterns: Pattern[];
  playlist: PlaylistSlot[];
}
