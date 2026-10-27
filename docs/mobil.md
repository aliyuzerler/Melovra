# Mobil Uygulama (React Native)

Melovra'nın mobil uyarlaması, web stüdyosunun çekirdek deneyimini iOS ve Android'e taşır:
**Expo** (React Native) tabanlıdır ve `mobile/` klasöründe yaşar. Bu doküman kurulumu,
özellik kapsamını, mimariyi ve bilinen sınırları anlatır.

## Neden ayrı bir uygulama?

Web stüdyosu Web Audio API'ye dayanır; React Native'de Web Audio yoktur. Mobil uygulama bu
yüzden ses üretimini **sample playback** üzerine kurar (`expo-av`) ve zamanlamayı kendi
lookahead scheduler'ıyla yönetir. Model kavramları (kanal, pattern, playlist) web
sürümüyle aynıdır; böylece iki sürüm arasında kavramsal geçiş zahmetsizdir. Uzun vadeli
hedef, iki sürümün model kodunu ortak bir pakette toplamaktır.

## Özellik kapsamı

| Bölüm | Mobil | Web |
|---|---|---|
| Kanal rafı (6 kanal, hazır sample seti) | ✅ | ✅ (47 enstrüman, ~200 preset) |
| Step sequencer (16 adım) | ✅ | ✅ (groove, fill'ler, choke grupları) |
| Bas/lead için nota satırları (4 pitch) | ✅ | ✅ (tam piano roll) |
| Pattern yönetimi (ekle/klonla/sil, şablonlar) | ✅ | ✅ |
| Playlist (bar bazlı şarkı yapısı) | ✅ | ✅ (audio/otomasyon klipleri, marker'lar) |
| Mikser (volume, mute/solo, pan önizleme) | ✅ | ✅ (EQ, kompresör, send'ler, otomasyon…) |
| Proje kalıcılığı (cihazda) | ✅ | ✅ (sunucuda, sürümlerle) |
| Sunucu bağlantısı | Salt okunur (proje listesi + özet) | Tam |
| MCP / Claude entegrasyonu | — | ✅ (78 araç) |
| Pluginler, uzamsal miksaj, dışa aktarma | — | ✅ |

## Kurulum ve çalıştırma

Gereksinimler: **Node.js 20.19+** ve telefonunuzda (ya da simülatörde) **Expo Go**.

```bash
cd mobile
npm install
npx expo start          # Metro bundler; QR kodu Expo Go ile okutun
```

- Android: `npx expo start --android` (bağlı cihaz/emülatörde açar)
- iOS: `npx expo start --ios`
- Tip denetimi: `npm run typecheck`

Ses dosyaları (`mobile/assets/samples/*.wav`) depoya gömülüdür: kick, snare, hi-hat, clap
ve C minör pentatonik bas/lead notaları. Set, bu depoda Python ile sentezlenmiştir; telif
sorunu yoktur. Kendi sample'larınızı eklemek için `src/audio/engine.ts` içindeki
`sampleMap` haritasına kayıt eklemeniz yeterlidir.

## Mimari

```
src/
├── audio/engine.ts      ses motoru: voice havuzu (her sample için 2 instance,
│                        voice stealing), lookahead scheduler (50 ms tick,
│                        120 ms ileri bakış), playlist/pattern modları
├── api/client.ts        sunucu REST istemcisi — Bearer token (gtd_…) kimlik doğrulama
├── model/               tipler + varsayılan proje, demo pattern'lar, ritim şablonları
├── store/useStudio.ts   zustand stüdyo durumu; tüm değişiklikler AsyncStorage'a yazılır
├── navigation/          alt sekme navigatörü (Stüdyo, Playlist, Mikser, Bağlantı)
└── screens/             ekranlar + TransportBar bileşeni
```

**Zamanlama modeli:** scheduler her 50 ms'de bir uyanır, `60 / bpm / 4` saniyelik adım
aralığıyla 120 ms ileriye bakar ve gelecekteki adımları `setTimeout` ile tetikler. UI
vurgusu (playhead) bir callback üzerinden zustand'a yazılır. Bu model tarayıcı
DAW'larındaki klasik yaklaşımın RN karşılığıdır; sample-accurate zamanlama beklemeyin —
kısa jitter normaldir.

**Kimlik doğrulama:** web sunucusunun kişisel API token'ları kullanılır (web arayüzünde
*Ayarlar → API & MCP*). Token cihazda AsyncStorage'da saklanır ve yalnızca HTTPS ya da
güvenli bir LAN üzerinden gönderilmelidir.

## Sunucuya bağlanma

1. Web stüdyonuzu başlatın ve aynı ağdayken `HOST=0.0.0.0` ile açın
   (bkz. [deployment.md](deployment.md)).
2. Mobil uygulama → **Bağlantı** sekmesi.
3. Sunucu adresini girin (örn. `http://192.168.1.10:3001`) ve isterseniz API token'ınızı
   ekleyin — token'sız yalnızca sağlık kontrolü çalışır.
4. Proje listeniz gelir; bir projeye dokununca düz metin özeti açılır (sunucunun Claude'un
   okuduğu özetle aynıdır).

Mobil uygulama sunucuyu **salt okunur** kullanır: proje çalma/düzenleme MCP ve web
arayüzünün görevidir. Bu bilinçli bir kapsamla sınırlamadır — Ops tabanlı senkronizasyonun
mobilde yeniden uygulanması ayrı bir çalışmadır.

## Bilinen sınırlar

- Zamanlama JS event loop'una bağlıdır; arka plana alındığında sekans askıya alınabilir
  (iOS'ta `UIBackgroundModes: audio` ayarlıdır, ancak Expo Go içinde garanti edilmez).
- `expo-av` stereo pan desteklemez; pan değerleri saklanır ve web sürümüyle uyumlu kalır.
- Ses motoru sample tabanlıdır; web'deki fiziksel modelleme enstrümanları (piano, gitar,
  yaylılar) mobilde bulunmaz.
- E2E testler web uygulamasını hedefler; mobilde tip denetimi (`npm run typecheck`) ve
  manuel QA kullanılır.

## Yol haritası

- `expo-audio`'ya geçiş ve sample-accurate çalma (native audio thread'leri)
- MIDI klavye / USB OTG desteği
- Proje içe/dışa aktarma (sunucuyla iki yönlü senkron)
- RN tarafında tracking ile uzun süreli arka plan çalma
