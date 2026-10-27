# Claude ile müzik yapmak (MCP)

Melovra, bir [Model Context Protocol](https://modelcontextprotocol.io) sunucusu içerir. Bağlandığında Claude;
proje oluşturabilir, ses tasarlayabilir, davulları programlayabilir, akorlar, bas hattı ve melodiler yazabilir,
onlara groove verebilir, fill'ler ve geçişler ekleyebilir, sample'larınızı kullanabilir, şarkıyı aranje edebilir,
otomasyon yazabilir, miks yapabilir, miksü ve tek tek sesleri render edip *ölçebilir*, stem'leri dışa aktarabilir,
sürüm kaydedebilir ve oynatma tuşuna basabilir — siz her düzenlemenin stüdyoda belirişini izlerken.

![Stüdyoda Claude etkinliği](screenshots/claude-activity.png)

## İki bağlanma yolu

| | Streamable HTTP (`/mcp`) | stdio bridge (`server/src/mcp/stdio.js`) |
|---|---|---|
| En uygun | Claude Code, HTTP kullanabilen herhangi bir MCP istemcisi, uzak sunucular | Claude Desktop ve diğer yalnızca-stdio istemciler |
| Stüdyoya nasıl ulaşır | Doğrudan | Çalışan web sunucusuna REST üzerinden iletir (`MELOVRA_URL`) |
| Kimlik doğrulama | `Authorization: Bearer gtd_…` ya da `?token=gtd_…` | `MELOVRA_TOKEN=gtd_…` |
| Tarayıcıda canlı | Evet | Evet (web sunucusu çalışırken; aksi hâlde dosyaları doğrudan düzenler, canlı güncelleme ya da render olmadan) |

Stüdyonun **Ayarlar → API & MCP** bölümü, sunucunuzun URL'i ve token'ıyla kopyalamaya hazır komutlar gösterir.

### Claude Code

```bash
claude mcp add --transport http melovra http://localhost:3001/mcp \
  --header "Authorization: Bearer gtd_xxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "melovra": {
      "command": "node",
      "args": ["/absolute/path/to/melovra/server/src/mcp/stdio.js"],
      "env": {
        "MELOVRA_URL": "http://127.0.0.1:3001",
        "MELOVRA_TOKEN": "gtd_xxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### Başlık gönderemeyen istemciler

`https://your-server/mcp?token=gtd_…` biçimindeki URL'i kullanın. O URL'e parola muamelesi yapın.

## API token'ları (isteğe bağlı, önerilir)

- Her hesabın en fazla bir kişisel token'ı olur. **Generate**, onu bir kez gösterir — hemen kopyalayın.
  **Regenerate**, onu değiştirir (eskisi anında çalışmaz ve onu kullanan açık bağlantılar kapatılır). **Delete** iptal eder.
- Token'lar sunucuda yalnızca SHA-256 hash'leri olarak saklanır.
- Bir token *sizin* adınıza hareket eder: Claude yalnızca sizin projelerinizi ve sample'larınızı görür ve düzenler.
  Token'lar hesap yönetemez, parola değiştiremez ya da token oluşturamaz — bunlar için oturum açmış bir tarayıcı gerekir.
- **Token'sız**: yalnızca bir yönetici *Bu bilgisayardan token'sız MCP'ye izin ver* seçeneğini açmışsa (Ayarlar →
  Sunucu; yerel kurulumlarda varsayılan olarak açıktır) ve yalnızca aynı makineden `localhost`'a yönelik istekler için
  geçerlidir. Bu tür istekler, Ayarlar → Sunucu'da seçilen hesap adına hareket eder (varsayılan: ilk admin). Ağ
  üzerinden gelen her şey her zaman token ister. Ortamda `MCP_TOKEN` tanımlamak da token'sız erişimi kapatır.

## Claude neler yapabilir

Dokuz grupta 78 araç — tam [MCP referansı](MCP.md) için bkz.:

- **Projeler**: durum, projeleri listeleme/oluşturma/açma/çoğaltma/silme, şarkıyı okunabilir bir özet olarak alma,
  tempo, ton, dizi, swing, ölçü işareti güncelleme, sürümler (kaydet/listele/geri yükle), geri alma.
