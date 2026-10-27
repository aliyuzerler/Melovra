/**
 * Melovra mobil — ses motoru.
 *
 * expo-av Audio.Sound üzerinde sample tabanlı çalışır:
 *  - Her (kanal, nota) için 2 "voice" önceden yüklenir (voice stealing ile tekrar tetikleme).
 *  - Lookahead scheduler: 50 ms tick, 120 ms ileri bakış; step zamanı = 60 / bpm / 4 saniye.
 *  - Zamanlama JS event loop'una bağlıdır; uygulamayı arka plana alınca sekans durur
 *    (arka plan sesi için app.json'da UIBackgroundModes ayarlıdır ama iOS kesin garanti vermez).
 */
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

import type { Channel, Pattern } from '../model/types';

const TICK_MS = 50;
const LOOKAHEAD_S = 0.12;
const VOICES_PER_KEY = 2;

interface Voice {
  sound: Audio.Sound;
  lastTriggeredAt: number;
}

export interface Trigger {
  channelId: string;
  sampleIndex: number;
  velocity: number;
}

export class AudioEngine {
  private voices = new Map<string, Voice[]>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;
  private pattern: Pattern | null = null;
  private channels: Channel[] = [];
  private onStep: ((step: number) => void) | null = null;

  bpm = 96;
  playing = false;
  /** Playlist modu: null = seçili pattern döngüsü. */
  private arrangement: Array<{ patternId: string; bar: number }> | null = null;
  private patternsById = new Map<string, Pattern>();

