# Melovra Mobil

Pattern tabanlı DAW **Melovra**'nın React Native (Expo) uyarlaması. Web stüdyosunun çekirdek
deneyimini — kanal rafı, step sequencer, pattern'lar, playlist ve mikser — telefonunuza taşır.

## Özellikler

- **Stüdyo**: 6 kanallı raf (Kick, Trampet, Hi-hat, Clap, Bas, Lead), 16 adımlı step
  sequencer; bas ve lead kanallarında 4'lü nota satırı (C minör pentatonik)
- **Pattern'lar**: sınırsız pattern, klonlama, hazır ritim şablonları (Davul Temeli,
  Lo-fi, House); demo proje ile hazır gelir
- **Playlist**: pattern'ları bar'lara dizerek 64 bar'a kadar şarkı yapısı; "Şarkı" modunda
  uçtan uca çalma
- **Mikser**: kanal ses seviyesi, sessize/solo, pan önizlemesi
- **Sunucu bağlantısı**: Melovra web sunucusuna (aynı ağ) bağlanıp projelerinizi ve
  düz metin özetlerini görüntüleyin (salt okunur)
- **Kalıcılık**: proje AsyncStorage'da saklanır; uygulamayı kapatıp açınca kaldığınız yerden
  devam edersiniz
- Ses motoru: `expo-av` üzerinde sample tabanlı çalışma zamanı; lookahead scheduler
  (50 ms tick, 120 ms ileri bakış) ve voice stealing

## Çalıştırma

```bash
cd mobile
npm install
npx expo start        # Metro bundler; QR kod ile Expo Go'da açın
npx expo start --android   # bağlı Android cihaz/emülatörde
npx expo start --ios       # bağlı iOS cihaz/simülatörde
```

Ses dosyaları (`assets/samples/*.wav`) depoya gömülüdür; ek indirme gerekmez. Yerleşik
sample seti bu depoda Python ile sentezlenmiştir (Kick/Trampet/Hi-hat/Clap + bas ve lead
notaları), telif sorunu yoktur.

## Sınırlar (beta)

- Zamanlama JS event loop'una bağlıdır; ağır render'larda ufak jitter olabilir.
- `expo-av` stereo pan desteklemez; pan değerleri saklanır, web sürümüyle senkronize edilir.
- MCP / Claude entegrasyonu yalnızca web stüdyosundadır; mobil uygulama sunucuya salt
  okunur bağlanır.
- Gerçek zamanlı sentez yerine sample playback kullanılır; sample setini `src/audio/engine.ts`
  içindeki `sampleMap` üzerinden genişletebilirsiniz.

## Klasör Yapısı

```
mobile/
├── App.tsx                    # giriş
├── index.ts                   # registerRootComponent
├── assets/
│   ├── icon.png, splash.png…  # uygulama görselleri
│   └── samples/*.wav          # gömülü sample seti
└── src/
    ├── audio/engine.ts        # ses motoru (scheduler + voice yönetimi)
    ├── api/client.ts          # sunucu REST istemcisi (Bearer token)
    ├── model/                 # tipler + varsayılan proje/demo pattern'lar
    ├── store/useStudio.ts     # zustand stüdyo durumu + AsyncStorage kalıcılığı
    ├── navigation/            # alt sekme navigasyonu
    ├── screens/               # Stüdyo, Playlist, Mikser, Bağlantı
    └── components/            # TransportBar
```

## Tip denetimi

```bash
npm run typecheck
```
