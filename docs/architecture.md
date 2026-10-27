# Mimari

```
 Browser (React + Web Audio)                     Node.js server                                  Claude
┌────────────────────────────┐   WebSocket /ws  ┌───────────────────────────────┐  /mcp (HTTP)  ┌──────────────┐
│ zustand store ─ applyOps   │◄────────────────►│ Hub (live sync, jobs,         │◄──────────────│ Claude Code  │
│ (optimistic) + undo/redo   │   ops / acks     │      activity, transport)     │   or stdio    │ Claude Desktop│
│ Audio engine (realtime)    │   jobs ◄─────────│ ProjectStore (ops, lock,      │   bridge ────►│ …            │
│ Offline render + analysis  │── job results ──►│      versions, undo)          │               └──────────────┘
│ UI windows                 │   REST /api      │ SampleLibrary (metadata,      │
└────────────────────────────┘◄────────────────►│      analysis worker)         │
                                                │ Users / Sessions / Auth       │
          @melovra/core (shared) ──────────│ MCP tools ─► backend          │
                                                └──────────────┬────────────────┘
                                                               ▼
                                     DATA_DIR: projects/*.json, versions/, samples/, exports/<user>/,
                                               plugins/<user>/, users.json, sessions.json
```

## Paketler

- **`packages/core`** — iki tarafın da kullandığı saf JavaScript: proje modeli ve onarımı (`normalizeProject`),
  op sistemi (`applyOps`, `prepareOps`, `describeOps`), enstrüman/efekt katalogları, müzik teorisi, notasyon
  çözümleyicileri, üreticiler (akorlar, bas hattı, melodiler, roll'lar), şablonlar, MIDI içe/dışa aktarma, WAV codec'i,
  ses analizi ve Claude için okunabilir proje özetleri.
- **`server`** — Express uygulaması, WebSocket hub'ı, store'lar, kimlik doğrulama, REST API ve MCP sunucusu.
- **`client`** — React arayüzü, zustand store, WebSocket senkronizasyonu ve Web Audio motoru.

## Proje modeli

Bir proje düz JSON'dur: `bpm`, `timeSig`, `swing`, `key`, `scale`, `channels[]` (enstrüman + mikser yönlendirmesi),
`patterns[]` (kanal başına notalar), `playlist { tracks[], clips[] }` (pattern/audio/otomasyon clip'leri), `automations[]`
ve `mixer[]` (insert 0 = master; volume, pan, yönlendirme, send'ler, efektler). Zaman tick'lerle ölçülür
(vuruş başına `PPQ = 96`, 16'lık adım başına 24). Diskten yüklenen, içe aktarılan ya da geri yüklenen her şey
`normalizeProject`'ten geçer; bu işlev varsayılanları doldurur, değerleri kırpar, geçersiz referansları düşürür ve
yönlendirme döngülerini kırar.

## Ops: düzenlemenin tek yolu

Her değişiklik — piano roll'daki bir tıklama, bir REST çağrısı, bir MCP aracı — `{ type: 'notes/add', patternId, channelId, notes }`
gibi bir **ops** listesidir. `applyOps`, bir toplu işlemi immer ile atomik olarak doğrular ve uygular (geçersiz bir op
tüm toplu işlemi reddeder). Bir arayüz düzenlemesindeki akış:

1. `store.dispatch(ops)` önce `prepareOps`'ı çalıştırır (id ve renkleri atar), op'ları yerel olarak uygular (iyimser UI),
   geri al geçmişine kaydeder ve socket üzerinden `{ type: 'ops', opId, ops }` gönderir.
2. Sunucunun `ProjectStore.applyOps`'ı düzenlemeleri proje başına sıraya sokar (promise-chain kilidi), hazırlayıp uygular,
   `rev`'i artırır, debounce'lu atomik bir kaydetme planlar ve bir `ops` olayı yayınlar.
3. Hub, gönderene onay döner (`ack`, yeni `rev` ile) ve hazırlanmış op'ları kullanıcının diğer sekmelerine yayınlar.
   id'ler uygulama öncesinde sabitlendiği için her kopya birebir aynı projeyi oluşturur.
4. Sunucu bir op'u reddederse gönderen, yetkili projeyle birlikte `reject` alır ve hâlâ bekleyen düzenlemelerini bunun
   üzerine yeniden uygular. Uzak op'lar, bekleyen yerel op'larla iç içe geçerse istemci outbox'ı boşaldığında bir kez
   yeniden senkronize olur. Ops bağlantı yenilendikten sonra tekrar gönderilir; hub bunları `opId` ile tekilleştirir ve
   add-op'lar idempotent'tir.

MCP düzenlemeleri de aynı yolu izler (`backend.applyOps`); böylece tarayıcıda canlı olarak ve etkinlik günlüğünde
görünürler ve sunucu onlar için bir geri al yığını tutar (`undo` aracı). **Adlandırılmış sürümler**,
`versions/<projectId>/` altındaki tam anlık görüntülerdir.

## Tarayıcı işleri

Bazı işler, yalnızca tarayıcıda var olan Web Audio'ya ihtiyaç duyar. Sunucu, kullanıcının açık sekmelerinden birinden
bu işi yapmasını ister (`server/src/api.js` içindeki `JOB_KINDS`; işleyiciler `client/src/lib/jobs.js` içinde):

| Tür | Sekmenin yaptığı iş | MCP aracı |
|------|-------------------|----------|
| `render` | offline mixdown, miks ve stem'lerin aynı geçişte analizi, isteğe bağlı WAV yükleme | `render_mix` |
| `analyze-sample` | sıkıştırılmış yüklemeyi tarayıcının codec'leriyle çözer ve analiz eder | `analyze_sample` |
| `sound` | bir kanalın tek notasını render eder (kuru ya da insert'i üzerinden) ve pitch, low peak, envelope ölçer | `analyze_sound` |
| `export-stems` | her kanalı tek başına render eder ve her WAV'i `POST /api/jobs/:id/files` ile yükler | `export_stems` |
| `spatial` | 3D miksi 48 kHz'de render eder (binaural, 5.1/7.1/7.1.4, bed + objeler), WAV('leri) yükler; sunucu, objelerin konum JSON'unu sonuçtan yazar (`lib/spatialExport.js`) | `export_spatial` |
| `generator` | generator plugin'inin kodunu getirir ve sandbox iframe'de çalıştırır (`lib/sandbox.js`), notalarını döndürür; sunucu bunları temizler ve op'ları uygular | `run_generator` |
| `sample-edit` | sample'ı kendi örnekleme hızında çözer, düzenleme işlemlerini edit worker'da çalıştırır (`audio/editWorker.js`), sonucu yeni bir sample olarak ya da `PUT /api/samples/:id/file` ile yükler; sample id'sini döndürür | `edit_sample` |

`export_audio`, `render` işini yeniden kullanır (24-bit bir WAV kaydederek); ardından sunucu bunu ffmpeg ile dönüştürür
(`server/src/ffmpeg.js`: yalnızca dosya protokolü, zorlanmış giriş formatı, zaman aşımı, iş limiti) ve ara WAV'i siler.


```
MCP render_mix ─► hub.requestJob(user, job) ─► WS {type:'job'} ─► client lib/jobs.js
   ▲                                                            │ render + analyse (+ WAV)
   └──── result ◄── POST /api/jobs/:id/result (multipart) ◄─────┘   job-progress ─► MCP progress notifications
```

İşler zaman aşımına uğrar, sekme kapanınca hızla başarısız olur ve yalnızca işin sahibi kullanıcının sekmesi
yanıt verebilir.

## Ses motoru (client)

- **Graph**: kanal şeritleri (filter → volume → pan) → mikser insertleri (efekt zinciri → fader → pan → mute → post) →
  yönlendirme/send'ler → master insert → çıkış. Audio clip'ler, ayrılmış bir clip bus'ından master'a gider.
- **Enstrümanlar** nota başına sentezlenir (`audio/instruments.js`, grup enstrümanları `audio/band.js` içinde): her nota,
  kaynaklarının sahibi olan ve release, choke grupları, mono/glide ve hızlı kill destekleyen bir `Voice`'tur. Piano,
  guitar, bass ve pizzicato, **buffer'lara render edilen fiziksel modellerdir** (`audio/models.js`, saf JS):
  `modelPool.js`, projenin çaldığı her notayı arka plandaki Web Worker'larda (`modelWorker.js`) bir LRU önbelleğine
  (≈ 96 MB) önceden ısıtır; offline render'lar onları bekler, hâlâ hazır olmayan bir nota ise anında render edilir.
- **Spatial** (`audio/spatial.js`, koordinatlar/düzenler/ADM `core/spatial.js` içinde): bir `SpatialRig`, 3D obje
  insertlerini stereo yönlendirmenin dışına çıkarır — master'a HRTF `PannerNode`'ları (binaural izleme/dışa aktarma),
  hoparlör başına gain'ler bir `ChannelMerger`'a (5.1/7.1/7.1.4; bed = L/R üzerinde master, objeler master bus'ını atlar)
  ya da obje başına bir merger kanalı (object stem'ler / ADM). Konum otomasyonu panner'ları sürer ya da her otomasyon
  noktasında hoparlör gain'lerini yeniden pan eder.
- **Plugin'ler** (`audio/plugins.js`, manifestler `core/plugins.js`, sunucu tarafı `server/src/plugins.js`): store,
  kullanıcının plugin kaydını tutar; DSP plugin'leri her audio context için bir kez, `/api/plugins/:id/worklet.js`
  adresinden `audioWorklet.addModule()` ile yüklenir (plugin'in kodu çevresinde sunucunun ürettiği bir harness;
  processor adı = id + package hash), her nota normal bir `Voice` içinde bir `AudioWorkletNode` olur (release ve hızlı
  kill için gate/kill AudioParams, kanal başına polifoni sınırı), efektler insert'in slot giriş/çıkışı arasına yerleşen
  worklet düğümleridir (yüklenene kadar pass-through, hata durumunda bypass), sample enstrümanları plugin'in zone'larıyla
  gömülü sample voice'unu kullanır. Offline render'lar önce `await preparePlugins()` yapar. Generator'lar ses motoruna
  hiç dokunmaz: `lib/sandbox.js`, onları `/sandbox/generator.html` iframe'inde (opaque origin, ağ yok) tek kullanımlık
  bir Worker'da çalıştırır. Bkz. [plugins.md](plugins.md).
- **Transport**: ileriye bakan bir zamanlayıcı (25 ms timer, 120 ms ufuk) pattern/şarkı konumlarını ses zamanlarına
  çevirir; loop'ları, swing'i (her 8'liğin bir zaman bükülmesi, her kanalın `swingMix`'iyle ölçeklenir), kanal başına
  `nudge` (ms), tempo değişimlerini ve otomasyonu (her 1/32 notada örneklenir) yönetir.
- **Velocity**: seviye için `velocityGain(v) = v²`, artı enstrüman başına timbre ölçekleme (v = 0.8'de 1'e normalize
  edilir).
- **Sidechain**: `source` kanallı bir pump efekti, o kanalın notalarında ducking yapar — `triggerNote`, her nota için
  `pump.trigger(time)` çağırır (duyulabilirlik kontrolünden önce; böylece mute edilmiş bir ghost kanal da tetikler).
  Realtime'da da offline render'larda da aynı şekilde çalışır.
- **Audio clip'ler** `gain`, `fadeIn`/`fadeOut` (tick) ve `rate` (repitching için çalma hızı) taşır; her clip,
  kenarlarında kısa bir anti-click ramp alır.
- **Offline render** (`audio/render.js`) aynı motoru bir `OfflineAudioContext` üzerinde kurar, `suspend()` kullanarak
  0.5–1 s'lik parçalar hâlinde zamanlar, parçalar arasında bitmiş voice'ları ayırır (uzun şarkılar birkaç kat hızlı
  render edilir) ve **stem'leri aynı geçişte ölçebilir**: her kanalın kendi insertinin ardından gelen analyser tap'ları
  `createLevelMeter`'ı besler (streaming LUFS, peak, RMS, spektrum, genişlik).

## Analiz (core)

`analyzeAudio`; gating'li BS.1770 integrated loudness, short-term/momentary tepe değerleri, EBU R128 loudness range,
sample peak ve **true peak** (tepeye yakın sample'ların çevresinde 4× windowed-sinc interpolasyonu, `createTruePeakMeter`),
RMS/crest, clipping, DC, baş/son sessizliği, stereo korelasyon/genişlik/denge ve **low-end genişliği** (150 Hz altı
side/mid), 4096 noktalı FFT spektrumu (bantlar, centroid, flatness, en güçlü 25–300 Hz frekansının Hz + nota karşılığı),
chroma tabanlı ton (Krumhansl profilleri), spectral-flux onset'ları ve otokorelasyon temposu (güven değeriyle),
one-shot'lar için YIN pitch'i ve bir karakter tahmini hesaplar. `createLevelMeter`, render stem'leri için aynı
loudness/spektrum/low-end metriklerini akış hâlinde sağlar; `envelopeTimes`, tek bir vuruşun attack ve −20/−40/−60 dB
decay sürelerini ölçer. Sonlu olmayan (non-finite) sample'lar sayılır ve sessizlik sayılır. `encodeWav`, 16-bit
(TPDF-dither'lı, tohumlu) ya da 24-bit PCM yazar; çok kanallı ses, hoparlör maskesiyle WAVE_FORMAT_EXTENSIBLE olarak ve
ekstra chunk'larla (Broadcast Wave `bext`, ADM `chna`/`axml`) yazılır.

## Güvenlik modeli

Bkz. [security.md](security.md): her route ve socket mesajında kullanıcı başına sahiplik, scrypt parolalar,
hash'lenmiş oturum id'leri ve API token'ları, origin/host kontrolleri, CSP, hız sınırları, dışarıya açık sunucular için
kurulum kodu ve plugin sandbox'ları.

## Sample'lar: kütüphane, düzenleme, pitch düzeltme, kayıt

- **Kütüphane** (`server/src/samples.js`): `samples/index.json` (sample'lar; `folderId` null = klasörsüz, `rev` = ses
  revizyonu) ve `samples/folders.json` (kullanıcı başına klasörler). `sampleUsage`, kullanıcının projelerini sampler
  kanalları (`params.sampleId`) ve audio clip'leri (`refId`) için tarar. Bir sample'ın sesini değiştirmek id'sini korur
  ve `rev`'i artırır; sample dosyaları değişmez (immutable) olarak önbelleklenir, bu yüzden istemciler
  `/api/samples/:id/file?v=<rev>` ister (`audio/engine.js` içindeki `sampleFileUrl`) ve motor, revizyonu değişen çözülmüş
  sesleri düşürür (`syncSampleLibrary`).
- **Düzenleme** `packages/core` içinde saf JS'tir: `audioedit.js` (clip'ler `{ sampleRate, channels }`; her işlem yeni
  bir clip döndürür — wave editörü eskilerini geri almak için saklar; `applyEdit`, Claude'un gönderdiği adlandırılmış
  işlemi çalıştırır) ve `autotune.js` (~16 kHz'lik bir kopya üzerinde YIN pitch takibi, vibrato'yu yok sayan nota
  bölümlemesi, amount/speed/flatten'dan türeyen kare başına düzeltme eğrisi, formantları koruyan TD-PSOLA yeniden
  sentezi, WSOLA time stretch, pitch shift). Tarayıcı, yavaş olanları `audio/editWorker.js` içinde çalıştırır
  (`lib/audioEdit.js`); aynı kod Node'da unit test edilir.
- **Kayıt** (`lib/recorder.js`, `public/recorder-worklet.js`): mikrofon, stüdyonun kendi AudioContext'ine girer; bir
  AudioWorklet girişi, bağlam karesiyle damgalanmış ~4096 karelik bloklar hâlinde kopyalar, böylece bir take birebir
  yeniden kurulur (bir dropout kayma değil sessizlik olur). Şarkı boyunca transport, count-in'den sonra bilinen bir
  bağlam zamanında başlar (`Transport.play({ at })`) ve loop bölgesi sonun ötesine itilir; take, icracının duyduğuyla
  hizalanması için çıkış + giriş gecikmesi kadar kırpılır, "Recordings" içine WAV olarak kaydedilir ve bir `clip/add`
  op'uyla yerleştirilir.