  /** Sample'ları yükle; kanal listesi değişince tekrar çağırın. */
  async load(channels: Channel[]): Promise<void> {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });

    const wanted = new Map<string, string>(); // key -> sample adı
    for (const ch of channels) {
      ch.samples.forEach((s, i) => wanted.set(`${ch.id}#${i}`, s));
    }

    // artık kullanılmayanları kaldır
    for (const key of [...this.voices.keys()]) {
      if (!wanted.has(key)) {
        for (const v of this.voices.get(key)!) {
          try {
            await v.sound.unloadAsync();
          } catch {
            /* yoksay */
          }
        }
        this.voices.delete(key);
      }
    }

    // yenilerini yükle
    for (const [key, sample] of wanted) {
      if (this.voices.has(key)) continue;
      const list: Voice[] = [];
      for (let i = 0; i < VOICES_PER_KEY; i++) {
        const { sound } = await Audio.Sound.createAsync(
          // Metro statik require istediğinden asset haritası loadSamples ile çözülür
          sampleMap[sample],
          { shouldPlay: false, volume: 1, progressUpdateIntervalMillis: 0 },
        );
        list.push({ sound, lastTriggeredAt: 0 });
      }
      this.voices.set(key, list);
    }

    this.channels = channels;
  }

  setPatterns(patterns: Pattern[]): void {
    this.patternsById = new Map(patterns.map((p) => [p.id, p]));
  }

  setOnStep(cb: (step: number) => void): void {
    this.onStep = cb;
  }

  private stepSeconds(): number {
    return 60 / this.bpm / 4; // 16'lık adım
  }

  start(pattern: Pattern, arrangement: Array<{ patternId: string; bar: number }> | null): void {
    if (this.playing) this.stop();
    this.pattern = pattern;
    this.arrangement = arrangement;
    this.step = 0;
    this.nextStepTime = Date.now() / 1000 + 0.08;
    this.playing = true;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.onStep?.(-1);
  }

  private tick(): void {
    if (!this.playing) return;
    const now = Date.now() / 1000;
    while (this.nextStepTime < now + LOOKAHEAD_S) {
      const delayMs = Math.max(0, (this.nextStepTime - now) * 1000);
      setTimeout(() => this.fireStep(this.step), delayMs);
      this.nextStepTime += this.stepSeconds();
      this.step = this.advance(this.step);
    }
  }

  /** Bir sonraki adımı hesaplar (pattern sonu → playlist ya da döngü). */
  private advance(cur: number): number {
    const pat = this.pattern!;
    const next = cur + 1;
    if (next < pat.length) return next;
    if (this.arrangement && this.arrangement.length > 0) {
      // playlist ilerlemesi: bar bazlı pattern değişimi fireStep içinde yapılır;
      // burada sadece global adım sayacını sıfırla
      return 0;
    }
    return 0;
  }

  private fireStep(globalStep: number): void {
    if (!this.playing) return;

    // Playlist modunda hangi pattern aktif?
    let active = this.pattern!;
    if (this.arrangement && this.arrangement.length > 0) {
      const bar = Math.floor(this.playlistStep / 16);
      const slot = this.lastSlotAtOrBefore(bar);
      if (slot) {
        active = this.patternsById.get(slot.patternId) ?? this.pattern!;
      }
    }
    const stepInBar = this.playlistStep % 16;
    const atStep = this.arrangement ? stepInBar : globalStep;

    if (this.onStep) this.onStep(atStep);

    if (!active.grid) return;

    // solo kontrolü
    const anySolo = this.channels.some((c) => c.solo);

    for (const ch of this.channels) {
      const val = active.grid[ch.id]?.[atStep];
      if (val == null) continue;
      if (ch.muted) continue;
      if (anySolo && !ch.solo) continue;
      this.trigger(ch.id, val, ch.volume);
    }

    if (this.arrangement) {
      this.playlistStep += 1;
      const totalBars = this.arrangement.length;
      if (Math.floor(this.playlistStep / 16) >= totalBars) this.playlistStep = 0;
    }
  }

  private playlistStep = 0;

  private lastSlotAtOrBefore(bar: number): { patternId: string; bar: number } | null {
    let found: { patternId: string; bar: number } | null = null;
    for (const slot of this.arrangement ?? []) {
      if (slot.bar <= bar) {
        if (!found || slot.bar > found.bar) found = slot;
      }
    }
    return found;
  }

  /** Kanal + pitch için sample tetikle (voice stealing ile). */
  trigger(channelId: string, sampleIndex: number, volume: number): void {
    const key = `${channelId}#${sampleIndex}`;
    const list = this.voices.get(key);
    if (!list || list.length === 0) return;
    // en az recently-triggered voice'u seç
    let voice = list[0];
    for (const v of list) {
      if (v.lastTriggeredAt < voice.lastTriggeredAt) voice = v;
    }
    voice.lastTriggeredAt = Date.now();
    void (async () => {
      try {
        await voice.sound.setStatusAsync({ volume: Math.max(0, Math.min(1, volume)), shouldPlay: false });
        await voice.sound.setPositionAsync(0);
        await voice.sound.playAsync();
      } catch {
        // ses tam boşaltıldıysa vs. — sessizce yoksay
      }
    })();
  }

  async dispose(): Promise<void> {
    this.stop();
    for (const list of this.voices.values()) {
      for (const v of list) {
        try {
          await v.sound.unloadAsync();
        } catch {
          /* yoksay */
        }
      }
    }
    this.voices.clear();
  }
}

/**
 * Statik sample haritası — Metro, require çağrılarının statik olması ister.
 * Yeni sample eklerseniz buraya da ekleyin.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const sampleMap: Record<string, () => { uri: string }> = {
  kick: () => require('../../assets/samples/kick.wav'),
  snare: () => require('../../assets/samples/snare.wav'),
  hihat: () => require('../../assets/samples/hihat.wav'),
  clap: () => require('../../assets/samples/clap.wav'),
  bass_C2: () => require('../../assets/samples/bass_C2.wav'),
  bass_Ds2: () => require('../../assets/samples/bass_Ds2.wav'),
  bass_F2: () => require('../../assets/samples/bass_F2.wav'),
  bass_G2: () => require('../../assets/samples/bass_G2.wav'),
  lead_C4: () => require('../../assets/samples/lead_C4.wav'),
  lead_Ds4: () => require('../../assets/samples/lead_Ds4.wav'),
  lead_G4: () => require('../../assets/samples/lead_G4.wav'),
  lead_As4: () => require('../../assets/samples/lead_As4.wav'),
};

export const engine = new AudioEngine();