- **Sesler**: tüm parametreleriyle enstrüman ve efektleri listeleme, kanal ekleme/güncelleme/kopyalama/taşıma/kaldırma
  (groove dahil: nudge ve swing payı), bir sesi önizleme, **analyze_sound** (tek bir notanın pitch'i, low-end notası,
  envelope'u), müzik teorisi (diziler, tona göre yazılmış diatonik akorlar, akor notaları).
- **Notalar**: pattern'ler, davul step string'leri, piano-roll notaları, kompakt string'lerden melodiler, akor
  progresyonları (sembol ya da roma rakamı, voice-led, block/rhythm/arp/broken stilleri, **voicing'ler**
  close/open/drop2/drop3/spread/shell/rootless, register), bir ritimden ya da **kaymalı derece hattından** bas hattı,
  roll'lar, kopyalama/dönüştürme (transpose, shift, quantize, humanize, legato, velocity, double, reverse, stretch, strum).
- **Aranjman**: pattern yerleştirme, bölümlerden bütün şarkı kurma (**marker'larla**), clip taşıma/boyutlandırma/kaldırma,
  ölçü aralığı kopyalama, track'ler, otomasyon clip'leri, play/stop, MIDI dışa aktarma.
- **Prodüksiyon**: **apply_groove** (türe göre feel preset'leri), **add_fill** (snare roll'ları, tom dizilişleri, hat
  roll'ları, stutter'lar, dropout'lar, kick build'leri), **add_transition** (riser'lar, downlifter'lar, swell'ler,
  snare build'leri, crash'ler, sub drop'lar, impact'ler).
- **Miks**: mikser insertleri (dB cinsinden volume, pan, yönlendirme, send'ler), efektler (ekleme/güncelleme/taşıma/
  kaldırma; `pump` `source` ile kick tetiklemeli sidechain), teslim hedefleriyle **render_mix**, **export_stems** ve
  **list_export_formats** / **export_audio** (ffmpeg üzerinden MP3, AAC, Ogg, Opus, FLAC, ALAC, AIFF).
- **Spatial**: `set_spatial`, `place_object`, `move_object`, `export_spatial` (binaural, 5.1, 7.1, 7.1.4, object
  stem'leri, ADM BWF).
- **Plugin'ler**: `list_plugins`, `run_generator`; plugin enstrüman ve efektleri `add_channel` / `add_effect` üzerinden.
- **Sample'lar**: listeleme ve arama (klasör, ad, etiket, ton, tempo), tam meta veri ve analiz, yeniden analiz,
  yeniden adlandırma, klasörler (`sample_folders`, `move_samples`), silme (nelerin susacağıyla birlikte), **düzenleme**
  (`edit_sample`: trim, fade'ler, gain, normalleştirme, reverse, speed, time stretch, pitch shift ve **pitch düzeltme**;
  yeni bir sample olarak ya da orijinalin üzerine kaydedilir), sampler kanalı ya da audio clip olarak kullanım (gain,
  fade'ler ve tempo'ya repitch ile).

Hazır **prompt'lar**: `make_beat` (genre, mood, bpm, reference), `mix_review` (target), `use_my_samples` (idea) ve
`spatial_mix`.

### Skills

Depodaki [`skills/`](../skills) klasörü, bu araçların üzerine Claude'a prodüktör iş akışları öğreten skill'ler
içerir — beat yapımı (tür tarifleri), aranjman, sayılarla miks, spatial miks ve plugin yazımı. `npm run skills:pack`
çalıştırın ve zip'leri Claude Desktop / claude.ai'ya yükleyin (Customize → Skills) ya da Claude Code için klasörleri
`~/.claude/skills/` altına kopyalayın. Bkz. [skills/README.md](../skills/README.md).

## Claude nasıl "duyar": render_mix

`render_mix`, şarkıyı (ya da bir pattern'i) **açık tarayıcı sekmenizde** render eder ve şuna benzer bir rapor döndürür:

```
MIX ANALYSIS — "Welcome Trap Beat" (song, 28.9s, 16 bars)
Loudness: -13.8 LUFS integrated, short-term max -12.3 LUFS, loudness range 6.1 LU, peak -1.4 dBFS, true peak -0.9 dBTP, crest 9.6 dB
Master limiter: gain reduction avg -1.2 dB, max -3.9 dB, working 41% of the time (input gain 0 dB, ceiling -1 dB); master fader after it 0 dB
Target streaming (Spotify/YouTube/Apple normalise to about -14 LUFS): -14 LUFS, true peak ≤ -1 dBTP → -0.2 dB: on target
Spectrum: sub 44.3% · low 49.2% · … (centroid 280 Hz, dark; strongest low frequency 65 Hz ≈ C2 +6c)
Stereo: correlation 0.99, width 0.08 (side/mid), low end (<150 Hz) width 0.02, L/R balance 0 dB
Loudness per 4 bars: 1:-20.9  2:-12.8  3:-12.8  4:-12.9  5:-34.8
Stems (loudest first; measured after each channel's own mixer insert …):
  808             -11.1 LUFS  peak   -4.8 dBFS  centroid    71 Hz  mostly low (61.2%)  low peak 65 Hz (C2 +6c)  width 0
  Kick            -15.2 LUFS  peak   -3.7 dBFS  centroid    61 Hz  mostly sub (65%)  low peak 52 Hz (G#1 +20c)  width 0
  …
Hints:
- True peak -0.9 dBTP is above -1 dBTP: lossy encoding (MP3/AAC/Opus) will clip — lower the master limiter ceiling by 0.3 dB (to -1.3 dB).
```

`target`, teslim standardını seçer (`streaming`, `apple-music`, `club`, `hip-hop`, `edm`, `lo-fi`, `broadcast`,
`podcast`) ya da `targetLufs` bir sayı alır; rapor daha sonra master limiter'ın input gain'inin tam olarak ne kadar
kaydırılacağını söyler. İpuçları ayrıca bastırıp ezen bir limiter'ı, geniş bir low end'i, bölümler arası eksik
dinamikleri ve low peak'leri çakışan stem'leri (kick ile 808 maskelemesi) de işaretler.

| Metrik | Anlamı | Tipik hedefler |
|--------|---------|-----------------|
| Integrated LUFS (BS.1770, gated) | tüm render'ın algılanan loudness'ı | streaming ≈ −14, club/EDM ≈ −9…−6 |
| Loudness range (LU, EBU R128) | bölümler arası dinamikler | pop/hip-hop 4–8, film/klasik 10+ |
| Peak dBFS / true peak dBTP | en yüksek sample / en yüksek sample-arası seviye (4× oversampled) | streaming için true peak ≤ −1 |
| Limiter gain reduction | master limiter'ın ne kadar zorlandığı | ~6 dB'den fazlası = bastırılmış |
| Crest dB | peak-RMS oranı: punch ve squash karşılaştırması | < 6 dB aşırı sıkıştırılmış hissettirir |
| Spectral balance | sub/low/low-mid/mid/high-mid/high bantlarındaki enerji payı | low-mid > %25 ise bulanık, high-mid+high < %6 ise donuk |
| Stereo correlation / width | mono uyumluluğu / side enerjisi | korelasyon < 0.2 = faz riski |
| Low-end width | 150 Hz altı side/mid | ≈ 0 (bas mono'da) |
| Low peak (Hz + nota) | miksün / her bas stem'inin en güçlü 25–300 Hz frekansı | kick ile 808 arasında ≥ 2 yarıton |
| Bölüm başına loudness | aranjmanın enerji eğrisi | drop'lar ve build'ler görünür olmalı |
| Stem'ler | her kanalın loudness'ı ve spektrumu, tek geçişte | kick-808 dengesi, maskeleme |

Render tarayıcınızda gerçekleşir (tek geçiş; stem'ler aynı render'daki tap'lardan ölçülür) ve HTTP üzerinden uzun
render'lar MCP istemcisine ilerleme bildirimleri akıtır. `save=true`, ayrıca *Projeler → Dışa aktarımlar* altına
24-bit bir WAV kaydeder (ya da `bitDepth: 16`, dither'lı) ve bir indirme bağlantısı döndürür.

### Tek bir sesi ölçmek: analyze_sound

`analyze_sound`, bir kanalın tek notasını render eder (kuru ya da `through: "insert"` ile efektleri üzerinden) ve
seviyeyi, true peak'i, cent'li pitch'i, en güçlü low frekansını nota olarak, spektrumu ve envelope'u (attack,
−20/−40/−60 dB'ye ulaşma süreleri) raporlar. Claude bunu; 808'leri ve kick'leri tona akort etmek, temel
frekanslarını birbirinden ayırmak ve bir 808 kuyruğunun sonraki vuruşa bulaşmadığından emin olmak için kullanır.

### Stem'ler: export_stems

`export_stems`, çalan her kanalı (ve audio clip'leri) tek başına *Projeler → Dışa aktarımlar* altına render eder —
varsayılan 24-bit, her biri kendi insert efektleri ve send'leriyle, master bus olmadan (`masterFx: true` ile dahil
edilir). Aynı işlev, stüdyonun Dosya menüsünde → *Export stems* altındadır.

### Her format: list_export_formats + export_audio

`list_export_formats`, Claude'a bu sunucunun şu an neyi dışa aktarabildiğini söyler: WAV her zaman; MP3, AAC (.m4a),
Ogg Vorbis, Opus, FLAC, Apple Lossless ve AIFF ise ffmpeg kuruluysa — ffmpeg sürümü, her formatın bitrate'leri ve bir
formatın neden kullanılamadığı dahil. `export_audio`, şarkıyı (ya da bir pattern'i) tarayıcınızda render eder ve
sunucuya dönüştürtür:

> *"Şarkıyı 'Night Drive' adıyla 320 kbps MP3 olarak ve master için 24-bit FLAC olarak dışa aktar."*

Dosya etiketlenir (verilmezse title = proje adı, artist = görünen adınız), *Projeler → Dışa aktarımlar* altına
kaydedilir ve Claude indirme bağlantısını alır. Kayıplı formatlar 24-bit bir render'dan kodlanır; `keepWav: true`
yapılmadıkça ara WAV silinir.

## Spatial (Atmos tarzı) miks

- `set_spatial`, 3D miksü açar/kapatır ve stüdyonun neyle izleyeceğini ayarlar (`stereo` ya da kulaklık için `binaural`).
- `place_object`, bir mikser insertini — ya da ada göre bir kanalın insertini — 3D obje yapar: adlandırılmış bir nokta
  (`front-left`, `overhead`, `rear-right`…), `x`/`y`/`z` (x −1 sol…1 sağ, y −1 arka…1 ön, z 0 kulak…1 tavan) ya da
  `azimuth`/`elevation`/`distance`, artı bir `lfe` send'i. `enabled: false`, onu stereo bed'e geri döndürür.
- `move_object`, onu konum otomasyonuyla animasyona sokar: `circle` (tur, yarıçap, saat yönü), `left-right`,
  `front-back`, `rise`, `fall`, `fly-over` ya da kendi `points`'larınız.
- `export_spatial`, `binaural`, `5.1`, `7.1`, `7.1.4`, `objects` (bed + mono object stem'leri + positions JSON) ya da
  `adm` (deneysel ADM BWF) render eder ve kanal peak'lerini raporlar (objeler master limiter'ı atlar).

Ayrıntılar: [Spatial miks](spatial.md).

## Plugin'leriniz

Claude, kurduğunuz plugin'leri kullanabilir (Ayarlar → Plugin'ler) ama asla kuramaz — kurmak her zaman stüdyoda,
yazarına güvendiğinizi onaylamanızı gerektirir.

- `list_plugins` — enstrüman, efekt ve generator plugin'leriniz, parametreleriyle (aralıklar, varsayılanlar),
  preset'leri, izinleri ve her birinin nasıl kullanılacağıyla.
- `add_channel instrument="plugin" plugin="<id>" preset=… params={…}` ve `add_effect type="plugin" plugin="<id>"`;
  `update_channel` / `update_effect`, parametrelerini değiştirir (plugin'in manifest'ine göre doğrulanır).
- `run_generator plugin="<id>" pattern=… channel=… params={…} bars=… seed=…` — generator, açık stüdyonuzun sandbox'ında
  çalışır (ağ yok, 2 sn limit); Claude'a kaç nota yazıldığı ve kaç geçersiz notanın düştüğü döner. Aynı seed ve params,
  aynı notaları verir.

`render_mix`, `export_stems`, `export_audio` ve `export_spatial`, plugin enstrümanlarını ve efektlerini kapsar (her
şey gibi onlar da tarayıcınızda render edilir).

## Feel, fill'ler ve geçişler

- `apply_groove` preset'leri: `boom-bap`, `dilla`, `lo-fi`, `trap`, `drill`, `house`, `afrobeats`, `straight`. Her biri;
  swing'i, rol başına nudge'ları (örn. tembel snare'ler), swing paylarını, hi-hat aksanlarını ve hafif humanizing'i
  ayarlar; `amount` ölçekler, `ghostNotes` sessiz snare ghost'ları ekler. Yeniden çalıştırmak üst üste binmez.
- `add_fill`, bir davul pattern'inin fill kopyasını oluşturur: `snare_roll`, `tom_run`, `hat_roll`, `stutter`,
  `dropout`, `kick_build`.
- `add_transition`, tam bir bölüm başlangıcına iner: `riser` (filter + volume otomasyonlu noise), `downlifter`,
  `reverse_swell`, `snare_build`, `crash`, `sub_drop`, `impact`.

Üçü de yalnızca sıradan kanallar, pattern'ler, clip'ler ve otomasyon oluşturur; böylece sonrasında her şeyi
düzenleyebilirsiniz.

## Sample'larınız, Claude'un gözünden

`list_samples` ve `get_sample_info`, teknik meta veriyi (format, codec, lossless, örnekleme hızı, bit derinliği,
kanallar, bitrate, süre, boyut, etiketler) ve analizi (LUFS, peak, crest, clipping, sessizlik, stereo, spektrum,
onset'lar, tempo + güven değeri, ton, pitch, one-shot/loop, karakter) döndürür. WAV'ler yüklenirken sunucu tarafından
analiz edilir; diğer formatlar tarayıcınız tarafından çözülür (`analyze_sample` yeniden çalıştırır). Claude bunu;
one-shot'ları doğru kök notayla yüklemek, loop'ları proje tempo/tonuna uydurmak ve seviyeleri dengelemek için kullanır.

Claude, klasörlerinizi de görür, onlarda arama yapabilir (*"karanlık kick'lerimi bul"*), sample'ları klasörlere
koyabilir (`move_samples` — yeni bir klasör adı klasörü oluşturur) ve kaydettiğiniz take'leri temizleyebilir: *"Take 3'ün
sessizliğini kırp, A minöre akort et ve 9. ölçüye koy"* isteği, `edit_sample`'a (`trim_silence`, `pitch_correct` key A
scale minor, `normalize`) ve `add_audio_clip`'e dönüşür. Düzenlemeler tarayıcınızda çalışır ve Claude'dan orijinali
değiştirmesini istemediğiniz sürece **yeni** bir sample olarak kaydedilir — isterseniz yanıt, değişen her projeyi listeler.

## İyi sonuçlar için ipuçları

- Stüdyoyu açık tutun (ve sesi etkinleştirmek için bir kez tıklayın) ki Claude render edebilsin, analiz edebilsin ve
  çalabilsin.
- Bir tür, tempo, ton ve mood, ayrıca bir referans feel isteyin ("90'ların sonu boom bap gibi") — Claude melodileri
  kopyalamaz.
- Büyük değişikliklerden önce Claude'dan **sürüm kaydetmesini** ve hedefli bir `render_mix` çalıştırıp bulduklarını
  düzeltmesini isteyin.
- Feel'i ve teslimatı adıyla söyleyin: *"dilla tarzı swing, Spotify için miks"* doğrudan `apply_groove` ve
  `render_mix target=streaming`'e eşlenir.
- Sizin düzenlemelerinizle Claude'unkiler güvenle iç içe geçer; stüdyoda Ctrl+Z Claude'un değişikliklerini de geri
  alır, Claude'un `undo` aracı da kendi son değişikliklerini geri alır.
- Her değişikliğin günlüğü için tarayıcıdaki *Claude* sekmesini izleyin.

## Sorun giderme

| Sorun | Neden / çözüm |
|---------|-------------|
| 401 "This server requires an API token" | Token oluşturun (Ayarlar → API & MCP) ve iletin; token'sız erişim yalnızca yereldir ve devre dışı bırakılmış olabilir. |
| 401 "Invalid API token" | Token yeniden üretildi ya da silindi — istemci yapılandırmanızı güncelleyin. |
| "No studio is open in a browser" | Stüdyoyu, token'la aynı hesapla oturum açıp açın. |
| Render zaman aşımına uğuyor | Yavaş makinelerde çok uzun şarkılar: bir pattern render edin ya da sekmeyi ön planda tutun. |
| Düzenlemeler stdio ile canlı görünmüyor | `MELOVRA_URL`'i çalışan sunucuya, `MELOVRA_TOKEN`'ı kendi token'ınıza ayarlayın. |
