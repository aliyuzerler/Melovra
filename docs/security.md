# Güvenlik

Melovra, varsayılan olarak kendi bilgisayarınızda güvenli kalacak, küçük bir ekip için bir sunucuya konabilecek kadar da sağlamlaştırılmış biçimde tasarlanmıştır. Bu sayfa güvenlik modelini ve sunucuyu dışarıya açarken izlenecek kontrol listesini açıklar.

## Hesaplar ve veriler

- Kullanıcıların bir kullanıcı adı, görünen ad, rolü (`admin` / `user`) ve isteğe bağlı kişisel bir API token'ı vardır.
- Her proje, sürüm, sample ve dışa aktarma tam olarak bir kullanıcıya aittir. Tüm rotalar ve socket mesajları veriyi sahibine göre arar ve size ait olmayan her şey için **404** döndürür.
- İlk hesap, ilk ziyarette oluşturulur (**setup**). İstek doğrudan sunucunun kendi bilgisayarından gelmiyorsa, setup ayrıca sunucu günlüğünde yazılı olan bir **setup code** ister (`SETUP_CODE` ile de ayarlanabilir); böylece yeni kurulmuş veya proxy arkasına alınmış bir sunucu yabancı birinin eline geçemez. Aynı anda gelen setup istekleri iki admin oluşturamaz.
- Adminler kullanıcı oluşturabilir, kaydı açabilir, rolleri değiştirebilir, hesapları devre dışı bırakabilir, parolaları sıfırlayabilir ve kullanıcıları verileriyle birlikte silebilir. Etkin durumdaki son adminin rolü düşürülemez, hesabı devre dışı bırakılamaz ve silinemez.

## Parolalar, oturumlar, token'lar

| Gizli bilgi | Saklama | Notlar |
|--------|---------|-------|
| Parolalar | scrypt (N=16384, r=8, p=1, 16-byte salt) | sabit zamanlı karşılaştırma; bilinmeyen kullanıcılar için de hash hesaplanır (timing oracle yok) |
| Oturum id'leri | 256 bitlik rastgele bir id'nin SHA-256'sı | `gtd_session` çerezi: HttpOnly, SameSite=Lax, HTTPS'te Secure; kayan süre sonu (`SESSION_TTL_DAYS`); kullanıcı başına en fazla 20 |
| API token'ları | `gtd_<prefix>_<secret>`'in SHA-256'sı (192 bit) | yalnızca bir kez gösterilir; yeniden üretme/silme, eski token'ı kullanan socket'leri kapatır |

- Parolanızı değiştirmek diğer oturumlarınızı kapatır; bir kullanıcıyı devre dışı bırakmak veya silmek onun tüm oturumlarını ve socket'lerini sonlandırır.
- API token'ları kendi kullanıcısı gibi davranır ama **asla** admin uçlarını kullanamaz, parola değiştiremez veya token yönetemez (oturum açmış bir tarayıcı oturumu gerekir).
- Unutulan admin parolası: `npm run reset-password -- <username>` (sunucu durdurulmuş olmalı).

## MCP erişimi

- Token ile (`Authorization: Bearer` veya `?token=`): token'ın sahibi kullanıcı gibi davranır.
- Token olmadan: yalnızca bir admin *Bu bilgisayardan token'sız MCP'ye izin ver* seçeneğini açmışsa (loopback kurulumlarında varsayılan olarak açıktır) ve yalnızca bu makineden gelen, localhost bir adına yönelik istekler için (loopback adresi; X-Forwarded-For / X-Real-IP / Via gibi proxy başlıkları yok). `TRUST_PROXY` veya yerel olmayan bir `PUBLIC_URL` yapılandırıldığında her zaman kapalıdır (aynı makinedeki bir proxy her ziyaretçiyi yerel gibi gösterebilir). Bu, LAN istemcilerini, proxy arkasından gelen ziyaretçileri ve DNS-rebinding sayfalarını engeller. Bu tür istekler yapılandırılmış varsayılan kullanıcı gibi davranır.
- **Ters proxy'ler:** sunucu bir proxy'yi yalnızca başlıklarından tanıyabilir. İstekleri `X-Forwarded-For`/`X-Real-IP`/`Via` *olmadan* ileten ve `Host` başlığını `127.0.0.1` olarak yeniden yazan aynı makinedeki bir proxy (örneğin `proxy_set_header` satırları olmayan çıplak bir nginx `proxy_pass`), her ziyaretçiyi yerel gibi gösterir. Önünüzde bir proxy varken `PUBLIC_URL` (ve `TRUST_PROXY`) ayarlayın — her ikisinden biri "yerel" muamelesini tamamen kapatır — veya Ayarlar → Sunucu'dan token'sız MCP'yi kapatın.
- `MCP_TOKEN` (eski paylaşımlı token) ilk admin gibi davranır ve token'sız erişimi devre dışı bırakır.

