# Plugin'ler

Melovra'ye kendi **enstrümanlarınızı**, **efektlerinizi** ve **nota generator'larınızı** ekleyebilirsiniz. Bir plugin; bir `plugin.json` manifest'i ve tipine göre bir JavaScript dosyası ve/veya ses sample'ları içeren bir `.zip` dosyasıdır. Her kullanıcı plugin'leri kendi hesabına yükler (Ayarlar → Plugin'ler). Claude kurulmuş plugin'leri kullanabilir ama hiçbirini yükleyemez.

> **Plugin'leri yalnızca güvendiğiniz kişilerden yükleyin.** Melovra plugin kodunu izole ortamda çalıştırır (ağ erişimi yok; hesabınıza, projelerinize, dosyalarınıza veya diğer plugin'lerin verisine erişim yok) ve plugin'in ürettiği her şeyi kontrol eder; yine de bir plugin başkasının kodudur: çok yüksek veya rahatsız edici ses çıkarabilir, çok CPU harcayabilir ya da açıklamasından farklı bir şey yapabilir. Studio bu uyarıyı, plugin'in yazarını, izinlerini ve SHA-256 hash'ini gösterir ve herhangi bir şey yüklenmeden önce onayınızı ister. Bkz. [Güvenlik](#güvenlik) ve [security.md](security.md#pluginler).

![Plugin yükleme: güven uyarılı inceleme ekranı](screenshots/settings-plugins.png)

| Tip | Nedir | Nerede çalışır | Kod? |
|------|------------|------------|-------|
| `instrument` (DSP) | yazdığınız bir synth voice'u: `createVoice()` + `process()` | tarayıcının ses thread'i (AudioWorklet) | evet |
| `instrument` (samples) | klavyeye yayılmış çoklu sample'lı ses dosyaları; studio'nun kendi sample motoruyla çalınır | — | **hayır** |
| `effect` | bir insert efekt: `create()` + `process(input, output)` | tarayıcının ses thread'i (AudioWorklet) | evet |
| `generator` | bir pattern'e nota yazar: `generate(input)` → notalar | izole iframe worker'ı, 2 s sınırı | evet |

