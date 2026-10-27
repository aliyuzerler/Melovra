# Melovra MCP referansı

*Not: Bu belge `npm run docs:mcp` komutuyla otomatik üretilir; yeniden üretildiğinde İngilizce sürüme döner. Araç ve parametre adları İngilizce kalır.*

_78 araç; `node scripts/gen-mcp-docs.mjs` tarafından üretilmiştir._


Melovra, tarayıcıda çalışan FL Studio tarzı bir DAW'dır. Değiştirdiğin her şey anında kullanıcının tarayıcısında görünür.

## Kavramlar
- **Kanallar** (Kanal Rafı) = çalgılar: sentezlenmiş davullar (kick, snare, clap, hat, tom, rim, cowbell, cymbal, shaker, perc),
  808 bass (bass808), subtractive synth (synth), FM synth (fm), sampler (kullanıcının yüklediği audio) ve grup çalgıları:
  kanatlı piyano (piano), elektrik piyanosu (epiano: tine/reed), drawbar org (organ), gitar (acoustic, nylon,
  electric), bas gitar (bass: finger/pick/slap/upright) ve yaylılar (legato, staccato, pizzicato; ensemble veya solo).
  World koleksiyonları: flutes (flute, panflute, recorder, whistle, ocarina), beatbox (bbkick, bbsnare, bbhat, bbbass,
  bbfx), Indian (sitar, tanpura, tabla, bansuri, shehnai, santoor, harmonium) ve East Asian (koto, guzheng, pipa,
  shamisen, erhu, shakuhachi, dizi, suona, taiko, gong). Her birinin preset'leri + parametreleri vardır; list_instruments category="indian"
  tek bir koleksiyonu gösterir.
- **Pattern'ler** istenen sayıda kanalın notalarını tutar (yeniden kullanılabilir yapı taşları). Varsayılan uzunluk 1 ölçü = 16 step.
- **Playlist**, pattern kliplerini (ve audio / otomasyon kliplerini) track'ler üzerinde zamana dizer (song modu). Pattern'inden uzun bir clip onu döngüler.
- **Mikser**: insert 0 = Master. Her kanal bir insert'e yönlendirilir (mixerTrack). Insert'lerde 10'a kadar efekt
  (high/low-pass'li eq, filter, compressor (mix < 1 = parallel), delay, reverb, distortion, chorus, phaser, bitcrusher,
  stereo (width + monoBelow), pump (sidechain ducking: source = bir kanal ya da bir tempo grid'i), limiter), output yönlendirmesi ve send'ler bulunur.
- **Marker'lar** playlist'in üzerinde song bölümlerine ad verir (arrange_song oluşturur; set_markers düzenler).
- **Otomasyon** klipleri bir parametreyi zaman içinde hareket ettirir (kanal volume/pan/pitch/filterCutoff/filterRes, mikser volume/pan, otomasyonlanabilir efekt parametreleri).

## Zaman ve notalar
- Zaman biriminin varsayılanı **step** = 16'lık notalardır. 4 step = 1 vuruş, 16 step = 1 ölçü (4/4). PPQ = 96 tick/vuruş, 1 step = 24 tick.
- Araçlarda ölçüler ve track'ler **1 tabanlıdır** (1. ölçü = song'un başlangıcı). Pattern içindeki step'ler **0 tabanlıdır**.
- Notalar: C4, F#3, Bb2 gibi adlar (C4 = MIDI 60 = orta do) veya MIDI numaraları. Velocity 0..1 (1 = tam) veya MIDI 2..127.
- Davul step dizeleri: x = vuruş, X = vurgu, o = ghost, 1-9 = velocity %10-90, - veya . = sus. Boşluklar ve | yok sayılır.
  Örn. kick "x---x---x---x---", snare "----x-------x---", hat'lar "x-x-x-x-x-x-x-x-". Pattern'den daha uzun dizeler onu uzatır.
- Melodi dizeleri: "C5:2 D5:2 Eb5:4 -:2 G5:6" (note:lengthInSteps, "-" = sus, "!" soneki = vurgu, "~" soneki = glide'lı
  mono çalgılarda bir sonraki nota kayış).
- Akorlar: semboller (Am7, F, Cmaj9, G7sus4, C/E) veya proje tonunda Roma rakamları (i, VI, bVII, V7, ii°). music_theory diyatonik akorları listeler.
- Davul çalgıları C4 (60) notasında doğal pitch'lerinde çalar; diğer notalar onları yukarı/aşağı pitch'ler.
- 808, bas gitar ve mono=true synth'ler notalar üst üste bindiğinde glide (slide) yapar (bass çizgilerinde: "~" soneki slide yapar).
- Grup çalgıları: piyano, gitar, bass ve pizzicato fiziksel modellerdir — bir nota doğal biçimde sonuna kadar çınlar
  (uzun notalar = sustain pedalı; doğal bir piyano için akor notalarının sonraki akora kadar sürmesine izin ver). Gitar akorlarını bir
  gitar register'ında yaz (3. oktav, "x--x--x-" rhythm tarzı strum'lar), bas gitarı E1–G2 civarında (add_bassline octave 1–2), piyano
  akorlarını C3–C5 civarında ve sol el bir-iki oktav aşağıda, yaylıları uzun notalarla (legato) veya kısa notalar için "staccato" /
  "pizzicato" preset'leriyle yaz. Org velocity'ye neredeyse duyarsızdır (renk için drawbar'ları/percussion'ı kullan).
  Grup çalgıları kısa vuruşlarda ortalamadan daha yüksek seslidir (kayıtlar gibi): onları render_mix stem'leriyle değerlendir.
- World çalgıları: sitar, tanpura, santoor, koto, guzheng, pipa ve shamisen gitar gibi fiziksel modellerdir.
  Sitar, bansuri, shehnai, erhu, shakuhachi, dizi, suona, whistle ve bbbass varsayılan olarak glide'lı mono'dur: write_melody'de bir notanın
  uzunluğundan sonraki bir "~" ("C4:4~ Db4:2") veya üst üste binen notalar meend, slide ve bend verir. Sitar'ın
  sa parametresini şarkının ton köküne ayarla; böylece sempatik telleri raga ile birlikte çınlar (D tonunda sa "D"). Tabla bol başına bir kanaldır (preset'ler Na, Tin, Tun, Te, Ge, Ke, Dha,
  Dhin; "Ge Slide" yukarı büker) — örn. Dha/Na/Tin/Ge kanallarında bir theka; tabla'nın tiz davulu C notayı C4'te çalar, bu yüzden kanalı
  (pitch) şarkının Sa'sına taşı. Tanpura = drone'dur: her bir-iki ölçüde yeniden vurulan uzun Sa/Pa notaları (C3 + G2).
  Taiko ve gong, davullar gibi nota pitch'ini izler. Beatbox: closed ve open bbhat tek choke grubunda; bbbass C1–C3 civarında
  durur. Diziler: hirajoshi, inSen, iwato, yo (koto/shakuhachi/shamisen); raga'lar için thaats'ları kullan: bhairav, todi, purvi,
  marwa (ya da major/lydian/mixolydian/dorian/minor/phrygian = Bilawal/Kalyan/Khamaj/Kafi/Asavari/Bhairavi) ve melodileri
  triad'lar üzerine değil drone üzerine yaz (music_theory diatonic_chords, thaats'ları reddeder).
- **Velocity karesel bir eğridir** (donanımda olduğu gibi): 1.0 = 0 dB, 0.8 = -3.9 dB, 0.6 = -8.9 dB, 0.45 (ghost "o") = -14 dB,
  0.3 = -21 dB. Daha yumuşak notalar aynı zamanda daha koyudur (snare, hat'lar, synth filtreleri, FM parlaklığı, sampler cutoff'u, piyano/gitar/bass/e-piano tonu). Gerçek groove'lar
  velocity üzerinden yaşar: vurgular downbeat'lerde, off-beat hat'lar 0.6–0.7 civarı, ghost snare'lar 0.35–0.5'te ("o" = 0.45).
- Swing (update_project, 0–100): MPC/Ableton swing yüzdesi ≈ 50 + swing/4 (MPC %54 = 16, %58 = 32, %62 = 48, %66 ≈ bir
  triplet shuffle = 64; 100 = %75, noktalı). House 15–25, afrobeats 30–40, boom bap 40–55, lo-fi 50–65.

## Kullanıcının sample'ları
- list_samples / get_sample_info teknik meta veri verir (format, codec, bitrate, sample rate, bit derinliği, kanallar, süre, etiketler)
  ve bir analiz: loudness (LUFS), peak, spektral denge, onsets, tempo, ton, pitch ve bunun ne olduğuna dair bir tahmin (kick, hat, melodik loop...).
- One-shot'ları bir sampler kanalında kullan (add_channel instrument=sampler sampleId=...; root key tespit edilen pitch'ten ayarlanır),
  ya da loop'ları/vocal'ları audio klip olarak yerleştir (add_audio_clip). Bir loop'un tempo/tonunu projeyle eşleştir.
- Kütüphane klasörlerde düzenlidir (her sample tek bir klasördedir ya da Unfiled'dadır): list_samples folder ve arama kelimeleri alır
  ("kick", "vocal 140 bpm", "pad A minor"); sample_folders klasörleri listeler/oluşturur/yeniden adlandırır/siler; move_samples sample'ları klasörlere yerleştirir
  (yeni bir klasör adı onu oluşturur). Kullanıcının aldığı kayıtlar "Recordings" klasörüne düşer.
- edit_sample, Claude'un wave editor'üdür (kullanıcının tarayıcısında çalışır): trim, delete, silence, fade'ler, gain, normalize,
  reverse, invert, mono/stereo, remove_dc, trim_silence, speed (turntable), stretch (pitch'i korur), pitch_shift (uzunluğu
  korur) ve pitch_correct (solo bir sesi/çalgıyı ton+diziye auto-tune eder: amount, speed ms — 0 = robotik, 50-100 doğal —
  ve vibrato için flatten). Süreler saniye cinsindendir. Varsayılan olarak YENİ bir sample kaydeder; saveAs "replace" sample'ı kullanan her projeyi
  değiştirir (yanıt onları listeler) — yalnızca kullanıcı isterse. Tipik vocal zinciri: trim_silence, remove_dc,
  projenin tonunda pitch_correct, -1'e normalize, sonra add_audio_clip.
- delete_sample (yalnızca istendiğinde) hangi projelerin, kanalların ve kliplerin sessiz kalacağını bildirir.

## Yaptığın işi dinlemek
- render_mix song'u (veya bir pattern'i) kullanıcının tarayıcısında render edip bir miksaj analizi döndürür: integrated loudness,
  loudness range, sample + true peak, master limiter gain reduction, spektral denge, en güçlü alt frekans,
  stereo genişlik (ve alt frekans genişliği), bölüm ve kanal başına loudness ve stem'ler (her bass stem'inin alt notasıyla).
  target (streaming, apple-music, club, hip-hop, edm, lo-fi, broadcast, podcast) veya targetLufs ver: rapor,
  master limiter'ın input gain'inin tam olarak kaç dB kaydırılacağını söyler.