## Web sertleştirmesi

- **CSRF**: `Origin` başlığı taşıyan, durumu değiştiren istekler `Host` ile (veya `PUBLIC_URL` ile) eşleşmelidir; WebSocket yükseltmeleri de aynı şekilde denetlenir. Çerezler SameSite=Lax olarak gönderilir.
- **DNS rebinding**: `Host` başlığı beyaz listesi (`ALLOWED_HOSTS`, loopback'te varsayılan olarak localhost adları).
- **Başlıklar**: Content-Security-Policy (`script-src 'self'` — `eval` yok; studio bir frame içine alınamaz, yalnızca kendi generator sandbox'ını frame'e alabilir), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin`, HTTPS'te HSTS ve `Permissions-Policy` (mikrofon yalnızca studio sayfasının kendisi için — recorder —; kamera, konum, ödeme, USB, serial ve HID kimse için yok). Sample dosyaları bir sandbox CSP'siyle ve doğrulanmış uzantıdan türetilen bir content type ile sunulur.
- **Mikrofon**: yalnızca kullanıcı recorder'da *Mikrofonu etkinleştir*'e tıkladıktan sonra (tarayıcı da ayrıca sorar), yalnızca güvenli bir sayfada (HTTPS veya localhost), recorder kapanınca serbest bırakılır. Kayıtlar sıradan yüklemelere dönüşür (`MAX_UPLOAD_MB`).
- **Sample kütüphanesi**: klasör işlemleri, taşımalar, toplu silmeler ve kullanım sorguları önce her id'nin sahipliğini kontrol eder (size ait olmayan için 404, hiçbir şey değişmez); "Replace original" sample id'sini korur ve yalnızca bir yüklemeyle kabul edilen ses formatlarını kabul eder; Claude'un `edit_sample` aracı kullanıcının kendi tarayıcısında çalışır ve aynı yükleme uçlarından kaydeder.
- **Hız sınırları**: giriş, kullanıcı adı+IP başına (10/15 dk), kullanıcı adı başına (100/15 dk) ve IP başına (50/15 dk); kayıt olma IP başına; parola değişiklikleri kullanıcı başına; setup-code denemeleri IP başına. Denemeler parola kontrolünden önce sayılır, böylece paralel saldırı dalgaları sızamaz. Hız sınırlayıcının bellek kullanımı sınırlıdır. Proxy arkasında sınırların gerçek istemci IP'lerini görmesi için `TRUST_PROXY` ayarlayın — ve istemcilerin proxy'yi atlayarak sunucuya ulaşmasına izin vermeyin.
- **Sınırlar**: hesap uçları için 64 KB JSON, diğer API çağrıları için 1 MB, proje düzenlemeleri/içe aktarmaları için 20 MB (yalnızca kimlik doğrulamasından sonra ayrıştırılır), sample'lar için `MAX_UPLOAD_MB`, render edilen ses için 4 GB (diske akıtılır — WAV formatının kendi sınırı; uzun 7.1.4/ADM render'ları büyür), batch başına 5000 op, kanal ve pattern başına 8192 nota, tarayıcının gönderdiği analiz için 64 KB, WebSocket frame'leri için 16 MB. Bozuk socket mesajları yok sayılır ve protokol hataları yalnızca suçlu socket'i kapatır.
- **Hatalar** asla stack trace içermez; beklenmeyen hatalar sunucu tarafında günlüğe yazılır.
- Yüklemelerin WAV analizi, bellek sınırıyla, bir kerede bir tane olmak üzere worker thread'de çalışır ve en fazla ilk 3 dakikayı tarar.
- **ffmpeg** (isteğe bağlı; MP3/AAC/Ogg/Opus/FLAC/ALAC/AIFF dışa aktarmaları için) yalnızca kullanıcının dışa aktarma klasöründeki PCM/float WAV'ları dönüştürür (adlar doğrulanır, gizli/geçici dosya yok, sahiplik her dışa aktarmada olduğu gibi uygulanır; içinde başka codec bulunan WAV'lar reddedilir). Shell olmadan, argüman dizisiyle çalıştırılır; girdi ve çıktı `-protocol_whitelist file` ile `file:` yollarıdır, zorlanmış bir girdi formatı ve eşleşen PCM decoder kullanılır (`-f wav -c:a pcm_s24le`: probing yok; böylece kullanıcı verisi üzerinde playlist, ağ protokolü veya sıkıştırılmış ses decoder'ı çalışmaz), kanal sayıları formata göre kontrol edilir, meta veri bilinen etiketlere indirgenir, tek satır ve uzunluk sınırlı tutulur, çıktı adı üretilir ve rezerve edilir (asla üzerine yazmaz), ortam sırlardan arındırılır (yalnızca `PATH`/locale/temp değişkenleri), her çalıştırmanın zaman aşımı vardır (`FFMPEG_TIMEOUT_SEC`), aynı anda en fazla `FFMPEG_MAX_JOBS` iş çalışır ve her kullanıcının en fazla 3 dönüştürmesi aynı anda çalışabilir veya bekleyebilir. İkili dosya yalnızca `FFMPEG_PATH`'ten veya `PATH`'ten gelir — asla bir istekten değil.

## Plugin'ler

Kullanıcılar kendi enstrüman, efekt ve generator plugin'lerini yükleyebilir ([plugins.md](plugins.md)). Plugin kodu güvenilmezdir; bu yüzden tasarım şudur: **kararı kullanıcı verir, sunucu kodu asla çalıştırmaz, tarayıcı kodu çalınacak hiçbir şeyin olmadığı ortamlarda çalıştırır ve üretilen her şey veri sayılır.**

**Yükleme**
- Yalnızca oturum açmış studio'dan (`requireSession`): API token'ları — Claude, betikler — 403 alır. İki adım vardır: `inspect` yüklemeyi doğrular ve iletişim kutusunun gösterdiği bilgileri döndürür (izinler, yazar, dosyalar, SHA-256); `install` bu tek kullanımlık token'ı **ve** `trust: true` değerini ister; studio bunu yalnızca kullanıcı bir uyarının altındaki *Güveniyorum … ve yüklemek istiyorum* kutucuğunu işaretledikten sonra gönderir. Bekleyen yüklemeler 15 dakika sonra sona erer; kullanıcı başına en fazla 3, sunucu genelinde 192 MB tutulur (en eskisi önce atılır) ve sunucu genelinde aynı anda en fazla 4 plugin yüklemesi alınır ve denetlenir (diğerleri 429 alır).
- Adminler plugin'leri herkes için kapatabilir (`allowPlugins`); `PLUGINS_ENABLED=false` bunları sunucu genelinde kapatır; açık studio'lar her iki durumda da yeniden yüklenmeleri için bilgilendirilir. Plugin'ler kullanıcı başına saklanır (`DATA_DIR/plugins/<userId>/installed/<id>/`, registry dosyası o klasörün yanındadır), diğer kullanıcılar tarafından asla görülemez (404) ve kullanıcıyla birlikte silinir.

**Doğrulama** (sunucu, herhangi bir şey saklanmadan önce)
- Bu amaçla yazılmış bir zip okuyucu: mutlak yol, `..`, ters eğik çizgi, sürücü harfi, boş segment, symlink, şifreleme, ZIP64 veya hem dosya hem klasör olan adlar yok (gizli dosyalar ve `__MACOSX/` atlanır, asla açılmaz); ≤ 256 kayıt, dosya başına 30 MB, toplamda 60 MB, 1 MB'ı aşan dosyalar için sıkıştırma oranı ≤ 200 (zip bombaları açılırken durur, sonradan değil), CRC-32 ve boyutlar doğrulanır. Yüklemeler ≤ 20 MB.
- Manifest şeması (core'da `validateManifest`): id/version/type, parametre aralıkları, preset'ler, sample bölgeleri ve **izinler** — yalnızca `audio-processing`, `samples`, `generator`, `project-read`; her biri yalnızca ihtiyaç duyan tipler için; `network`, `storage`, `files`, `account` ve benzerleri adlarıyla reddedilir.
- Yalnızca `.json .js .wav .mp3 .ogg .flac .md .txt .png` dosyaları; manifest'in `main` alanı izin verilen tek betiktir; kod ≤ 512 KB ve `import` veya `importScripts` içermez (her sunuluşunda yeniden kontrol edilir); sample'lar gerçek ses olmalıdır (magic bytes). Yüklemeler geçici bir klasöre yazılır ve kullanıcı başına bir kilit altında yer adına yeniden adlandırılır.

**Çalıştırma** — sunucu plugin kodunu asla çalıştırmaz
- **DSP** (enstrümanlar, efektler) yalnızca sahibine ve yalnızca `GET /api/plugins/:id/worklet.js` olarak sunulur: kod, `AudioWorkletGlobalScope` içinde değerlendirilmediği sürece hata fırlatan üretilmiş bir harness içine sarılır. Plugin donmuş bir `gtd` nesnesi alır ve işlemci-kayıt API'sini gölgeleyen bir fonksiyon kapsamında çalışır (hatalara karşı bir koruma — asıl sınır ses thread'inin kendisidir, bkz. *Kalan riskler*). Ses thread'inde ağ, DOM, çerez, depolama veya zamanlayıcı yoktur ve studio'nun CSP'sini miras alır (`eval`/`Function` yok, dinamik `import` yok). Çıktısı temizlenir (NaN/∞ → 0, ±8'e sabitlenir); hata fırlatan bir efekt bypass edilir, hata fırlatan bir voice sonlanır; voice'lar note-off'tan en fazla 10 s sonra sonlanır ve her kanal manifest'in polyphony değeriyle sınırlıdır. İşlemci adları paket hash'ini içerir, böylece bir güncelleme asla eski kodu yeniden kullanmaz.
- **Generator'lar** `text/plain` olarak sunulur (`CSP: sandbox` ile), asla studio'nun origin'ine ait bir betik olarak değil. Studio kodu ve çalıştırmanın girdisini `/sandbox/generator.html` sayfasına gönderir; bu sayfa `sandbox="allow-scripts"` özniteliğine sahip bir iframe'dir (opak bir origin: çerez, depolama veya same-origin API erişimi yok) ve kendi CSP'si vardır (`default-src 'none'`, `connect-src 'none'`, betikler yalnızca kendisinden ve `blob:`'dan). Orada her çalıştırma, `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts`, `indexedDB`, `navigator` vb. kaldırılmış taze bir Worker alır ve 2 s sonra sonlandırılır. Sandbox sayfası yalnızca ebeveynine yanıt verir; studio yalnızca kendi frame'inden gelen yanıtları kabul eder.
- **Çıktı veridir:** üretilen notalar op'lara dönüşmeden önce `cleanGeneratedNotes`'tan geçer (şekil, aralıklar, ≤ 4096 nota, istenen aralık içinde); parametre değerleri manifest'e göre doğrulanır (Claude için katı biçimde); manifest metni uzunluk sınırlıdır, kontrol karakterlerinden arındırılır ve her zaman yalnızca metin olarak gösterilir; `homepage` `https://` olmalıdır ve bağlantı yapılmaz; `color` `#rrggbb` olmalıdır.

**Kalan riskler** (güven uyarısının var olma nedeni): bir plugin her türlü sesi çıkarabilir — çok yüksek veya sessiz sesler dahil — çalarken CPU tüketebilir ya da açıklamasından farklı davranabilir. DSP plugin'ler bir studio sekmesinin ses thread'ini studio'nun kendi ses koduyla ve diğer plugin'lerle paylaşır; bu yüzden kötü niyetli bir plugin o thread'deki sesi bozabilir; yine de kullanıcının verilerini okuyamaz veya hiçbir yere hiçbir şey gönderemez. Yalnızca yazarına güvendiğiniz plugin'leri yükleyin; kullanıcılarınızın hiçbir plugin yüklemesini istemiyorsanız Ayarlar → Sunucu'dan plugin'leri kapatın.

## Herkese açık bir sunucu için kontrol listesi

1. Sunucuyu HTTPS arkasına koyun (Caddy, nginx, Traefik, Cloudflare Tunnel…) ve `TRUST_PROXY` değerini proxy sayısına ayarlayın.
2. `PUBLIC_URL=https://your.domain` ve `ALLOWED_HOSTS=your.domain` ayarlayın — proxy arkasında **zorunludur**, yukarıdaki *Ters proxy'ler* bölümüne bakın.
3. `HOST=0.0.0.0` değerini yalnızca bir konteyner içindeyken veya bir güvenlik duvarı arkasındayken kullanın; ilk başlatmada günlükte yazan setup code'u not edin.
4. Herkese açık kayıt istemiyorsanız Ayarlar → Sunucu'da **Açık kayıt** seçeneğini kapalı tutun.
5. Her MCP istemcisine kişisel bir API token'ı verin; `?token=` içeren URL'ler yerine başlıkları tercih edin (URL'ler günlüklere düşer).
6. Kullanıcılarınızın plugin yükleyip yükleyemeyeceğine karar verin (Ayarlar → Sunucu → *Plugin'lere izin ver* veya `PLUGINS_ENABLED=false`).
7. `DATA_DIR` dizinini yedekleyin ([dağıtım](deployment.md) bölümüne bakın).

## Güvenlik açığı bildirimi

Lütfen herkese açık bir issue açmak yerine depoda özel bir security advisory açın (veya geliştiricilerle iletişime geçin).