Baştan sona çalışır, MIT lisanslı, kopyalayabileceğiniz [örnek plugin'ler](../plugins/examples):

| Örnek | Tip | Gösterdiği şey |
|---------|------|-------|
| `chiptune` | DSP enstrümanı | bant sınırlı pulse voice, envelope, release, select/bool parametreleri, preset'ler |
| `kalimba` | sample enstrümanı | key zone'ları, root notalar, `gain`/`attack`/`release` parametreleri, kodsuz |
| `tape-wobble` | efekt | modüle edilmiş delay hattı, otomasyona uygun parametreler, stereo işleme |
| `euclid` | generator | parametreler → ritim, sabit tohumla çalışan `random()` |
| `counter-melody` | generator | `project-read` izni: pattern'in notalarını ve diziyi okur |

```bash
npm run plugin:pack -- --examples                 # → plugins/dist/*.zip, ready to install
npm run plugin:pack -- path/to/my-plugin          # pack (and validate) your own folder
```

## Hızlı başlangıç: 20 satırda bir efekt

`my-gain/plugin.json`:

```json
{
  "id": "me.simple-gain",
  "name": "Simple Gain",
  "version": "1.0.0",
  "type": "effect",
  "author": "Me",
  "description": "Gain with a phase-flip switch.",
  "apiVersion": 1,
  "main": "dsp.js",
  "permissions": ["audio-processing"],
  "params": [
    { "key": "gain", "label": "Gain", "min": 0, "max": 2, "default": 1, "automatable": true },
    { "key": "flip", "label": "Phase flip", "type": "bool", "default": false }
  ],
  "presets": { "Unity": {}, "Half": { "gain": 0.5 } }
}
```

`my-gain/dsp.js`:

```js
gtd.registerEffect({
  create({ sampleRate, params }) {
    return {
      process(input, output, frames, params) {
        const g = params.gain * (params.flip ? -1 : 1);
        for (let c = 0; c < 2; c++) {
          for (let i = 0; i < frames; i++) output[c][i] = input[c][i] * g;
        }
      }
    };
  }
});
```

Sonra `npm run plugin:pack -- my-gain` komutunu çalıştırın ve `plugins/dist/me.simple-gain-1.0.0.zip` dosyasını Ayarlar → Plugin'ler'den yükleyin.

## plugin.json

| Alan | Zorunlu | Notlar |
|-------|----------|-------|
| `id` | ✓ | 3–64 karakter: küçük harfler, rakamlar, `.` ve `-`, örn. `"acme.tape-echo"`. Plugin'i projelerde tanımlar; aynı id ile bir paket yüklemek onu **günceller**. |
| `name` | ✓ | en fazla 48 karakter |
| `version` | ✓ | `1.0.0` (semver benzeri, `-beta.1` kabul edilir) |
| `type` | ✓ | `instrument`, `effect` veya `generator` |
| `apiVersion` | | `1` (şu ana kadarki tek sürüm) |
| `main` | DSP / generator'lar | kodu içeren tek `.js` dosyası |
| `permissions` | ✓ | aşağıya bakın |
| `params` | | en fazla 48 parametre tanımı |
| `presets` | | `{ "Name": { key: value, … } }`, en fazla 64; **ilk preset varsayılandır**. Preset yoksa `Default` elde edilir. |
| `samples` | sample enstrümanları | key zone'ları, bkz. [Sample enstrümanlar](#sample-enstrümanlar) |
| `author`, `description`, `license` | | yükleme iletişim kutusunda, Ayarlar'da ve Claude'a (`list_plugins`) gösterilir |
| `homepage` | | yalnızca `https://` |
| `color` | | kanal ve Browser noktası için `#rrggbb` |
| `defaultKey` | | enstrümanlar: step sequencer'ın çaldığı MIDI tuşu (varsayılan 60 = C4) |
| `polyphony` | | enstrümanlar: kanal başına 1–64 voice (varsayılan 16); aşılırsa önce bırakılmış en eski, sonra basılı en eski voice kesilir |
| `melodic` | | enstrümanlar: davul benzeri sesler için `false` (varsayılan `true`); generator'lar bunu `channel.melodic` olarak görür |

### İzinler

Bir plugin neye ihtiyacı olduğunu beyan eder; yükleme iletişim kutusu bunu gösterir. Bu listenin dışındaki her şey reddedilir ve bazıları hiçbir plugin'e **asla** verilmez: `network`, `storage`, `files`, `account`, `cookies`, `clipboard`, `microphone`, `camera` — izole ortamlarda bunlar zaten yoktur.

| İzin | Kimin için | Anlamı |
|------------|-----|-------|
| `audio-processing` | DSP enstrümanları, efektler | kendi ses kodunu ses thread'inde çalıştırır |
| `samples` | sample enstrümanları | studio'nun çalacağı ses dosyaları taşır (kodsuz) |
| `generator` | generator'lar | nota üretir (izole ortamda, süre sınırlı) |
| `project-read` | generator'lar (isteğe bağlı) | yazdığı pattern'in notalarını alır |

### Parametreler

Yerleşik enstrüman ve efektlerle aynı yapıdadır: Kanal ayarları / Mikser'de knob'a dönüşürler, Claude için doğrulanırlar ve projelerde saklanırlar.

```json
{ "key": "cutoff", "label": "Cutoff", "min": 40, "max": 18000, "default": 2000, "curve": "log", "unit": "Hz", "automatable": true, "group": "Filter" }
{ "key": "wave", "label": "Wave", "type": "select", "options": ["saw", "square"], "default": "saw" }
{ "key": "sync", "label": "Sync", "type": "bool", "default": false }
```

- `key`: kısa bir tanımlayıcı (`[A-Za-z][A-Za-z0-9_]*`, ≤ 32 karakter); `gtd` ile başlayan adlar ayrılmıştır.
- Sayılar: `min` < `max`, `default` aralık içinde, isteğe bağlı `step`, `unit` (≤ 8 karakter), `curve: "log"` (`min > 0` gerekir).
- Select'ler: her biri ≤ 24 karakter olan 1–24 `options`; `default` bunlardan biridir (atlanırsa ilki).
- `automatable: true` (efektler): parametre bir AudioParam olur — playlist'te otomasyona bağlanabilir ve akıcı biçimde değişir. Diğer parametreler plugine değiştiklerinde düz değer olarak ulaşır.
- Değerler, kodunuz görmadan önce her zaman beyan edilen aralığa sabitlenir (ve `step` verilmişse ona yuvarlanır).

## DSP plugin'leri (enstrümanlar ve efektler)

`main` dosyanız, `gtd.registerInstrument(...)` veya `gtd.registerEffect(...)` çağrısını bir kez yapan düz bir betiktir (modül değil). Studio'nun ürettiği bir harness tarafından sarılarak tarayıcının **AudioWorklet**'i içinde — ses thread'inde — çalışır. Bu kapsamda JavaScript'in kendisine (`Math`, typed array'ler, …) ek olarak `sampleRate`, `currentFrame` ve `currentTime` vardır; güvenebileceğiniz **hiçbir** ağ, DOM, depolama, zamanlayıcı veya `console` yoktur. Kodunuz `import` veya `importScripts` kullanamaz (paket reddedilir) ve `eval`/`new Function`, studio'nun Content-Security-Policy'si tarafından engellenir. Tek, kendi kendine yeten bir dosyada tutun (≤ 512 KB).

Ses, `frames` sample'lık `Float32Array`'ler olarak gelir ve gider (bugün çağrı başına 128 — buna güvenmeyin), her zaman stereo'dur: indeks 0 = sol, 1 = sağ.

### Enstrümanlar

```js
gtd.registerInstrument({
  // called for every note
  createVoice({ sampleRate, key, frequency, velocity, params }) {
    let phase = 0;
    let env = 1;
    let released = false;
    return {
      release() { released = true; },            // note-off (optional)
      process(output, frames) {                   // fill output[0] / output[1]
        for (let i = 0; i < frames; i++) {
          if (released) env *= 0.999;
          const s = Math.sin(phase) * env * velocity * velocity * params.gain;
          phase += (2 * Math.PI * frequency) / sampleRate;
          output[0][i] = s;
          output[1][i] = s;
        }
        return env > 0.0001;                      // false = this voice is finished
      }
    };
  }
});
```

- `velocity` 0..1 aralığındadır (yerleşik enstrümanların yaptığı gibi karesini almak, seviyeleri onlarla tutarlı tutar).
- `params`: kanalın değerleri (varsayılanlar + preset + düzenlemeler), voice'un ömrü boyunca sabittir.
- Voice sustuğunda `process`'ten `false` döndürün; harness onu en geç note-off'tan 10 s sonra yine de sonlandırır. `output`, notanın tam başlangıç frame'inde başlar (ilk blok daha kısa olabilir).
- Her nota kendi işlemcisidir: voice başına bellekte makul olun ve manifest'te `polyphony` ayarlayın.

### Efektler

```js
gtd.registerEffect({
  create({ sampleRate, params }) {               // once per effect slot
    const buf = new Float32Array(sampleRate);    // allocate here, never in process()
    return {
      update(params) { /* optional: non-automatable params changed */ },
      process(input, output, frames, params) {   // params: current values (automatable ones per block)
        for (let c = 0; c < 2; c++) for (let i = 0; i < frames; i++) output[c][i] = input[c][i];
      }
    };
  }
});
```

### Harness'ın sizin için (ve üzerinizde) yaptıkları

- **Çıktı temizlenir:** NaN/Infinity 0 olur ve sample'lar miks ulaşmadan önce ±8'e sabitlenir (gerisini master limiter yapar). Yine de çıktınızı ±1 civarında tutun.
- **Hatalar sınırlanır:** `create`/`createVoice`/`process` hata fırlatırsa bir efekt slotu **bypass edilir** (ses değişmeden geçer) ve bir voice sonlanır. Hata, Ayarlar → Plugin'ler ve Kanal ayarları'nda gösterilir.
- **Eksik veya devre dışı plugin'ler** projeleri bozmaz: kanalları sessizdir, efekt slotları sesi geçirir ve ayarları saklanır — plugin'i yeniden yükleyin/etkinleştirin ve geri gelirler. Aynı şey, projeyi plugin'i olmayan biriyle paylaştığınızda da geçerlidir.
- Plugin'ler canlı çalma **ve** çevrimdışı render'larda (dışa aktarma, stem'ler, Claude'un `render_mix`'i) çalar; bu yüzden çıktı gerçek zamana (wall-clock) bağlı olmamalıdır.

## Sample enstrümanlar

Kod yok: key zone'larını listeleyin; studio'nun sampler'ı çalar ve her zone'un root notasına göre yeniden akort eder.

```json
"permissions": ["samples"],
"samples": [
  { "file": "samples/c3.wav", "root": 48, "lo": 0,  "hi": 53 },
  { "file": "samples/c4.wav", "root": 60, "lo": 54, "hi": 65 },
  { "file": "samples/c4-soft.wav", "root": 60, "lo": 54, "hi": 65, "velHi": 0.5 },
  { "file": "samples/pad.wav", "root": 72, "lo": 66, "hi": 127, "loop": true }
],
"params": [
  { "key": "gain", "min": 0, "max": 2, "default": 1 },
  { "key": "attack", "min": 0.001, "max": 1, "default": 0.002, "curve": "log", "unit": "s" },
  { "key": "release", "min": 0.02, "max": 3, "default": 0.3, "curve": "log", "unit": "s" }
]
```

- En fazla 128 zone; `lo`/`hi` MIDI tuşlarıdır (dahil), `velLo`/`velHi` 0..1. Bir nota için, tuşu ve velocity'i içeren zone'lar adaydır ve root'u en yakın olan kazanır (eşleşme yoksa herhangi bir zone).
- Dosyalar: `.wav`, `.mp3`, `.ogg` veya `.flac` (yalnızca adlarına değil, içeriklerine bakılarak kontrol edilir). WAV her yerde en güvenlisidir.
- `gain`, `attack` ve `release` adlı parametreler, beyan ederseniz sampler tarafından kullanılır.
- `plugins/examples/kalimba/make-samples.mjs`, sample'larının nasıl sentezlendiğini gösterir.

## Generator'lar

Bir generator, bir kanal için bir pattern'e nota yazar — **Generate** penceresinden (piano roll → *Gen*) veya Claude tarafından (`run_generator`). Kodu, opak origin'e sahip ve ağ erişimi olmayan gizli, izole bir iframe'de; her çalıştırma için taze bir Web Worker içinde çalışır ve **2 saniye** sonra durdurulur. İçeri ve dışarıya yalnızca veri girer.

```js
gtd.registerGenerator({
  generate(input) {
    const notes = [];
    for (let s = 0; s < input.steps; s += 4) {
      notes.push({ step: s, length: 2, key: input.channel.rootKey, velocity: 0.6 + input.random() * 0.3 });
    }
    return notes;
  }
});
```

`input`:

| Alan | |
|-------|--|
| `params` | parametre değerleriniz (varsayılanlar + preset + kullanıcı/Claude'un ayarladıkları) |
| `steps`, `bars`, `stepsPerBar` | doldurulacak aralık, 16'lık nota adımlarıyla (0 tabanlı) |
| `key`, `scale`, `scaleNotes` | projenin tonu (örn. `"A"`), dizi adı ve pitch class'ları (0–11) |
| `bpm`, `timeSig` | tempo ve ölçü işareti |
| `channel` | hedef kanalın `{ name, kind, melodic, rootKey }` değeri |
| `seed`, `random()` | tohumlu bir rastgele sayı üreteci: aynı tohum + parametreler aynı notaları verir |
| `notes` | yalnızca `project-read` ile: pattern'in o aralığında halihazırda bulunan `[{ channel, step, length, key, velocity }]` |

`{ step, length?, key, velocity? }` içeren bir dizi döndürün (`length` adım cinsinden, varsayılan 1; `velocity` 0..1, varsayılan 0.8; çeyrek adım çözünürlüğü). Sonuç güvenilmez sayılır: aralık dışındaki veya geçersiz değerli notalar atılır, değerler sabitlenir, en fazla 4096 tanesi tutulur. Notalar, pattern'de o kanalın o aralığını değiştirir (tek bir geri al adımı).

Sonuçların yeniden üretilebilir olması için `Math.random()` yerine `random()` kullanın. `generate` senkron olmalıdır.

## Paketleme

```
my-plugin/
  plugin.json
  dsp.js            (or generator.js — whatever "main" says)
  samples/*.wav     (sample instruments)
  README.md, LICENSE, icon.png   (optional, packed if present)
```

`npm run plugin:pack -- my-plugin`, klasörü sunucunun yaptığı gibi tam olarak doğrular (manifest, kod kontrolleri, sunucunun zip okuyucusundan bir gidiş-dönüş) ve plugin'in ihtiyaç duyduğu dosyaları içeren `plugins/dist/<id>-<version>.zip` dosyasını yazar. Herhangi bir zip aracı da çalışır, yeter ki:

- `plugin.json` kökte olsun (veya tek bir üst düzey klasörün içinde),
- tek `.js` dosyası `main` olsun ve diğer dosyalar `.json .wav .mp3 .ogg .flac .md .txt .png` olsun,
- dosya adları yalnızca harfleri, rakamları ve `_ . - /` karakterlerini kullansın (boşluk yok), en fazla 6 klasör düzeyi; bağlantı, `..` veya hem dosya hem klasör olan adlar yok (gizli dosyalar ve `__MACOSX/` atlanır),
- en fazla 256 dosya, dosya başına 30 MB, açılmış hâlde 60 MB, yüklenen 20 MB; `plugin.json` ≤ 64 KB, kod ≤ 512 KB; 1 MB'ı aşan dosyalar 200:1'den fazla sıkışamaz.

## Yükleme, güncelleme, kaldırma

- **Ayarlar → Plugin'ler → Plugin yükle…** → `.zip` dosyasını seçin. Studio, güven uyarısıyla birlikte plugin'in adını, yazarını, tipini, izinlerini, dosyalarını ve SHA-256'sını gösterir; *Güveniyorum … ve yüklemek istiyorum* kutucuğunu işaretleyin → **Plugin yükle**.
- Halihazırda sahip olduğunuz bir id'ye sahip paket, bir **güncelleme** olarak gösterilir (… sürümünden) ve onu değiştirir; açık studio'lar yeniden yüklemeden yeni sürüme geçer.
- Her plugin **kapatılabilir** (kanalları sessize gider, efektler sesi geçirir) veya **kaldırılabilir**.
- Plugin'ler hesabınıza aittir; diğer kullanıcılar onları görmez ve elde edemez. Bir kullanıcıyı silmek, plugin'lerini de siler.
- Adminler plugin'leri herkes için kapatabilir (Ayarlar → Sunucu → *Plugin'lere izin ver*); `PLUGINS_ENABLED=false`, bu ayardan bağımsız olarak onları kapatır.
- Yükleme, oturum açmış studio gerektirir: API token'ları (Claude, betikler) reddedilir.

## Plugin'leri kullanma

- **Browser → Sounds → Plugin'ler**: preset'leriyle enstrüman plugin'leri; kanal eklemek için tıklayın.
- **Mikser → insert → *+ Efekt ekle…* → *Plugin: …***: efekt plugin'leri; parametrelerinden knob'lar, bir preset seçici; otomasyona uygun parametreler herhangi bir parametre gibi otomatikleştirilebilir.
- **Piano roll → Gen**: Generate penceresi (generator, preset, parametreler, uzunluk).
- **Claude**: `list_plugins` (id'ler, parametreler, preset'ler, her birinin nasıl kullanılacağı), `add_channel instrument="plugin" plugin="<id>"`, `add_effect type="plugin" plugin="<id>"`, doğrulanmış parametrelerle `update_channel` / `update_effect` ve `run_generator plugin="<id>" pattern=… channel=…` (açık studio'nuzun sandbox'ında çalışır).

## Güvenlik

Sizi koruyan şeyler, kısaca (ayrıntılar [security.md](security.md#pluginler) içinde):

1. **Kararı siz verirsiniz:** inceleme iletişim kutusu ve açık güven onayınız olmadan hiçbir şey yüklenmez; Claude ve API token'ları yükleyemez.
2. **Yüklemede doğrulama:** sertleştirilmiş zip okuyucu (yollar, bağlantılar, boyutlar, zip bombaları, CRC'ler), manifest şeması, yalnızca bilinen izinler, yalnızca main dosyası kod olabilir, `import`/`importScripts` yok, sample'lar gerçek ses olmalı.
3. **Sunucu plugin kodunu asla çalıştırmaz.** Kodu kullanıcı başına saklar ve yalnızca o kullanıcıya, sarılı olarak sunar:
   - DSP kodu yalnızca, başka hiçbir yerde çalışmayı reddeden bir harness arkasında bir AudioWorklet modülü olarak. Ses thread'inde ağ, DOM, çerez veya depolama yoktur; studio'nun CSP'si `eval`i yasaklar.
   - Generator kodu yalnızca `text/plain` olarak studio'ya gider; studio onu sandbox iframe'ine (opak origin, `connect-src 'none'`, kendi CSP'si) verir ve kod orada ağ API'leri kaldırılmış bir Worker içinde, süre sınırıyla çalışır.
4. **Çıktı veridir ve denetlenir:** ses temizlenir (NaN/∞/kaçmış değerler), notalar doğrulanır ve sabitlenir, çökmeler plugin'i bypass eder veya sonlandırır, polyphony ve voice ömrü sınırlanır.

Bir plugin'in *yine de* yapabilecekleri: her türlü sesi çıkarmak (yüksek, sert, sessiz), çalarken CPU harcamak, açıklamasına aykırı davranmak. Bir studio'nun DSP plugin'leri ses thread'ini paylaşır; bu yüzden kötü niyetli bir DSP plugin orada diğer plugin'lerin veya studio'nun sesine müdahale edebilir — ama verilerinizi okuyamaz veya hiçbir yere hiçbir şey gönderemez. Güven onayı bu yüzden vardır.