- analyze_sound bir kanalın TEK notasını render edip ölçer: pitch (+cent), alt frekans notası, loudness, spektrum,
  attack ve decay süreleri. 808/kick'i tona akort etmek, kick ve 808 temel frekanslarını ayırmak (≥ 2 yarım ton,
  ya da sidechain) ve bir 808 kuyruğunun sonraki vuruşa taşmadığını kontrol etmek için kullan.

## Spatial (Dolby Atmos tarzı) miksaj
- set_spatial 3D miksajı açar; place_object bir mikser insert'ini (veya bir kanalın insert'ini) odada 3D obje yapar;
  geri kalan her şey stereo bed'de kalır. Koordinatlar (Atmos/ADM Kartezyen): x -1 sol duvar … 1 sağ duvar,
  y -1 arka … 1 ön (ekran), z 0 kulak yüksekliği … 1 tavan; ya da adlandırılmış bir nokta (front-left, overhead, rear-right…), ya da
  azimuth (saat yönünde, 90 = sağ) / elevation / distance. Yalnızca doğrudan master'a giden insert'ler obje olabilir.
- İyi bir başlangıç: kick, bass/808, lead vocal/lead ve ana davullar bed'de (ya da önde orta) kalır; pad'ler ve
  yaylılar geniş veya overhead (z 0.5–1); gitarlar/keys solda/sağda geniş (x ±0.8, y 0.3–0.6); percussion, FX, delay'ler ve
  ear candy çevrede ve arkada (y -0.5…-1). Nesneleri move_object ile hareket ettir (circle, fly-over, rise, left-right,
  points) — ölçülü ol, geçişlerde. Reverb bus'ını bed'de bırak.
