# Yol haritası ve ürün incelemesi

Melovra, salt okunur **müzik endüstrisi danışmanı** ajanı (`.claude/agents/music-industry-advisor.md`) tarafından incelenir: 20+ yıllık deneyime sahip, kodu okuyan ve müziği neden yayınlanmaya hazır duymadığını söyleyen bir prodüktör / mix-mastering mühendisi / A&R / DAW ürün lideri. Bu sayfa incelemeyi ve buna karşılık yapılanları kaydeder; böylece bir sonraki geliştirme turu açık kalan maddelerden başlar.

## İnceleme 1 — değerlendirme

> Bir yapay zekâ yardımcı prodüktörü olan tarayıcı tabanlı bir beat eskiz aracı olarak bu, şimdiden alışılmadık ölçüde tam: op tabanlı model, araç seti, roma rakamlı armoni, step-string davullar ve BS.1770'e uygun `render_mix` döngüsü, çoğu hobi DAW'ın asla sunamadığı şeylerdir. Sesi "iyi demo" seviyesinde tutan şey, iş akışı değil sinyal yoluydu: yalnızca sentezle üretilen davullar, temel bir master limiter, yalnızca grid'e bağlı ducking ve doğrusal velocity. Bunları düzeltin ve Claude'a sayısal mix hedefleri verin; yayınlanmaya hazırlığa kalan mesafe dramatik biçimde kapanır.

## Buna karşılık yapılanlar

(Yollar: `core/` = `packages/core/src/`, `client/` = `client/src/`, `mcp/` = `server/src/mcp/`.)