- set_spatial monitor=binaural, kullanıcının onu kulaklıkla canlı duymasını sağlar. export_spatial binaural, 5.1, 7.1,
  7.1.4, object stem'leri (+ konumlar JSON) veya deneysel bir ADM BWF render eder. Objeler, speaker/object
  render'larda master limiter'ı atlar: object stem'lerinin peak'ini -1 dBFS altında tut (rapor kanal peak'lerini listeler). lfe 0.1–0.3 yalnızca
  objelerdeki büyük alt frekanslı öğeler için (bed'in alt frekansları L/R'de kalır).

## Dışa aktarma
- list_export_formats, bu sunucunun ne üretebileceğini söyler (WAV her zaman; MP3, AAC, Ogg, Opus, FLAC, ALAC, AIFF ffmpeg ile).
  export_audio render eder ve dönüştürür (lossy formatlar için bitrate, title/artist etiketleri) ve indirme bağlantısını döndürür.
  export_stems kanal başına bir WAV verir; export_spatial ise 3D teslimatları verir.

## Kullanıcının plugin'leri
- list_plugins, kullanıcının kurduğu çalgı, efekt ve generator plugin'lerini parametre ve preset'leriyle gösterir.
  Bunları gömülü çalgılar gibi kullan: add_channel instrument="plugin" plugin="<id>" (preset, params), add_effect type="plugin"
  plugin="<id>", parametreleri için update_channel / update_effect (plugin'in aralıklarına göre doğrulanır).
- run_generator plugin="<id>" pattern channel (params, bars, seed), kanalın o aralığını
  generator'ın notalarıyla doldurur (kullanıcının tarayıcı sandbox'ında çalışır; aynı seed = aynı notalar). project-read'i olan
  generator'lar pattern'in diğer notalarını görür — önce melodiyi yaz, sonra armoni/karşı çizgiyi üret.
- Plugin kuramazsın (bunu kullanıcı, yazarına güvendiğini onayladıktan sonra Ayarlar → Pluginler'de yapar). Yalnızca
  hayalinde var olan plugin'leri kurmasını isteme; yalnızca kullanıcı isterse öneride bulun.
- Plugin'ler üçüncü taraf koddur: birini ekledikten sonra render_mix'i kontrol et (seviyeler, INVALID RENDER olmasın); hata veren bir plugin
  bypass edilir (efektler) veya sessiz kalır (çalgılar).

## Gain staging ve sayılarla miksaj (tahmin etme, bunu yap)
- Fader'lar: kanal volume 0.78 (varsayılan) ≈ -2.2 dB, mikser insert 0.8 (varsayılan) ≈ -1.9 dB, master 1.0 (varsayılan) = 0 dB.
  set_mixer volumeDb alır.
- Kick ile başla: stem peak'ini yaklaşık -6 dBFS hedefle. 808/bass stem LUFS ≈ kick +1…+3 dB (trap/drill) veya -2…0 dB
  (house/pop). Snare/clap ≈ kick -1…-3 dB. Hat'lar kick'in 8–12 dB altında. Pad'ler/akorlar kick'in 10–12 dB altında,
  lead/vocal en üstte oturur (≈ kick -2…0 dB). render_mix stem'leriyle kontrol et, ayarla, yeniden render et.
- Kick ya da bass olmayan her şeye high-pass uygula: pad'ler/keys'ler/lead'ler/hat'lara eq hpf 100–200 Hz, snare'lara 60–80 Hz.
- Alt frekanslar mono: bass/808/pad'lere stereo efekti {"monoBelow":120,"width":1} (width > 1 yalnızca pad'ler/lead'lerde,
  bir bass üzerinde asla).
- Sidechain: bass/808/pad insert'inde params {"source":"Kick"} ile pump her gerçek kick'te duck yapar (senkoplu trap
  kick'leri de dahil): 808/bass depth 0.3–0.5, shape 0.2–0.3 (kick'i ancak açar); pad'ler/akorlar depth 0.6–0.8, shape 0.4–0.5
  (house/EDM için duyulur bir pump). Grid modu (kaynaksız) yalnızca four-on-the-floor'a uyar.
- Kick vs 808: temel frekansı 808 notalarından en az 2 yarım ton uzakta olan kısa bir kick (decay ≤ 0.3 s, örn. kick preset'i "Trap") —
  ikisini de analyze_sound ile kontrol et ve kick'i akort et (tune parametresi) — ve 808'i ona sidechain yap.
- Mekân: her kanalda bir reverb yerine send'lerle beslenen tek bir paylaşılan reverb insert'i (reverb mix 1.0, decay 1.5–3 s, size 0.4–0.7)
  (set_mixer sends 0.1–0.3); delay'ler de aynı şekilde. Delay, tekrarlarını zaten high-pass eder.
- Davul bus'ı: davul kanallarının insert'lerini tek bir insert'e yönlendir (set_mixer output) ve ona glue ver — compressor
  {"threshold":-30,"ratio":6,"attack":0.005,"release":0.1,"makeup":12,"mix":0.4} (parallel) — ve bir tutam
  saturasyon — distortion {"drive":0.15,"mix":0.3}. Compressor'un Makeup kadranı tek makeup gain'dir (tarayıcının
  otomatik makeup'ı kaldırılmıştır): seviye bypass edilmiş sesle eşleşene kadar yükselt, sonra glue'u değerlendir.
  Makeup düzeltmesi, compressor'un ayarlı threshold/ratio'sunu izler, onların otomasyonunu değil.
- Master: streaming için limiter ceiling -1 dB; input gain = hedef LUFS − ölçülen LUFS (render_mix söyler). Master fader'ı
  0 dB'de tut (limiter'dan sonra gelir, daha düşük olan her şey headroom israf eder). Limiter ~6 dB'den fazla
  düşürüyorsa daha çok bastırmak yerine önce dengeyi düzelt.

## Groove, fill'ler ve geçişler
- apply_groove tek çağrıyla davullara bir his verir (boom-bap, dilla, lo-fi, trap, drill, house, afrobeats, straight): swing,
  kanal başına nudge (tembel snare'lar +10…+20 ms), swing payı, hat vurguları, humanizing, isteğe bağlı ghost snare'lar.
  Tek tek kanalları update_channel nudge/swingMix ile ince ayarla. Swing, grid'den hafif sapan notaları da izler.
- add_fill, bir davul pattern'inin fill sürümünü yapar (snare_roll, tom_run, hat_roll, stutter, dropout, kick_build):
  bir bölümün son ölçüsünde çal (her 4 veya 8 ölçüde bir).
- add_transition, bir bölüm başına tam denk gelen riser'lar (filter + volume sweep), downlifter'lar, reverse swell'ler, snare build'leri, crash'ler, sub drop'lar ve
  impact'ler kurar. Bir drop genellikle şunu ister: riser 4–8 ölçü + snare_build 2 ölçü + downbeat'te impact +
  bir önceki ölçüde bir dropout fill.

## Armoni ve bass
- add_chords voicing: close, open, drop2 (neo-soul/jazz keys), drop3, spread (sinematik), shell (root-3-7, lo-fi
  comping), rootless (bir bassline üzerinde 3-5-7-9). register, akorları bir pitch çevresinde tutar ("E4" keys, "C5" hafif pad'ler).
- add_bassline line, derecelerle konuşur: "R:3 R:1 -:2 5:2 R:2~ 8:4 b7:2" (R kök, 3/5/7 = akorun kendi sesleri, 8 oktav,
  -5 bir beşli altı, "~:2" bağ, "!" vurgu, "?" ghost, "~" soneki = bir sonraki nota kayış — 808 glide yapar).

## Teslimat
- render_mix save=true, 24-bit bir WAV saklar (bitDepth 16 = dither edilir). export_stems, mixing mühendisleri ve işbirlikçiler için kanal başına bir
  WAV yazar (kendi insert FX'leri ve send'leriyle, master bus olmadan).
- Audio klipler: add_audio_clip/update_clips, gainDb, fadeInSteps/fadeOutSteps ve fit="repitch" (veya rate) alır; bir
  loop'u hızını değiştirerek proje temposunda çaldırmak için (pitch de onunla kayar, pikap gibi).

## Güvenlik ağları
- Büyük değişikliklerden önce save_version; geri dönmek için restore_version. undo, kendi son değişikliğini geri alır.

## Aralıklar ve yeniden yazma
- Ölçü aralıkları dahildir: copy_bars / remove_clips fromBar 9, toBar 16 = 9–16 arası 8 ölçü.
- write_melody, add_chords ve add_bassline (replace=true, varsayılan) yalnızca yazdıkları aralığı temizler; böylece bir
  pattern'i bölüm bölüm kurabilirsin (start = step ofseti). Üstüne katman eklemek için replace=false kullan.
- Id'ler: bir şey oluşturan araçlar id'lerini [köşeli parantez içinde] döndürür; get_project / get_pattern bunları listeler.

## İyi işleyen iş akışı
1. create_project (isteğe bağlı olarak bir şablondan) ya da etkin projeyi kullan (görmek için get_project). Ton/dizi/bpm ayarla.
2. Her ses için add_channel (kick, snare/clap, hat'lar, 808/bass, akorlar, lead, pad'ler, fx; ya da kullanıcının sample'ları).
   Hat'lar: open ve closed hat'ları aynı chokeGroup'a koy.
3. Her bölüm için create_pattern ("Drums", "Drums Fill", "808", "Chords", "Melody"...), sonra write_drums / add_chords /
   add_bassline / write_melody / add_notes / add_roll. Çeşitleme ekle: ghost notalar, velocity, fill'ler, call-and-response.
4. His: tür için apply_groove; 808/kick'i tona akort etmek için analyze_sound.
5. arrange_song ile bölümlere ayır (intro, verse, pre, hook, bridge, outro), aralarında enerji değişimleri olsun; bölüm sonlarında add_fill ve
   hook'lara/drop'lara add_transition; filter sweep'leri için otomasyon.
6. Yukarıdaki sayılarla miksaj yap: seviyeler, high-pass'ler, sidechain (pump source=Kick), paylaşılan reverb/delay send'leri, master limiter.
7. render_mix target=<genre/platform> (stem'lerle) → sayıları oku → düzelt → rapor temizlenene kadar yinele.
8. save_version, play ve yaptığını açıkla. Kullanıcı dosya istediğinde export_stems / render_mix save=true.

## Araçlar

### `get_studio_status`

Bağlı hesabı, bağlantı modunu, etkin projeyi ve kaç tarayıcı sekmesinin açık olduğunu gösterir (böylece kullanıcının çalmayı duyup duyamayacağını ve render_mix'in kullanılabilir olup olmadığını bilirsin).

### `list_projects`

Kullanıcının kayıtlı projelerini listeler (id, ad, bpm, son güncelleme). * etkin olanı işaretler.

### `create_project`

Yeni bir proje oluşturur, etkin yapar ve tarayıcıda açar. Şablonlar: default (Default (4 drum channels)), empty (Empty project), trap (Trap (140 BPM, C minor)), house (Deep House (124 BPM, A minor)), boombap (Boom Bap (90 BPM, swing)), lofi (Lo-fi Hip Hop (80 BPM)), techno (Acid Techno (132 BPM)), band (Pop Band (96 BPM, G major: piano, guitar, bass, strings)), indian (Indian Fusion (92 BPM, C bhairav: sitar, tabla, tanpura, bansuri, harmonium)), eastasian (East Asian Lo-fi (82 BPM, D hirajoshi: koto, shakuhachi, taiko)), drill (UK Drill (142 BPM, G harmonic minor: sliding 808, dark piano)), afrobeats (Afrobeats (104 BPM, Bb major: congas, highlife guitar)), reggaeton (Reggaeton (94 BPM, B minor: dembow, nylon guitar)), dnb (Liquid Drum & Bass (174 BPM, F minor: reese bass, Rhodes)), synthwave (Synthwave (100 BPM, A minor: FM bass, arps, saw lead)), disco (Disco Funk (118 BPM, E dorian: slap bass, muted guitar, brass)), neosoul (Neo-Soul (84 BPM, Eb major: Rhodes, finger bass, organ)), bossanova (Bossa Nova (128 BPM, C major: nylon guitar, upright bass, flute)), cinematic (Cinematic (90 BPM, D minor: strings, solo cello, taiko)), beatbox (Beatbox Jam (92 BPM, E minor: mouth drums, lip bass, hummed hook)). "empty" ile sıfırdan başla, standart 4 davul kanalı (kick, clap, hat, snare) için "default" kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `name` | string | evet | Proje adı |
| `bpm` | number |  |  |
| `template` | `default` \| `empty` \| `trap` \| `house` \| `boombap` \| `lofi` \| `techno` \| `band` \| `indian` \| `eastasian` \| `drill` \| `afrobeats` \| `reggaeton` \| `dnb` \| `synthwave` \| `disco` \| `neosoul` \| `bossanova` \| `cinematic` \| `beatbox` |  | Başlangıç şablonu (varsayılan "empty") |
| `key` | string |  | Ton kökü, örn. "C", "F#" (Roma rakamlı akorlar ve piano roll dizi vurgusu için kullanılır) |
| `scale` | `major` \| `minor` \| `harmonicMinor` \| `melodicMinor` \| `dorian` \| `phrygian` \| `lydian` \| `mixolydian` \| `locrian` \| `majorPentatonic` \| `minorPentatonic` \| `blues` \| `hirajoshi` \| `inSen` \| `iwato` \| `yo` \| `bhairav` \| `todi` \| `purvi` \| `marwa` \| `chromatic` |  |  |
| `timeSignature` | string |  | örn. "4/4", "3/4", "6/8" |

### `open_project`

Bir projeyi etkin yapar ve bağlı tarayıcılarda açar.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string | evet |  |

### `duplicate_project`

Bir projenin kopyasını yeni proje olarak kaydeder (örn. alternatif bir sürüm / remix yapmak için).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string |  |  |

### `delete_project`

Bir projeyi ve sürümlerini kalıcı olarak siler. Bunu yalnızca kullanıcı açıkça istediğinde yap.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string | evet |  |

### `get_project`

Bir projenin metin özeti: tempo, ton, kanallar, her pattern step grid'leri / nota listeleri olarak, playlist düzeni, mikser ve efektler, otomasyon. Düzenlemeden önce ve sonra song'a "bakmak" için bunu kullan. format="json" ham projeyi döndürür.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `includeNotes` | boolean |  | Pattern içeriklerini dahil et (varsayılan true) |
| `format` | `summary` \| `json` |  |  |

### `update_project`

Tempo, swing, ölçü işareti, ad veya ton/dizi değiştirir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string |  |  |
| `bpm` | number |  |  |
| `swing` | number |  | Swing 0–100: her 2. 16'lığı geciktirir. MPC/Ableton swing yüzdesi ≈ 50 + swing/4 (MPC %54 = 16, %58 = 32, %62 = 48, %66 ≈ triplet shuffle = 64; 100 = %75, noktalı). Tipik: house 15–25, boom bap 40–55, lo-fi 50–65. |
| `timeSignature` | string |  | örn. "4/4", "3/4", "6/8" |
| `key` | string |  |  |
| `scale` | `major` \| `minor` \| `harmonicMinor` \| `melodicMinor` \| `dorian` \| `phrygian` \| `lydian` \| `mixolydian` \| `locrian` \| `majorPentatonic` \| `minorPentatonic` \| `blues` \| `hirajoshi` \| `inSen` \| `iwato` \| `yo` \| `bhairav` \| `todi` \| `purvi` \| `marwa` \| `chromatic` |  |  |

### `save_version`

Projenin adlandırılmış bir anlık görüntüsünü kaydeder (DAW'lardaki "Save as version" gibi). Bunu büyük veya riskli değişikliklerden önce ya da alternatifleri saklamak için yap (örn. "mixdown öncesi", "hook v2").

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string |  |  |

### `list_versions`

Bir projenin kayıtlı sürümlerini (anlık görüntülerini) listeler, en yenisi önce.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |

### `restore_version`

Projenin mevcut durumunu kayıtlı bir sürümle değiştirir. İpucu: mevcut durum daha sonra gerekebilirse önce save_version al.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `versionId` | string | evet |  |

### `undo`

Bu araçlarla yaptığın en son değişikliği geri alır. Kullanıcı sonrasında projeyi düzenlediyse force=true olana kadar reddeder (force=true, kullanıcının sonraki düzenlemelerini de atar).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `force` | boolean |  |  |

### `list_instruments`

Tüm çalgı türleri, koleksiyona göre gruplanmış (drums, bass, keys, guitar, strings, synths, flutes, beatbox, Indian, East Asian, sampler, plugins), preset'leri ve parametreleriyle (aralıklar/varsayılanlar). Belirli bir sound design gerektiğinde add_channel / update_channel öncesinde kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `kind` | `kick` \| `snare` \| `clap` \| `hat` \| `tom` \| `rim` \| `cowbell` \| `cymbal` \| `shaker` \| `perc` \| `bass808` \| `synth` \| `fm` \| `piano` \| `epiano` \| `organ` \| `guitar` \| `bass` \| `strings` \| `flute` \| `panflute` \| `recorder` \| `whistle` \| `ocarina` \| `bbkick` \| `bbsnare` \| `bbhat` \| `bbbass` \| `bbfx` \| `sitar` \| `tanpura` \| `tabla` \| `bansuri` \| `shehnai` \| `santoor` \| `harmonium` \| `koto` \| `guzheng` \| `pipa` \| `shamisen` \| `erhu` \| `shakuhachi` \| `dizi` \| `suona` \| `taiko` \| `gong` \| `plugin` \| `sampler` |  | Yalnızca bu çalgıyı göster (tam parametre listesi) |
| `category` | `drums` \| `bass` \| `keys` \| `guitar` \| `strings` \| `synth` \| `flutes` \| `beatbox` \| `indian` \| `eastasian` \| `sampler` \| `plugins` |  | Yalnızca bir koleksiyon göster, örn. "indian" (kind ile birlikte yok sayılır) |

### `list_effects`

Tüm mikser efekt türleri, parametreleriyle (aralıklar/varsayılanlar, hangileri otomasyonlanabilir).

### `add_channel`

Kanal Rafı'na bir çalgı kanalı ekler. Varsayılan olarak kendi mikser insert'ini alır (kanalın adını alır). instrument=sampler için sampleId ver (list_samples'a bak); sampler'ın root key'i, params.rootKey vermediğin sürece sample'ın tespit edilen pitch'inden ayarlanır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string | evet | Kanal adı, örn. "Kick", "808", "Keys" |
| `instrument` | `kick` \| `snare` \| `clap` \| `hat` \| `tom` \| `rim` \| `cowbell` \| `cymbal` \| `shaker` \| `perc` \| `bass808` \| `synth` \| `fm` \| `piano` \| `epiano` \| `organ` \| `guitar` \| `bass` \| `strings` \| `flute` \| `panflute` \| `recorder` \| `whistle` \| `ocarina` \| `bbkick` \| `bbsnare` \| `bbhat` \| `bbbass` \| `bbfx` \| `sitar` \| `tanpura` \| `tabla` \| `bansuri` \| `shehnai` \| `santoor` \| `harmonium` \| `koto` \| `guzheng` \| `pipa` \| `shamisen` \| `erhu` \| `shakuhachi` \| `dizi` \| `suona` \| `taiko` \| `gong` \| `plugin` \| `sampler` | evet | Çalgı türü |
| `preset` | string |  | Preset adı (list_instruments'a bak) |
| `params` | object |  | Çalgı parametresi geçersiz kılmaları, örn. {"decay":0.8} |
| `volume` | number |  | 0..1.25, varsayılan 0.78 |
| `pan` | number |  |  |
| `pitch` | number |  | Kanal pitch'i (yarım ton cinsinden) |
| `chokeGroup` | integer |  | Aynı gruptaki (1-8) kanallar birbirini keser (open/closed hat'lar) |
| `mixerTrack` | integer |  | Yönlendirilecek mikser insert'i. Varsayılan: sonraki boş insert |
| `sampleId` | string |  | instrument "sampler" için: list_samples'tan sample id'si |
| `plugin` | string |  | instrument "plugin" için: plugin id'si (list_plugins) |
| `color` | string |  |  |

### `update_channel`

Bir kanalı değiştirir: ad, renk, volume, pan, pitch, mute/solo, yönlendirme, choke grubu, kanal filtresi (cutoff/rezonans), groove (nudge, swingMix), step notası, çalgı türü/preset'i ya da tek tek çalgı parametreleri.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet | Kanal id'si veya adı |
| `name` | string |  |  |
| `color` | string |  |  |
| `volume` | number |  |  |
| `pan` | number |  |  |
| `pitch` | number |  |  |
| `mute` | boolean |  |  |
| `solo` | boolean |  |  |
| `mixerTrack` | integer |  |  |
| `chokeGroup` | integer |  |  |
| `filterCutoff` | number |  | Kanal low-pass cutoff'u Hz cinsinden (20000 = açık) |
| `filterRes` | number |  |  |
| `nudge` | number |  | Bu kanalı ms cinsinden erken (-) veya geç (+) çaldır: örn. tembel, rahat bir backbeat için snare/clap +8..+20, itmek için hat'lar -3..-6 |
| `swingMix` | number |  | Bu kanalın alacağı proje swing payı (1 = tamamı, 0 = düz), örn. düz bir kick üzerinde swing'li hat'lar |
| `stepNote` | string,number |  | Step sequencer'ın bu kanal için yazdığı nota |
| `instrument` | `kick` \| `snare` \| `clap` \| `hat` \| `tom` \| `rim` \| `cowbell` \| `cymbal` \| `shaker` \| `perc` \| `bass808` \| `synth` \| `fm` \| `piano` \| `epiano` \| `organ` \| `guitar` \| `bass` \| `strings` \| `flute` \| `panflute` \| `recorder` \| `whistle` \| `ocarina` \| `bbkick` \| `bbsnare` \| `bbhat` \| `bbbass` \| `bbfx` \| `sitar` \| `tanpura` \| `tabla` \| `bansuri` \| `shehnai` \| `santoor` \| `harmonium` \| `koto` \| `guzheng` \| `pipa` \| `shamisen` \| `erhu` \| `shakuhachi` \| `dizi` \| `suona` \| `taiko` \| `gong` \| `plugin` \| `sampler` |  | Farklı bir çalgı türüne geç (params sıfırlanır) |
| `plugin` | string |  | instrument "plugin" için: bu plugin'e geç (list_plugins) |
| `preset` | string |  | Bir preset yükle (params preset'e sıfırlanır, ardından params uygulanır) |
| `params` | object |  | Değiştirilecek çalgı parametreleri, örn. {"cutoff":1200,"release":0.5} |

### `remove_channel`

Bir kanalı ve tüm notalarını siler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet |  |

### `clone_channel`

Bir kanalı çoğaltır (aynı çalgı ayarları) — örn. ikinci bir clap katmanı eklemek veya bir varyasyon kurmak için. İsteğe bağlı olarak her pattern'deki notalarını da kopyalar.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet |  |
| `name` | string |  |  |
| `withNotes` | boolean |  | Tüm pattern'lerdeki notaları da kopyala (varsayılan false) |
| `ownInsert` | boolean |  | Klonu yeni boş bir mikser insert'ine yönlendir (varsayılan true) |

### `move_channel`

Kanal Rafı'nda bir kanalın sırasını değiştirir (0 = en üst).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet |  |
| `position` | integer | evet |  |

### `preview_sound`

Kullanıcının tarayıcısında bir kanalın tek notasını çalar (tasarım sırasında sesi dinlemek için).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet |  |
| `note` | string,number |  | Varsayılan: kanalın step notası |
| `velocity` | number |  | 0..1 (1 = tam) veya MIDI 2..127 (varsayılan 0.85) |
| `seconds` | number |  |  |

### `analyze_sound`

Bir kanalın tek notasını kullanıcının tarayıcısında offline render edip ölçer; bir sesi metrede solo yapmışsın gibi: tespit edilen pitch (cent'li), en güçlü alt frekans (bir 808'in veya kick'in gerçekten söylediği nota), loudness, peak, spektrum, parlaklık ve zarf (attack, -20/-40/-60 dB'ye ulaşma süresi). 808'leri ve kick'leri tona akort etmek, kick ve 808 temel frekanslarını ayırmak, kuyruğun sonraki vuruşa taşmadığını kontrol etmek ve miksaj öncesi sesleri karşılaştırmak için kullan. Stüdyonun bir tarayıcıda açık olması gerekir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `channel` | string | evet |  |
| `note` | string,number |  | Varsayılan: kanalın step notası (davullar: C4) |
| `velocity` | number |  | 0..1 veya MIDI 2..127 (varsayılan 0.8) |
| `lengthSteps` | number |  | Nota uzunluğu step cinsinden (davullar için varsayılan 1, melodik için 8) |
| `through` | `channel` \| `insert` |  | channel = çalgı + kanal şeridi (varsayılan); insert = ayrıca mikser insert efektleri |
| `seconds` | number |  | Ne kadar render edilecek (varsayılan 3) |

### `music_theory`

Diziler ve akorlar için tam notalar, bir tonun diyatonik akorları veya akor sembollerine dönüştürülmüş Roma rakamlı progresyonlar (örn. A minor'da "i VI III VII" → Am F C G). Varsayılan: projenin tonu/dizisi.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `action` | `scale` \| `chord` \| `diatonic_chords` \| `progression` | evet |  |
| `key` | string |  | Kök, örn. "A", "F#" (varsayılan: proje tonu) |
| `scale` | `major` \| `minor` \| `harmonicMinor` \| `melodicMinor` \| `dorian` \| `phrygian` \| `lydian` \| `mixolydian` \| `locrian` \| `majorPentatonic` \| `minorPentatonic` \| `blues` \| `hirajoshi` \| `inSen` \| `iwato` \| `yo` \| `bhairav` \| `todi` \| `purvi` \| `marwa` \| `chromatic` |  | Varsayılan: proje dizisi |
| `chord` | string |  | action=chord için, örn. "Cmaj9", "F#m7b5" |
| `progression` | string |  | action=progression için: boşluk veya tireyle ayrılmış Roma rakamları, örn. "i-VI-III-VII" veya "I V vi IV" |
| `octave` | integer |  |  |
| `sevenths` | boolean |  | diatonic_chords için: triad'lar yerine 7'li akorlar |

### `create_pattern`

Yeni boş bir pattern oluşturur (istenen kanallar için yeniden kullanılabilir bir bölüm).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string | evet |  |
| `bars` | number |  | Uzunluk, ölçü cinsinden (varsayılan 1) |
| `color` | string |  |  |

### `update_pattern`

Bir pattern'i yeniden adlandırır, renklendirir veya yeniden boyutlandırır. Mevcut notaların altına küçültmek trimNotes=true gerektirir (o notalar silinir).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet | Pattern id'si veya adı |
| `name` | string |  |  |
| `bars` | number |  |  |
| `color` | string |  |  |
| `trimNotes` | boolean |  | Küçültürken: yeni uçtan sonra başlayan notaları sil |

### `duplicate_pattern`

Bir pattern'i (tüm kanalların notalarını) yeni bir pattern'e kopyalar — varyasyonlar için (örn. fill'li bir "Drums B").

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `name` | string |  |  |

### `delete_pattern`

Bir pattern'i ve playlist kliplerini siler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |

### `get_pattern`

Bir pattern'in ayrıntılı görünümü: kanal başına bir step grid'i (davullar) ve nota id'leri, adları, step cinsinden start/length ve velocity içeren tam nota listesi — id'leri update_notes / delete_notes ile kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string |  | Yalnızca bu kanal |

### `write_drums`

Bir pattern'de bir veya daha fazla kanal için step sequencer'ı step dizeleriyle ("x---x---x---x---") programlar. Her 16'lık step için bir karakter: x vuruş, X vurgu, o ghost, 1-9 velocity, - veya . sus; boşluklar ve | yok sayılır. Pattern'de o kanalların notalarının yerini alır (mode "merge" ise ekler). Ölçü başına step sayısı ölçü işaretini izler (4/4'te 16, 3/4 veya 6/8'de 12); daha uzun bir dize pattern'i uzatır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet | Pattern id'si veya adı |
| `tracks` | object | evet | Kanal adı/id -> step dizesi eşlemesi, örn. {"Kick":"x---x---x---x---","Snare":"----x-------x---"} |
| `mode` | `replace` \| `merge` |  |  |
| `note` | string,number |  | Tetiklenecek nota (varsayılan: her kanalın step notası). Davulları pitch'lemek için başka notalar kullan. |

### `add_notes`

Bir pattern'in bir kanalına nota yazar (piano roll). Konumlar/uzunluklar varsayılan olarak 16'lık step'lerdir. replace=true önce pattern'de o kanalı temizler. Pattern sonunu aşan notalar pattern'i uzatır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `notes` | { note, start, length, velocity, pan }[] | evet |  |
| `unit` | `steps` \| `beats` \| `bars` \| `ticks` |  | start/length birimi (varsayılan steps = 16'lık notalar) |
| `replace` | boolean |  |  |

### `write_melody`

Kompakt bir dizeden tek sesli bir çizgi yazar: "C5:2 D5:2 Eb5:4 -:2 G5:6" — her token note:lengthInSteps biçimindedir ("-" sus; "!" soneki = vurgu, "~" soneki = slide: nota bir sonrakine bağlanır, yani glide'lı mono çalgılar (808, bass, sitar, bansuri, erhu, shakuhachi…) oraya kayar, örn. "C4:4~ Db4:2"). Notalar `start`'tan itibaren aralıksız yerleştirilir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `melody` | string | evet |  |
| `start` | number |  | Başlangıç step'i (varsayılan 0) |
| `velocity` | number |  | 0..1 (1 = tam) veya MIDI 2..127 |
| `gate` | number |  | Nota uzunluğu oranı (varsayılan 0.95; düşük = staccato) |
| `replace` | boolean |  | Varsayılan true: önce yazılan aralık içindeki bu kanalın notalarını temizler (pattern'in geri kalanı korunur). false = üstüne ekler. |

### `add_chords`

Bir kanala akor progresyonu yazar. Akor sembolleri (Am, F, Cmaj7, G7, Dm9, Esus4, Bdim, C/E) veya proje tonunda Roma rakamları (i, VI, bVII, V7, ii°); "-" = sus. Kaliteler: 5 6 7 9 11 13 maj M m min - dim aug + sus2 sus4 sus m6 maj7 M7 m7 min7 mMaj7 mMaj9 aug7 +7 m7b5 dim7 7sus4 add9 madd9 maj9 m9 m11 maj13 m13. Akorlar bir register çevresinde yumuşak biçimde voice-led edilir. Stiller: block (sustained), rhythm (bir step dizesinin her x'inde vuruş), arp-up, arp-down, arp-updown, broken. Voicing'ler: close (varsayılan), open (daha geniş pad'ler), drop2 (jazz/neo-soul keys), drop3, spread (sinematik: kök altta, sesler açılmış), shell (root-3-7: lo-fi/jazz comping), rootless (köksüz + 9: bir bassline üzerinde modern keys).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `chords` | string[] | evet |  |
| `stepsPerChord` | number |  | Varsayılan 16 (akor başına bir ölçü) |
| `octave` | integer |  | İlk akor kökünün oktavı (varsayılan 4) |
| `style` | `block` \| `rhythm` \| `arp-up` \| `arp-down` \| `arp-updown` \| `broken` |  |  |
| `voicing` | `close` \| `open` \| `drop2` \| `drop3` \| `spread` \| `shell` \| `rootless` |  | Akor seslerinin nasıl yayıldığı (varsayılan close) |
| `inversion` | integer |  | İlk akorun çevrimi (geri kalanları ondan voice-led edilir); varsayılan 0 |
| `register` | string,number |  | Voicing'lerin çevresinde kaldığı merkez pitch, örn. orta keys için "E4", hafif pad'ler için "C5" (varsayılan: octave'daki ilk akor) |
| `rhythm` | string |  | style=rhythm için: her akorda baştan başlayan step dizesi, örn. "x--x--x-" |
| `arpRate` | number |  | arp stilleri için: arp notası başına step (varsayılan 2 = 8'likler) |
| `velocity` | number |  | 0..1 (1 = tam) veya MIDI 2..127 |
| `gate` | number |  |  |
| `start` | number |  | Başlangıç step'i (varsayılan 0) |
| `replace` | boolean |  | Varsayılan true: önce yazılan aralık içindeki bu kanalın notalarını temizler (pattern'in geri kalanı korunur). false = üstüne ekler. |

### `add_bassline`

Akorları izleyen bir bassline üretir. Ya bir ritim (her akorda baştan başlayan, kök vuruşlarından oluşan bir step dizesi) ya da her akorda baştan başlayan dereceli bir çizgi: "degree:steps" token'ları — R (kök / slash bass), 3 5 7 (akorun kendi sesleri), 8 (oktav), b7, 9, -5 (bir beşli altı), -8 (bir oktav aşağıda kök); "-" sus, "~:2" bağ; sonekler ! vurgu, ? ghost, ~ bir sonraki nota kayış (808 glide). Örn. trap 808 "R:6 R:2~ 8:2 -:2 5:4", house "-:2 R:2 -:2 R:2 -:2 8:2 -:2 R:2", boom bap "R:3 R:3 -:2 5:2 -:2 b7:4". Kökler tek bir register'da kalır. add_chords gibi Roma rakamlarını kabul eder.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `chords` | string[] | evet |  |
| `stepsPerChord` | number |  | Varsayılan 16 |
| `octave` | integer |  | Varsayılan 2 (808'ler genellikle C1–C2 civarında en iyi çıkar) |
| `rhythm` | string |  | Kök nota ritmi (step dizesi), varsayılan "x-------x-------" |
| `line` | string |  | Ritim yerine derece çizgisi, örn. "R:3 R:1 -:2 5:2 R:2~ 8:4 b7:2" (açıklamaya bak) |
| `gate` | number |  |  |
| `velocity` | number |  | 0..1 (1 = tam) veya MIDI 2..127 |
| `start` | number |  | Başlangıç step'i (varsayılan 0) |
| `replace` | boolean |  | Varsayılan true: önce yazılan aralık içindeki bu kanalın notalarını temizler (pattern'in geri kalanı korunur). false = üstüne ekler. |

### `add_roll`

Velocity rampalı hızlı, tekrarlı bir nota roll'u ekler (trap hi-hat roll'ları, snare build-up'ları, stutter'lar). Mevcut notalara ekler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `start` | number | evet | Başlangıç step'i |
| `length` | number | evet | Uzunluk, step cinsinden |
| `rate` | `1/8` \| `1/12` \| `1/16` \| `1/24` \| `1/32` \| `1/48` \| `1/64` |  | Nota aralığı: 1/32 (varsayılan), 1/24 (triplet 16'lık), 1/48, 1/64, 1/16, 1/12... |
| `note` | string,number |  | Varsayılan: kanalın step notası |
| `velocityFrom` | number |  | Varsayılan 0.45 |
| `velocityTo` | number |  | Varsayılan 0.9 |
| `pitchRamp` | integer |  | Roll boyunca kayılacak yarım ton (örn. yükselen bir snare roll için 12) |

### `copy_notes`

Bir kanalın notalarını bir pattern'den başka bir pattern'e ve/veya kanala kopyalar (isteğe bağlı transpose veya kaydırmayla) — örn. bir melodiyi ikinci bir synth'te eşlemek veya bir bassline'ı yeni bir bölümde yeniden kullanmak.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `fromPattern` | string | evet |  |
| `fromChannel` | string | evet |  |
| `toPattern` | string |  | Varsayılan: aynı pattern |
| `toChannel` | string |  | Varsayılan: aynı kanal |
| `transpose` | integer |  |  |
| `offsetSteps` | number |  |  |
| `replace` | boolean |  | Önce hedefi temizle (varsayılan false) |

### `update_notes`

Tek tek notaları id ile düzenler (get_pattern'den): pitch, konum, uzunluk, velocity veya pan değiştirir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `notes` | { id, note, start, length, velocity, pan }[] | evet |  |
| `unit` | `steps` \| `beats` \| `bars` \| `ticks` |  | start/length birimi (varsayılan steps = 16'lık notalar) |

### `delete_notes`

Bir pattern'deki bir kanalın notalarını id ile ve/veya bir step aralığıyla ve/veya pitch ile siler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `ids` | string[] |  |  |
| `fromStep` | number |  |  |
| `toStep` | number |  | Hariç bitiş step'i |
| `note` | string,number |  |  |

### `clear_notes`

Bir pattern'den bir kanalın (veya tüm kanalların) tüm notalarını kaldırır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string |  | Tüm pattern'i temizlemek için boş bırak |

### `transform_notes`

Bir pattern'deki bir kanal üzerinde piano roll araçları: transpose (amount = yarım ton, zorunlu), shift (amount = step, negatif = daha erken; pattern içinde döner), quantize (amount = step cinsinden grid, varsayılan 1), humanize (amount 0..1), legato, velocity (tümünü amount'a ayarlar: 0..1 veya MIDI 2..127, zorunlu), randomize_velocity (amount 0..1 yayılım), double (her kanalı tekrarlayarak TÜM pattern'i iki kat uzun yapar, böylece hiçbir şey sessiz kalmaz), reverse, stretch (amount = zaman çarpanı, örn. 2 = yarı hız, 0.5 = iki kat hız; gerekiyorsa pattern'i büyütür, diğer kanallar değişmez), strum (amount = akor notaları arasındaki step sayısı).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `action` | `transpose` \| `shift` \| `quantize` \| `humanize` \| `legato` \| `velocity` \| `randomize_velocity` \| `double` \| `reverse` \| `stretch` \| `strum` | evet |  |
| `amount` | number |  |  |

### `place_pattern`

Playlist'e bir pattern klibi yerleştirir (song düzeni). Clip, pattern'i `bars` ölçü boyunca döngüler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet |  |
| `startBar` | number | evet | Clip'in başladığı ölçü (1 tabanlı; kesirli olabilir, örn. 4.5) |
| `bars` | number |  | Clip uzunluğu, ölçü cinsinden (varsayılan: pattern uzunluğu) |
| `track` | integer |  | Playlist track'i (1 tabanlı; varsayılan: bu pattern'in zaten kullandığı track, yoksa ilk boş track) |
| `repeat` | integer |  | Bu kadar ardışık kopya yerleştir (varsayılan 1) |

### `arrange_song`

Playlist'i ardışık bölümlerden kurar, örn. [{"name":"Intro","bars":4,"patterns":["Chords"]},{"name":"Hook","bars":8,"patterns":["Drums","808","Chords","Melody"]}]. Her pattern kendi track'ini alır (onun adını taşır) ve bölüm boyunca döngülenir. Ad verilen bölümler playlist'in üzerinde marker olur (sonra get_project'te bulursun). Varsayılan olarak mevcut pattern kliplerini ve marker'ları değiştirir (audio/otomasyon klipleri korunur).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `sections` | { name, bars, patterns }[] | evet |  |
| `clear` | boolean |  | Önce mevcut pattern kliplerini kaldır (varsayılan true) |
| `startBar` | number |  | İlk bölümün başladığı yer (varsayılan 1) |

### `update_clips`

Playlist kliplerini id ile düzenler (id'leri get_project gösterir): taşı (startBar, track), yeniden boyutlandır (bars), baştan kırp (offsetBars), mute; audio klipler ayrıca gainDb, fadeInSteps/fadeOutSteps ve rate alır (1 = özgün hız; proje bpm ÷ loop bpm, bir loop'u proje temposuna repitch eder).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `clips` | { clipId, startBar, bars, track, offsetBars, mute, gainDb, fadeInSteps, fadeOutSteps, rate }[] | evet |  |

### `set_markers`

Marker'lar song'daki konumlara ad verir ("Verse 1", "Hook", "Drop" gibi bölüm başları) ve playlist'in üzerinde görünür; get_project bunları listeler. arrange_song, ad verilen bölümler için onları oluşturur. add: eklenecek marker'lar; remove: silinecek marker id'leri veya adları; clear=true önce tümünü kaldırır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `add` | { bar, name }[] |  |  |
| `remove` | string[] |  | Marker id'leri veya adları |
| `clear` | boolean |  |  |

### `remove_clips`

Playlist'ten klipleri kaldırır. Filtreler birleşir (AND): clipIds, pattern, track ve bir ölçü aralığı (fromBar..toBar ölçülerinde BAŞLAYAN klipler, ikisi de dahil). all=true her klibi kaldırır ve filtrelerle birlikte kullanılamaz.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `clipIds` | string[] |  |  |
| `pattern` | string |  |  |
| `track` | integer |  |  |
| `fromBar` | integer |  | Aralığın ilk ölçüsü (dahil) |
| `toBar` | integer |  | Aralığın son ölçüsü (dahil) |
| `all` | boolean |  |  |

### `copy_bars`

Düzenin bir bölümünü — fromBar..toBar ölçülerinde çalan her şeyi (ikisi de dahil) — başka bir konuma kopyalar, örn. hook'u (9–16. ölçüler) 33. ölçüde yinele. Klipler aralığa kırpılır; uzun klipler yalnızca aralık içindeki kısmı kopyalar. Klipler track'lerini korur.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `fromBar` | integer | evet | Kopyalanacak ilk ölçü |
| `toBar` | integer | evet | Kopyalanacak son ölçü (dahil) |
| `toPosition` | integer | evet | Kopyanın başladığı ölçü |
| `times` | integer |  | Ard arda yerleştirilecek kopya sayısı (varsayılan 1) |

### `update_track`

Bir playlist track'ini yeniden adlandırır, renklendirir veya mute yapar (1 tabanlı).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `track` | integer | evet |  |
| `name` | string |  |  |
| `color` | string |  |  |
| `mute` | boolean |  |  |

### `add_automation`

Playlist'te bir otomasyon klibiyle bir parametreyi zaman içinde otomatikleştirir (song modu). Hedefler: kanal (volume|pan|pitch|filterCutoff|filterRes), mikser insert'i (volume|pan), efekt (otomasyonlanabilir parametre, örn. filter cutoff, reverb mix, delay feedback), master (volume|pan). Nokta değerleri parametre aralığı boyunca 0..1'dir (filterCutoff log ölçeklidir: 0 = 20 Hz, 0.5 ≈ 630 Hz, 1 = 20 kHz; pan 0.5 = orta; pitch 0.5 = kayma yok; volume: 0.8 = unity gain (0 dB), 0.64 = varsayılan insert fader'ı, 0.62 ≈ varsayılan kanal volume'ü, 1 = +1.9 dB).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `name` | string |  |  |
| `target` | { type, channel, insert, effectId, param } | evet |  |
| `points` | { bar, value }[] | evet |  |
| `startBar` | number | evet | Otomasyon klibinin başladığı ölçü (1 tabanlı) |
| `bars` | number |  | Clip uzunluğu, ölçü cinsinden (varsayılan: son noktaya kadar) |
| `track` | integer |  |  |

### `update_automation`

Bir otomasyon eğrisini (points eskilerin yerini alır), uzunluğunu veya adını değiştirir. bars'ı değiştirmek, otomasyonun tam uzunluğundaki playlist kliplerini de yeniden boyutlandırır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `automation` | string | evet | Otomasyon id'si veya adı |
| `name` | string |  |  |
| `points` | { bar, value }[] |  |  |
| `bars` | number |  |  |

### `remove_automation`

Bir otomasyonu ve playlist kliplerini siler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `automation` | string | evet |  |

### `play`

Kullanıcının tarayıcısında çalmayı başlatır. mode "pattern" tek bir pattern'i döngüler; mode "song" playlist düzenini çalar.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `mode` | `pattern` \| `song` |  | Varsayılan: playlist'te klip varsa song, yoksa pattern |
| `pattern` | string |  | Pattern modunda döngülenecek pattern (varsayılan: ilk pattern) |
| `fromBar` | number |  |  |

### `stop`

Tarayıcıda çalmayı durdurur.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |

### `export_midi`

Song'u (veya tek bir pattern'i) .mid dosyası olarak kullanıcının exports'una aktarır. İndirme URL'si döndürür. Audio için render_mix'i save=true ile kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `mode` | `song` \| `pattern` |  |  |
| `pattern` | string |  |  |

### `set_mixer`

Bir mikser insert'ini değiştirir (0 = Master): ad, renk, volume (0..1.25; insert'ler varsayılan 0.8 ≈ -1.9 dB, master 1.0 = 0 dB — master'ı 0 dB'de tut, o master limiter'ın arkasındadır), pan, mute, solo, output yönlendirmesi ve send'ler (örn. paylaşılan bir reverb bus'ına). Henüz var olmayan insert'ler oluşturulur.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | integer | evet |  |
| `name` | string |  |  |
| `color` | string |  |  |
| `volume` | number |  |  |
| `volumeDb` | number |  | volume yerine alternatif, dB cinsinden |
| `pan` | number |  |  |
| `mute` | boolean |  |  |
| `solo` | boolean |  |  |
| `output` | integer |  | Bu insert'i başka bir insert'e yönlendir (varsayılan 0 = master) |
| `sends` | { to, amount }[] |  | Ekstra send'ler (mevcut listenin yerine geçer) |

### `add_effect`

Bir mikser insert'inin zincirine efekt ekler (0 = master; master'da limiter'dan önce yerleştirilir). Türler: eq (high-pass ve low-pass filtreli (12 dB/oktav; hpf 20 Hz / lpf 20 kHz = kapalı) 3 bantlı EQ (low shelf, mid peak, high shelf).); filter (Rezonanslı filtre. Sweep'ler için cutoff'u otomasyonla.); compressor (Dinamik compressor; mix < 1 = parallel (New York) sıkıştırma. Otomatik makeup yok: seviyenin bypass edilmiş sesle eşleşmesi için makeup'ı ayarla.); delay (Tempo-sync'li (ping-pong) delay; tekrarlar high-pass'lidir, böylece alt frekansları asla bulanıklaştırmaz.); reverb (Üretilmiş bir odalı convolution reverb: erken yansımalar (size), tizleri daha hızlı sönen bir decay (damping) ve 120 Hz low cut.); distortion (Waveshaper saturasyon / distortion.); chorus (Stereo modüle-delay chorus.); phaser (4 kademeli all-pass phaser.); bitcrusher (Çıtırdayan lo-fi tonlar için bit derinliği düşürme.); stereo (Stereo genişlik (0 = mono, 1 = normal, 2 = ekstra geniş); monoBelow o frekansın altındaki her şeyi mono tutar (0 = kapalı), böylece geniş bass kulübe ve telefona güvenli kalır.); pump (Volume ducking. source = bir kanal olduğunda (örn. kick) o kanalın her notasında duck yapar — senkoplu kick'leri de izleyen gerçek bir sidechain; o kanal mute'lu olduğunda bile ("ghost" tetik). Kaynaksız tempoya sync'li bir grid'de pompalar (rate).); limiter (Master limiter: input gain onu sürer, ceiling çıkışı sınırlar (oversampled clip kademesi). Master fader'ı ondan sonra 0 dB'de tut; true peak'i render_mix ile kontrol et (streaming ≤ -1 dBTP ister).); plugin (Kullanıcının kurulu plugin'lerinden birinden bir efekt (list_plugins): type "plugin" ve plugin "<id>" ile add_effect; params plugin'den gelir.). Parametreler için list_effects'e bak. Kick tetiklemeli bir sidechain için bass/pad insert'ine params {"source":"Kick"} ile pump koy.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | integer | evet |  |
| `type` | `eq` \| `filter` \| `compressor` \| `delay` \| `reverb` \| `distortion` \| `chorus` \| `phaser` \| `bitcrusher` \| `stereo` \| `pump` \| `limiter` \| `plugin` | evet |  |
| `plugin` | string |  | type "plugin" için: efekt plugin id'si (list_plugins) |
| `preset` | string |  | type "plugin" için: onun preset'lerinden biri |
| `params` | object |  |  |
| `position` | integer |  | Slot indeksi (varsayılan: zincirin sonu) |

### `update_effect`

Bir efektin parametrelerini değiştirir veya bypass eder.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | integer | evet |  |
| `effectId` | string | evet | Efekt id'si, ya da o türden tek efekt varsa efekt türü |
| `params` | object |  |  |
| `enabled` | boolean |  |  |

### `remove_effect`

Bir mikser insert'inden efekt kaldırır (otomasyonları da kaldırılır).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | integer | evet |  |
| `effectId` | string | evet |  |

### `move_effect`

Bir efekti insert zincirinde başka bir slota taşır (0 = ilk). Sıra önemlidir: örn. EQ → compressor → reverb.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | integer | evet |  |
| `effectId` | string | evet |  |
| `position` | integer | evet |  |

### `render_mix`

Song'u (veya bir pattern'i) kullanıcının tarayıcısında render edip bir mastering mühendisinin metreleri gibi analiz eder: integrated loudness (LUFS), loudness range, sample ve true peak, crest factor, clipping, master limiter gain reduction, spektral denge (sub/low/low-mid/mid/high-mid/high), en güçlü alt frekans, stereo genişlik ve alt frekans mono'luluğu, 4 ölçülük bölüm başına loudness ve (stems=true) kanal başına loudness/spektrum/alt frekans notası. target bir teslim standardıyla karşılaştırır ve master limiter'ın input gain'inin tam olarak ne kadar değiştirileceğini söyler. save=true ayrıca WAV'ı (varsayılan 24-bit) kullanıcının exports'una kaydeder. Hedefler: streaming, apple-music, club, hip-hop, edm, lo-fi, broadcast, podcast. Stüdyonun bir tarayıcıda açık olması gerekir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `mode` | `song` \| `pattern` |  | Varsayılan: playlist'te klip varsa song, yoksa pattern |
| `pattern` | string |  | mode=pattern için (varsayılan: ilk pattern) |
| `loops` | integer |  | Pattern modu: kaç döngü render edilecek (varsayılan 2) |
| `stems` | boolean |  | Her kanalı ayrıca kendi başına analiz et (varsayılan true) |
| `target` | `streaming` \| `apple-music` \| `club` \| `hip-hop` \| `edm` \| `lo-fi` \| `broadcast` \| `podcast` |  | Karşılaştırılacak teslim hedefi (varsayılan streaming) |
| `targetLufs` | number |  | Özel integrated loudness hedefi (target'i geçersiz kılar) |
| `save` | boolean |  | Render edilen WAV'ı exports'ta tut (varsayılan false) |
| `bitDepth` | number \| number |  | Kaydederken WAV bit derinliği (varsayılan 24; 16-bit dither edilir) |

### `export_stems`

Çalan her kanalı (ve audio klipleri) kendi WAV'ı olarak kullanıcının exports'una render eder — bir mixing/mastering mühendisinin veya bir işbirlikçinin beklediği teslimat. Her stem kendi kanalını, mikser insert'ini, efektlerini ve send'lerini (örn. reverb'ünü) korur ama masterFx=true olana kadar master bus efektlerini atlar; böylece stem'ler toplandığında pre-master miks çıkar. Stüdyonun bir tarayıcıda açık olması gerekir; uzun song'larda zaman alır (ilerleme raporlanır).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `mode` | `song` \| `pattern` |  | Varsayılan: playlist'te klip varsa song, yoksa pattern |
| `pattern` | string |  | mode=pattern için (varsayılan: ilk pattern) |
| `loops` | integer |  | Pattern modu: render edilecek döngüler (varsayılan 2) |
| `bitDepth` | number \| number |  | Varsayılan 24 |
| `masterFx` | boolean |  | Master bus efektlerini (limiter…) her stem'e bas (varsayılan false) |

### `list_samples`

Kullanıcının yüklediği audio sample'ları, klasöre göre gruplanmış, temel bilgilerle: süre, sample rate, bit derinliği, bitrate, kanallar, codec ve analiz (nasıl bir sese sahip olduğu, pitch, tempo, ton, loudness). Ara ve/veya tek bir klasör seç. Tam ayrıntılar için get_sample_info kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `query` | string |  | Arama kelimeleri; hepsinin ad, klasör, etiketler veya analizle eşleşmesi gerekir (örn. "kick", "vocal 140 bpm", "dark pad A minor") |
| `folder` | string |  | Yalnızca bu klasör (ad veya id); "unfiled" = hiçbir klasörde olmayan sample'lar |

### `get_sample_info`

Yüklenmiş bir sample'ın tam teknik meta verisi (klasör, format/kapsayıcı, codec, lossless, sample rate, sample başına bit, kanallar, bitrate, süre, boyut, title/artist/bpm/key gibi gömülü etiketler) ve audio analizi (LUFS, peak, RMS, crest, clipping, silence, stereo genişlik, spektral denge, onsets, tempo, ton, pitch, one-shot mı loop mu, karakter).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleId` | string | evet |  |

### `analyze_sample`

Bir sample'ı kullanıcının tarayıcısında (yeniden) analiz eder (sunucunun decode edemediği formatlar için gerekir, örn. MP3/M4A/OGG; ya da tazelemek için). Analizi döndürür.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleId` | string | evet |  |

### `rename_sample`

Yüklenmiş bir sample'ı yeniden adlandırır.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleId` | string | evet |  |
| `name` | string | evet | ≤ 80 karakter |

### `sample_folders`

Kullanıcının sample'larını düzenleyen klasörleri listeler, oluşturur, yeniden adlandırır veya siler (her sample tek bir klasördedir ya da Unfiled'dadır). Bir klasörü silmek sample'larını korur: unfiled olurlar. Sample'ları klasörlere yerleştirmek için move_samples kullan.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `action` | `list` \| `create` \| `rename` \| `delete` |  | Varsayılan list |
| `folder` | string |  | create: yeni klasörün adı (≤ 40 karakter, "Unfiled" olamaz); rename/delete: klasör (ad veya id) |
| `newName` | string |  | rename: yeni ad (≤ 40 karakter) |

### `move_samples`

Sample'ları bir klasöre yerleştirir (ad veya id ile; yeni adla bir klasör oluşturulur). "unfiled" onları klasörlerinden çıkarır. Her sample aynı anda tek bir klasördedir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleIds` | string[] | evet |  |
| `folder` | string | evet | Klasör adı veya id (≤ 40 karakter), ya da "unfiled" |

### `delete_sample`

Yüklenmiş sample'ları kalıcı olarak siler. Yalnızca kullanıcı açıkça istediğinde. Onları kullanan sampler kanalları ve audio klipler sessiz kalır — yanıt hangi projelerin etkilendiğini söyler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleId` | string |  |  |
| `sampleIds` | string[] |  | Birden fazla tek seferde (sampleId yerine) |

### `edit_sample`

Yüklenmiş bir sample'ı stüdyonun wave editor'ü gibi düzenler (kullanıcının tarayıcısında çalışır) ve sonucu YENİ bir sample olarak (varsayılan, özgün kalır) ya da özgünün üzerine kaydeder. İşlemler sırayla çalışır; start/end saniye cinsindendir (ikisini de verme → tüm sample): trim: yalnızca start..end'i koru; delete: start..end'i kaldır ve boşluğu kapat; silence: start..end'i sustur; fade_in: start'tan end'e fade in (yalnızca end verilirse uzunluğu baştan itibaren ayarlar; end'siz: 10 ms); curve linear|exp|log|scurve; fade_out: start'tan end'e fade out (yalnızca start verilirse sona doğru fade out; start'sız: son 10 ms); curve; gain: start..end'in seviyesini db kadar değiştir; normalize: start..end'i peak'i peakDb olacak şekilde ölçekle (varsayılan -1 dBFS); reverse: start..end'i tersten çal; invert: polariteyi çevir; mono: mono'ya karıştır; stereo: mono bir sample'ı iki kanallı yap; remove_dc: DC offset'i / 10 Hz altındaki rumble'ı kaldır; trim_silence: her iki uçtan sessizliği kes (thresholdDb altı, varsayılan -50); speed: hız ve pitch'i birlikte rate 0.25-4 ile değiştir (turntable tarzı); stretch: pitch'i koruyarak uzunluğu rate 0.25-4 ile değiştir (2 = iki kat hızlı); pitch_shift: uzunluğu koruyarak pitch'i yarım ton kaydır (ses ve solo çalgılarda en iyisi); pitch_correct: auto-tune: melodiyi ton/diziye oturt (amount 0-1, speed ms cinsinden, flatten 0-1); start..end ile o aralığa değen notalar. pitch_correct, solo bir ses veya çalgı için auto-tune'dur: key + scale (varsayılan C chromatic), amount 0-1 (1), speed ms (50; 0 = robotik), flatten 0-1 (0). saveAs "replace" sample'ı kullanan her projeyi değiştirir: yalnızca kullanıcı isterse.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sampleId` | string | evet |  |
| `ops` | { op, start, end, db, peakDb, curve, rate, semitones, thresholdDb, key, scale, amount, speed, flatten }[] | evet |  |
| `saveAs` | `new` \| `replace` |  | new (varsayılan) ya da özgünün üzerine yaz |
| `name` | string |  | Yeni sample'ın adı, ≤ 80 karakter (varsayılan "<original> edit") |
| `folder` | string |  | Yeni sample için klasör: ad veya id, ya da "unfiled" (varsayılan: özgünün klasörü) |

### `add_audio_clip`

Yüklenmiş bir sample'ı (loop, vocal, fx, tam kayıt) doğrudan playlist'e audio klip olarak yerleştirir; isteğe bağlı gain ve fade'lerle. fit="repitch", bir loop'u hızını değiştirerek proje temposunda çalar (pitch de değişir, pikap gibi — boom bap / lo-fi için klasik); aksi halde audio time-stretch edilmez, o yüzden proje BPM'ini loop'a uydur (get_sample_info temposunu gösterir).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `sampleId` | string | evet |  |
| `startBar` | number | evet |  |
| `track` | integer |  |  |
| `bars` | number |  | Clip uzunluğu, ölçü cinsinden (varsayılan: proje temposunda sample uzunluğu) |
| `repeat` | integer |  | Ardışık kopyalar (varsayılan 1) |
| `gainDb` | number |  | Klip gain'i dB cinsinden (varsayılan 0) |
| `fadeInSteps` | number |  | Fade-in uzunluğu, step (16'lık) cinsinden |
| `fadeOutSteps` | number |  | Fade-out uzunluğu, step cinsinden |
| `fit` | `none` \| `repitch` |  | repitch = loop'u proje temposuna hızlandır (tespit edilmiş ya da verilen bir sampleBpm gerekir) |
| `sampleBpm` | number |  | fit=repitch olduğunda loop'un temposu (varsayılan: tespit edilen) |

### `add_transition`

Tek çağrıyla bir bölüme veya bölümden çıkışa bir geçiş kurar: riser (bölüme doğru filtre + volume sweep'li bir noise riser); downlifter (vuruştan dışa düşen bir noise sweep'i); reverse_swell (downbeat'e çekilen ters tarzda bir akor swell'i); snare_build (hızlanan, yükselen bir snare roll'u (8'likler → 16'lıklar → 32'likler)); crash (downbeat'te crash zil); sub_drop (downbeat'te 808 sub drop (pitch dalışı)); impact (crash + sub drop birlikte: klasik drop etkisi). atBar, yeni bölümün (downbeat'in) başladığı 1 tabanlı ölçüdür: riser'lar/swell'ler/build'ler tam orada biter, vuruşlar ona denk gelir. Sesin kanalını, bir pattern'i ve "Transitions" track'indeki playlist klibini oluşturur (ya da yeniden kullanır); sweep'ler için ayrıca filter/volume otomasyonu. Tipik: drop'a riser 4–8 ölçü + impact; bir hook'a snare_build 2 ölçü; bir verse'e reverse_swell 1 ölçü; drop'tan sonra downlifter.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `type` | `riser` \| `downlifter` \| `reverse_swell` \| `snare_build` \| `crash` \| `sub_drop` \| `impact` | evet |  |
| `atBar` | integer | evet | Bölümün başladığı / vuruşun indiği ölçü |
| `bars` | number |  | Sweep/swell/build uzunluğu (varsayılan: riser 4, downlifter 2, snare_build 2, reverse_swell 1) |
| `track` | integer |  | Playlist track'i (1 tabanlı; varsayılan: "Transitions" adlı bir track) |

### `add_fill`

Bir davul pattern'inin fill sürümünü yapar: pattern'i kopyalar (veya yerinde düzenler) ve son vuruşlarını yeniden yazar. Stiller: snare_roll (16'lıklardan 32'liklere, crescendo), tom_run (inen tom'lar; gerekirse bir tom kanalı oluşturur), hat_roll (trap triplet/32'lik hat roll'ları), stutter (kick+snare tekrarlayan 16'lıklar), dropout (kick, bass ve snare'ler düşer — drop'tan önceki boşluk), kick_build (8'liklerde sonra 16'lıklarda EDM kick). Fill pattern'ini, ana pattern'in yerine bir bölümün son ölçüsüne koy (örn. her 4. veya 8. ölçü).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `pattern` | string | evet | Fill yapılacak davul pattern'i |
| `style` | `snare_roll` \| `tom_run` \| `hat_roll` \| `stutter` \| `dropout` \| `kick_build` | evet |  |
| `beats` | number |  | Sonda kaç vuruş (varsayılan 1; tom_run ve kick_build için 2) |
| `name` | string |  | Yeni pattern'in adı (varsayılan "<pattern> Fill") |
| `inPlace` | boolean |  | Kopya yerine pattern'in kendisini yeniden yaz (varsayılan false) |

### `apply_groove`

Tek çağrıyla beat'e insansı bir his verir: proje swing'ini, rol bazında her kanalın nudge'ını (ms erken/geç) ve swing payını ayarlar (kick, snare/clap, hat'lar, percussion, bass, diğer); hi-hat velocity'lerini vuruş başına bir vurgu deseniyle şekillendirir ve hafif bir humanizing ekler (davul vuruşlarında timing, vurgulu kısımlarda velocity). Preset'ler: straight (quantize edilmiş, swingsiz); boom-bap (swing'li 16'lıklar, tembel snare (90'lar hip-hop)); dilla (sarhoş, ritmin arkasında (Dilla / neo-soul)); lo-fi (ağır swing, her şey rahat (lo-fi / chillhop)); trap (düz, vurgulu ve itilmiş hat'lar (trap)); drill (düz, sıkı, sert vurgular (UK/NY drill)); house (hafif 16'lık swing, off-beat hat yükselişi (house)); afrobeats (yuvarlanan swing, önde percussion (afrobeats / amapiano)). amount tüm etkiyi ölçekler (0..1). Yeniden çalıştırmak temiz biçimde yeniden uygular (vurgular, velocity ve timing üst üste binmez; triplet'ler ve roll'lar dokunulmadan bırakılır); "straight" yeniden quantize eder.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `preset` | `straight` \| `boom-bap` \| `dilla` \| `lo-fi` \| `trap` \| `drill` \| `house` \| `afrobeats` | evet |  |
| `amount` | number |  | Güç (varsayılan 1) |
| `patterns` | string[] |  | Notaları vurgu/humanizing alacak pattern'ler (varsayılan: tümü). Swing ve nudge'lar kanal başınadır ve her yerde uygulanır. |
| `humanize` | boolean |  | Timing/velocity çeşitlemesi ekle (varsayılan true) |
| `ghostNotes` | boolean |  | Snare'in sessiz olduğu klasik off-beat 16'lıklarda ayrıca hafif ghost snare'lar ekle (varsayılan false) |

### `list_export_formats`

Bu sunucunun şu anda hangi audio formatlarına dışa aktarabildiği: WAV her zaman; MP3, AAC (.m4a), Ogg Vorbis, Opus, FLAC, Apple Lossless ve AIFF sunucuda ffmpeg kuruluysa. ffmpeg sürümünü, her lossy formatın bitrate'lerini ve bir formatın neden kullanılamadığını gösterir. Kullanıcı belirli bir format istediğinde export_audio'dan önce çağır.

### `export_audio`

Song'u (veya bir pattern'i) kullanıcının tarayıcısında render edip istenen formatta kullanıcının exports'una kaydeder: wav (doğrudan render edilir) veya mp3/aac/ogg/opus/flac/alac/aiff (sunucuda ffmpeg'le bir 24-bit render'dan dönüştürülür — önce list_export_formats'a bak). Dosyayı title/artist/album meta verisiyle etiketler. İndirme URL'sini döndürür. Masterlanmış bir çıktı için önce loudness'ı render_mix ile kontrol et. Stüdyonun bir tarayıcıda açık olması gerekir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `format` | `wav` \| `mp3` \| `aac` \| `ogg` \| `opus` \| `flac` \| `alac` \| `aiff` | evet | wav, mp3, aac, ogg, opus, flac, alac veya aiff |
| `mode` | `song` \| `pattern` |  | Varsayılan: playlist'te klip varsa song, yoksa pattern |
| `pattern` | string |  | mode=pattern için (varsayılan: ilk pattern) |
| `loops` | integer |  | Pattern modu: render edilecek döngüler (varsayılan 2) |
| `bitrate` | integer |  | Lossy formatlar: kbps (list_export_formats'a bak; varsayılan 320 MP3, 256 AAC, 192 Ogg, 160 Opus) |
| `bitDepth` | number \| number |  | WAV/FLAC/ALAC/AIFF bit derinliği (varsayılan 24; 16-bit dither edilir) |
| `title` | string |  | Meta veri başlığı (varsayılan: proje adı) |
| `artist` | string |  | Meta veri sanatçısı (varsayılan: kullanıcının görünen adı) |
| `album` | string |  |  |
| `genre` | string |  |  |
| `keepWav` | boolean |  | Ara WAV'ı da exports'ta tut (varsayılan false) |

### `set_spatial`

Spatial (Dolby Atmos tarzı 3D) miksajı açıp kapatır ve stüdyonun onu nasıl izleyeceğini seçer: "binaural" her 3D objeyi kulaklık için head-related filtrelerden geçirerek render eder, "stereo" objeleri sol/sağ konumlarına göre normal stereo miksajın içine katlar. Mikser insert'leri place_object ile 3D obje olur; geri kalan her şey stereo bed'de kalır. Objeleri listeler.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `enabled` | boolean |  |  |
| `monitor` | `stereo` \| `binaural` |  | Kullanıcının stüdyoda duyduğu (export'lar kendi formatlarını seçer) |

### `place_object`

Bir mikser insert'ini (insert numarası/adı veya bir kanal adıyla — onun insert'i) 3D obje yapıp odanın bir yerine koy: adlandırılmış bir nokta ("front-left", "rear-right", "overhead"…), x/y/z (Atmos Kartezyen: x -1 sol…1 sağ, y -1 arka…1 ön, z 0 kulak yüksekliği…1 tavan) veya azimuth/elevation/distance. lfe, speaker render'larda bir kısmını subwoofer kanalına gönderir. Spatial miksajı açar. Insert doğrudan master'a yönlendirilmelidir (bir bus'a değil). enabled=false onu stereo bed'e geri döndürür. Tipik: lead vocal/lead synth önde orta, pad'ler geniş veya overhead, percussion ve FX çevrede veya arkada, bass ve kick bed'de.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | string \| integer | evet | Mikser insert numarası veya adı, ya da bir kanal adı |
| `enabled` | boolean |  | Varsayılan true |
| `position` | `center` \| `front` \| `front-left` \| `front-right` \| `wide-left` \| `wide-right` \| `left` \| `right` \| `rear-left` \| `rear-right` \| `rear` \| `overhead` \| `top-front-left` \| `top-front-right` \| `top-front` \| `top-rear-left` \| `top-rear-right` \| `top-rear` \| `room` |  | Adlandırılmış nokta: center, front, front-left, front-right, wide-left, wide-right, left, right, rear-left, rear-right, rear, overhead, top-front-left, top-front-right, top-front, top-rear-left, top-rear-right, top-rear, room |
| `x` | number |  | -1 sol duvar … 0 orta … 1 sağ duvar |
| `y` | number |  | -1 arka duvar … 0 dinleyici … 1 ön duvar (ekran) |
| `z` | number |  | 0 kulak yüksekliği … 1 tavan |
| `azimuth` | number |  | Kutupsal alternatif: önden saat yönünde derece (90 = sağ, -90 = sol, 180 = arka) |
| `elevation` | number |  | Kutupsal: 0 kulak yüksekliği … 90 dik yukarı |
| `distance` | number |  | Kutupsal: 0 dinleyicide … 1 duvarlarda (varsayılan 1) |
| `lfe` | number |  | Speaker render'lar için LFE (subwoofer) send'i, 0..1 (varsayılan 0) |

### `move_object`

Bir 3D objeyi playlist'teki konum otomasyon klipleriyle (mikser insert'inin spatialX/spatialY/spatialZ'si) canlandırır: "circle" (dinleyicinin çevresinde yörünge; turns, radius, clockwise), "left-right"/"right-left" (önden pan), "front-back"/"back-front" (odanın içinden uçuş), "rise"/"fall" (yükseklik), "fly-over" (ön taraftan dinleyicinin başının üzerinden arkaya) veya "points" (kendi keyframe'lerin). Song modunda çalar. Objenin durduğu konum path'in başlangıcı olur; klip bittikten sonra path'in bittiği yerde kalır. Path'ler: circle, left-right, right-left, front-back, back-front, rise, fall, fly-over, points.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `insert` | string \| integer | evet | Mikser insert numarası veya adı, ya da bir kanal adı |
| `path` | `circle` \| `left-right` \| `right-left` \| `front-back` \| `back-front` \| `rise` \| `fall` \| `fly-over` \| `points` | evet |  |
| `startBar` | number | evet | Hareketin başladığı ölçü (1 tabanlı) |
| `bars` | number | evet | Süre, ölçü cinsinden |
| `turns` | number |  | circle: devir sayısı (varsayılan 1) |
| `radius` | number |  | circle: dinleyiciden uzaklık (varsayılan 1 = duvarlar) |
| `height` | number |  | circle/left-right/front-back: hareket sırasında z (varsayılan: mevcut z'si) |
| `clockwise` | boolean |  | Yukarıdan bakınca circle yönü (varsayılan true) |
| `points` | { bar, position, x, y, z }[] |  | path=points: keyframe'ler (aradaki konumlar doğrusal kayar) |

### `export_spatial`

3D miksajı kullanıcının tarayıcısında (48 kHz, 24-bit) render edip kullanıcının exports'una koyar: "binaural" = her objeyi kulaklıkta dinleyicinin çevresine yerleştiren bir stereo WAV (HRTF); "5.1" = 6 kanallı WAV: L R C LFE Ls Rs; "7.1" = 8 kanallı WAV: L R C LFE Lrs Rrs Lss Rss; "7.1.4" = 12 kanallı WAV: 7.1 + dört height speaker; "objects" = stereo bed ve obje başına bir mono WAV; ayrıca her objenin zamandaki konumunu içeren bir JSON dosyası; "adm" = bed'i ve her objeyi track olarak içeren, Atmos uyumlu araçlar için ITU-R BS.2076 (ADM) konum meta verisi (axml/chna) taşıyan tek WAV — deneysel, Dolby sertifikalı değil. Stüdyo stereo izlerken bile objeler 3D render edilir. En az bir 3D obje gerekir (place_object); object stem'leri/ADM en fazla 30 obje alır. Master bus efektleri bed'e (ve binaural miksaja) uygulanır ama speaker/object render'larda objelere uygulanmaz; bir Atmos renderer'daki gibi — peak'leri rapordan kontrol et. Stüdyonun bir tarayıcıda açık olması gerekir.

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `format` | `binaural` \| `5.1` \| `7.1` \| `7.1.4` \| `objects` \| `adm` | evet |  |
| `mode` | `song` \| `pattern` |  | Varsayılan: playlist'te klip varsa song, yoksa pattern |
| `pattern` | string |  |  |
| `loops` | integer |  |  |

### `list_plugins`

Kullanıcının kurduğu çalgı, efekt ve generator plugin'leri (Ayarlar → Pluginler), parametre ve preset'leriyle. Kullanım: add_channel instrument="plugin" plugin="<id>"; add_effect type="plugin" plugin="<id>"; run_generator plugin="<id>". Plugin'ler kullanıcının tarayıcısında sandbox'lı çalışır.

### `run_generator`

Kullanıcının generator plugin'lerinden biriyle (list_plugins) bir pattern/kanala nota üretir. Plugin kullanıcının tarayıcısında, sandbox'lı (ağ yok, süre sınırlı) çalışır; çıktısı yazılmadan önce kontrol edilir ve sınırlandırılır. Projenin ton/dizi/tempo'sunu, hedef kanalı ve onun params'ını alır (plugin'in project-read'i varsa pattern'in notalarını da).

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `projectId` | string |  | Proje id'si. Varsayılan: etkin proje (tarayıcıda açık olan). |
| `plugin` | string | evet | Generator plugin id'si veya adı |
| `pattern` | string | evet |  |
| `channel` | string | evet |  |
| `params` | object |  |  |
| `preset` | string |  |  |
| `bars` | number |  | Kaç ölçü üretilecek (varsayılan: start'tan pattern sonuna kadar) |
| `start` | number |  | Pattern içinde başlangıç step'i (varsayılan 0) |
| `replace` | boolean |  | Önce o aralıktaki kanalın mevcut notalarını kaldır (varsayılan true) |
| `seed` | integer |  | Rastgele seed (aynı seed + params = aynı notalar) |

## Prompt'lar

- `make_beat` — Claude'un Melovra'de tam, düzenlenmiş ve mikslenmiş bir parça üretmesini sağlar (args: genre, mood, bpm, reference)
- `mix_review` — Claude'un mevcut miksajı render_mix ile analiz edip bir mixing mühendisi gibi iyileştirmesini sağlar (args: target)
- `spatial_mix` — Claude'un mevcut song'u sürükleyici bir 3D miksaja dönüştürüp kulaklık ve speaker'lar için dışa aktarmasını sağlar (args: deliver)
- `use_my_samples` — Claude'un kullanıcının yüklediği sample'ları inceleyip (bitrate, tempo, ton, pitch) etraflarında bir parça kurmasını sağlar (args: idea)

## Kaynaklar

- `melovra://guide` — Araçların kullandığı kavramlar, zaman birimleri ve gösterim
- `melovra://project/active` — Şu anda açık olan projenin özeti