| Öneri | Ne değişti | Nerede |
|---|---|---|
| Velocity eğrisi ve velocity → timbre | karesel velocity eğrisi (≈ 40 dB aralık); snare, hat, clap, kick click, synth filter, FM index, sampler cutoff için yumuşak = karanlık | `client/src/audio/instruments.js` |
| Nota ile tetiklenen sidechain | `pump` bir `source` kanalı alır ve onun her notasında ducking yapar (susturulmuş ghost kanalları ve canlı notalar dahil) | `core/effects.js`, `client/audio/effects.js`, `engine.triggerNote` |
| Master zinciri | limiter clip aşaması 4× oversampled, makeup telafisi eşikten hesaplanır, varsayılan tavan −1 dB; true-peak ölçer; 16-bit için TPDF dither; 24-bit dışa aktarmalar | `client/audio/effects.js`, `core/analysis.js`, `core/wav.js` |
| Kanal başına groove | kanal başına `nudge` (ms) ve `swingMix`; swing sürekli bir zaman bükümüdür, böylece humanize edilmiş notalar swing'lerini korur | `core/model.js`, `core/timeline.js`, Transport |
| Reverb kalitesi | bağımsız L/R'li tohumlu IR, erken yansımalar (`size`), frekansa bağlı decay; convolver seviyesini normalleştirir; yalnızca bir knob durma noktasına gelince yeniden kurulur | `client/audio/effects.js` |
| Voicing'ler ve bir bas dili | `add_chords` voicing'leri (open, drop2, drop3, spread, shell, rootless), çevrim (inversion) ve register; `add_bassline` derece hatları; bağlar (ties), aksanlar, ghost'lar ve 808 kaymalarıyla | `core/builders.js`, `mcp/tools/notes.js` |
| Miksin temel bileşenleri | EQ high-/low-pass (düz Butterworth), kompresör `mix` (paralel; dry yol, kompresörün tam-frame 6 ms look-ahead'i kadar geciktirilir), stereo `monoBelow` (Linkwitz-Riley crossover), high-pass'li rezonanssız delay geri besleme filtreleri, 4× oversampled distorsiyon | efektler |
| Bölümler, fill'ler, geçişler | proje **marker'ları** (+ `set_markers`, `arrange_song` tarafından oluşturulur), `add_fill`, `add_transition` (riser'lar, downlifter'lar, swell'ler, snare build'leri, crash'ler, sub drop'lar, impact'ler) | `core/ops.js`, `mcp/tools/production.js`, Playlist cetveli |
| Daha zengin `render_mix` | true peak, loudness aralığı, limiter gain reduction (render boyunca limiter öncesi ve sonrası peak'ler), miksin ve her bas stem'inin en güçlü düşük frekansı (Hz + nota), low-end genişliği, uygulanabilir bir çözümle teslimat hedefleri (limiter gain veya master fader), maskeleme ve squashing ipuçları | `core/analysis.js`, `client/audio/render.js`, `mcp/tools/mix.js` |
| Stem dışa aktarma | `export_stems` aracı ve Dosya menüsü → Stem'leri dışa aktar (24-bit, insert FX + send'ler, master bus yok) | `client/lib/jobs.js`, `server/src/api.js` |
| Audio clip gain/fade'leri, loop tempo uyumu | motor, UI ve MCP'de clip `gain`, anti-click kenarlı `fadeIn`/`fadeOut`, `rate` (proje temposuna repitch) | `engine.playAudioClip`, Playlist, `add_audio_clip`/`update_clips` |
| Claude: kılavuzda sayılar | gain staging hedefleri, high-pass alışkanlıkları, sidechain ve send tarifleri, hedefe göre limiter, velocity tablosu, dikkat edilecekler | `server/src/mcp/guide.js`, prompt'lar |
| Claude: tek bir sesi ölçme | `analyze_sound` (pitch + cents, low-end notası, zarf −20/−40/−60 dB) | tarayıcı işi `sound` |
| Claude: feel preset'leri | `apply_groove` (boom-bap, dilla, lo-fi, trap, drill, house, afrobeats, straight) | `mcp/tools/production.js` |
| Hızlı kazanımlar | 3 ms clip kenar rampaları, oversampled kick/808 drive; *Lo-fi Keys*, *Strings*, *Riser Noise*, *Reverse Swell*, *Felt Piano*, *Sub Drop* preset'leri; paylaşımlı reverb/delay bus'ları, high-pass'ler ve kick sidechain'iyle yeniden kurulmuş template'ler | enstrümanlar, template'ler |

## İnceleme 2 — değerlendirme

> 0.4.0, sinyal yolunun çoğunu kâğıt üzerinde düzeltti; hedefleri, true peak'i, limiter gain reduction'ı ve stem başına düşük notalarıyla `render_mix` döngüsü artık çoğu hobi DAW'dan daha iyi. Uygulanan üç parça Claude'u hâlâ amatör sonuçlara itiyordu — aşırı rastgele groove preset'leri, gizli makeup gain'i olan bir kompresör ve tavanına ulaşamayan bir limiter — ve yayınlanmaya hazırlığa kalan mesafe büyük ölçüde sample'lı davullar ve gerçek bir look-ahead limiter.

2. incelemeden sonra yapılan düzeltmeler: milisaniye cinsinden groove humanize ve 0.75 aksan tabanları (preset'ler yeniden uygulanabilir), 0.4'te ghost snare'ler, kompresörün otomatik makeup'ının kaldırılması (birebir Web Audio/Chromium formülü), sıkıştırılmış master'ların tavaya oturması için kalibre edilmiş limiter (ve master fader'ın varsayılanının 0 dB olması çünkü limiterden sonra gelir), 808'in yolundan kaçan bir *Trap* kick preset'i, daha sessiz riser/swell'ler, gerçek sub oktavına dalan sub drop'lar, varsayılan stereo genişliği 1, kılavuzda swing–MPC dönüşümü ve role göre sidechain derinlikleri, bir drum-bus tarifi ve türe duyarlı bir "bass-heavy" ipucu.

## 0.5.0 — eklenenler

| Alan | Ne değişti | Nerede |
|---|---|---|
| Band enstrümanları ("FM'in ötesinde bir piyano/keys enstrümanı" maddesi ve fazlası) | arka plan worker'larında render edilen modellenmiş grand piano, gitar, bas gitar ve pizzicato yaylılar; FM/reed elektrik piyanosu; rotary'li drawbar org; string ensemble; Pop Band template'i | `client/audio/band.js`, `models.js`, `modelPool.js`, `core/instruments.js` |
| Paylaşım/teslimat formatları (önce "MP3/OGG share export") | MP3, AAC, Ogg, Opus, FLAC, ALAC, AIFF'e ffmpeg dönüşümleri; Ayarlar'da kullanılabilirlik; Claude için `list_export_formats` / `export_audio` | `server/src/ffmpeg.js`, Ayarlar → Ses dışa aktarma |
| Spatial miksin | konum otomasyonlu 3D objeler, binaural izleme, 5.1/7.1/7.1.4, object stem'ler, deneysel ADM BWF | `docs/spatial.md` |
| Genişletilebilirlik | izinleri ve güven incelemesi olan, izole ortamda çalışan kullanıcı plugin'leri (DSP enstrümanlar/efektler, sample enstrümanları, nota generator'ları) | `docs/plugins.md` |
| Dağıtım | ffmpeg'li Docker imajı + compose ve bir HTTPS profili | `docs/docker.md` |
| Skills | Claude kullanıcıları için müzik prodüksiyonu skill'leri (beat yapımı, aranjman, sayılarla miksin, spatial, plugin yazımı) `skills/` içinde (`npm run skills:pack`); spatial ses, plugin sistemi, plugin yazımı ve dışa aktarma formatları için geliştirici skill'leri | `skills/`, `.claude/skills/` |

## 0.6.0 — eklenenler

| Alan | Ne değişti | Nerede |
|---|---|---|
| World koleksiyonları | flütler (5), beatbox (5), Hint (7) ve Doğu Asya (10) enstrümanları; jawari, sympathetic strings ve deri vuruşlarıyla fiziksel modeller olarak sitar/tanpura/santoor/koto/guzheng/pipa/shamisen; Indian Fusion ve East Asian Lo-fi template'leri; Japon pentatonik ve thaat dizileri | `core/instruments.js`, `client/audio/world.js`, `models.js`, `core/templates.js`, `core/music.js` |
| UI düzeltmeleri | seçili clip/nota'lar artık dropdown boyutlandırmasını devralmıyor; pencereler başlık çubuğunun her yerinden sürükleniyor | `styles.css`, `ui/Window.jsx` |

## Hâlâ açık (sıradaki adaylar)

**Olmazsa olmaz**
- **Fabrika sample kit'leri** (her iki incelemeye göre hâlâ en belirgin "demo" işareti) — her template türü için küçük bir CC0/MIT davul kiti (trap clap'leri, boom-bap snare'leri, lo-fi kick'leri doğaları gereği sample'lı seslerdir), `list_samples` içinde factory olarak işaretlenir.
- **AudioWorklet içinde look-ahead limiter**, true-peak kontrolüyle (mevcut limiter, hızlı bir kompresör artı oversampled bir clipper'dır).

**Olması iyi**
- Daha fazla groove (shuffle, 2-step, dembow); sample'lı fabrika multisample'ları (sample-enstrüman plugin'leri olarak da sunulabilir).
- ~~Audio clip'lere ses kaydı~~ — 0.7.0'da tamamlandı (recorder: count-in, latency telafisi, playlist'e yerleştirilen take'ler); bir wave editor ve pitch correction ile birlikte.
- Playlist'teki audio clip'ler için time-stretch (wave editor bir sample'ı uzatabiliyor; clip'ler hâlâ yalnızca repitch yapabiliyor), sampler slicing ve velocity katmanları, birkaç take'in comping ile birleştirilmesi.
- Piano roll'da nota başına slide işareti, pattern başına swing, MIDI CC / mod wheel, tempo otomasyonu.
- Plugin'ler: üretilmiş knob'lar yerine plugin'in kendi özel UI paneli (izole iframe); çalma sırasında uygulanan MIDI-efekt plugin'leri (arp, akor, dizi); bir projenin kullandığı plugin'lerle birlikte paylaşılması.
- Spatial: Dolby sertifikalı ADM/IAB teslimatı Dolby'nin araçlarını gerektirir; head-tracking'li bir binaural önizleme.

**Güzel olur**
- `render_mix` içinde bant bant karşılaştırmalı referans track içe aktarma, iki sürümün A/B render'ı, bir multiband kompresör, sentezlenen davullar için bir transient shaper, visualizer'da bir bus spectrum görünümü.

## İnceleme nasıl çalıştırılır

Danışman salt okunurdur ve QA ile testler geçtikten sonra, sürüm başına en fazla birkaç kez çalışmak üzere tasarlanmıştır (0.4.0 her iki çalıştırmayı da kullandı; 0.5.0'ın hiçbiri kalmadı, bu yüzden yukarıdaki maddeler yeniden incelenmedi). Bu depoda Claude Code ile: *"music-industry-advisor ajanını çalıştır ve en önemli önerilerini özetle"*. Sonucu buraya kaydedin.
