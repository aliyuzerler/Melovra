# REST ve WebSocket API

Stüdyonun ve MCP araçlarının yaptığı her şey HTTP üzerinden erişilebilir durumdadır; kimliği doğrulanmış kullanıcıya
göre kapsamlanır.

## Kimlik doğrulama

| İstemci | Nasıl |
|--------|-----|
| Tarayıcı | `/api/auth/login` ya da `/setup`'ten `gtd_session` cookie'si (HttpOnly, SameSite=Lax, HTTPS üzerinde Secure) |
| Script'ler / MCP | `Authorization: Bearer gtd_…` kişisel API token'ı (Ayarlar → API & MCP) |
| WebSocket / MCP URL | cookie, Bearer ya da `?token=gtd_…` |

Durum değiştiren tarayıcı istekleri same-origin olmak zorundadır (`Origin` başlığı üzerinden kontrol edilir;
`PUBLIC_URL` de kabul edilir). Hatalar JSON'dur: 4xx/5xx durum koduyla `{ "error": "message" }`; 401 yanıtları
`"code": "AUTH_REQUIRED"` içerir.

```bash
TOKEN=gtd_…
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projects
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projects/<id>/summary
curl -H "Authorization: Bearer $TOKEN" -F file=@kick.wav http://localhost:3001/api/samples
```

## Sağlık kontrolü

`GET /api/health` → `{ "ok": true }`, kimlik doğrulama olmadan (container/proxy sağlık kontrolleri; diğer tüm
route'ların aksine herhangi bir `Host`'a da yanıt verir).

## Hesaplar — `/api/auth`, `/api/me`, `/api/admin`

| Metot ve yol | Notlar |
|---|---|
| `GET /auth/status` | `{ setupRequired, setupCodeRequired, user, allowRegistration, mcpWithoutToken }` |
| `POST /auth/setup` | yalnızca ilk çalıştırmada: `{ username, password, displayName, setupCode? }` → admin + oturum |
| `POST /auth/login` | `{ username, password }`; kullanıcı+IP, kullanıcı ve IP bazında hız sınırı |
| `POST /auth/logout` | bu oturumu sonlandırır ve socket'lerini kapatır |
| `POST /auth/register` | kayıt açıksa |
| `GET /me` · `PATCH /me` | mevcut kullanıcı · `{ displayName }` |
| `POST /me/password` | `{ currentPassword, newPassword }` — **yalnızca oturum**, diğer oturumların çıkışını yapar |
| `GET /me/token` | token bilgisi (prefix, oluşturma, son kullanım) — token'ın kendisi asla döner |
| `POST /me/token` · `DELETE /me/token` | üret/yeniden üret (ham token bir kez döner) · iptal — **yalnızca oturum** |
| `GET/POST /admin/users`, `PATCH/DELETE /admin/users/:id` | admin, yalnızca oturum. PATCH: `displayName`, `role`, `disabled`, `password` |
| `GET/PATCH /admin/settings` | `allowRegistration`, `mcpWithoutToken`, `mcpDefaultUserId`, `allowPlugins` |

## Projeler

| Metot ve yol | Notlar |
|---|---|
| `GET /projects` | projeleriniz (meta veri), en yeni önce |
| `POST /projects` | `{ name, bpm?, key?, template? }` ya da `{ project }` (içe aktarma) |
| `GET /projects/:id` · `/meta` · `/summary` | tam JSON · meta veri · düz metin özet (Claude'un okuduğu) |
| `DELETE /projects/:id` | sürümleriyle birlikte |
| `POST /projects/:id/duplicate` | `{ name? }` |
| `POST /projects/:id/ops` | `{ ops: [...], clientId?, source? }` → `{ rev, project }` — op türleri için bkz. [architecture](architecture.md#ops-düzenlemenin-tek-yolu) ve `packages/core/src/ops.js` |
| `POST /projects/:id/undo` | son MCP değişikliğini geri alır `{ force? }` |
| `GET/POST /projects/:id/versions` | listele · kaydet `{ name? }` |
| `POST /projects/:id/versions/:vid/restore` · `DELETE …/:vid` | |
| `GET /projects/:id/export` | proje dosyası (.json) |
| `GET /projects/:id/midi?mode=song|pattern&patternId=` | MIDI indirme |
| `POST /projects/:id/export-midi` | MIDI'yi dışa aktarımlarınıza kaydeder → `{ name, url, bytes }` |
| `GET/PUT /active` | aktif proje `{ projectId }` |
| `GET /status` | aktif proje, açık tarayıcı sekmeleri |
| `GET /catalog` · `/templates` | parametreleriyle enstrümanlar ve efektler · şablonlar |

## Sample'lar ve dışa aktarımlar

| Metot ve yol | Notlar |
|---|---|
| `GET /samples` | sample kütüphaneniz (meta veri + analiz; `folderId` null = klasörsüz, `rev` = ses revizyonu) |
| `POST /samples` | multipart alanı `file` (wav, mp3, ogg, opus, flac, aiff, aac/m4a, webm; `MAX_UPLOAD_MB`), isteğe bağlı `folderId` ve `name` |
| `GET /samples/:id` · `/info` · `/file` | kayıt · kısa açıklama (klasör adıyla) · ses (değişmez olarak önbelleklenir: `?v=<rev>` ekleyin) |
| `PATCH /samples/:id` | `{ name?, folderId?, analysis?, duration?, rev? }` (analiz ≤ 64 KB, tarayıcıdan gelir; `folderId: null` = klasörsüz; adlar ≤ 80 karakter ve içinde görünür bir şey olmalı). Analizin yapıldığı `rev`'i gönderin: ses o zamandan beri değiştirildiyse **409** (yeniden analiz edin) |
| `PUT /samples/:id/file` | multipart `file`: sample'ın yeni sesi (wave editöründeki *Replace original*) — aynı id, `rev` + 1, yeniden analiz |
| `DELETE /samples/:id` | |
| `POST /samples/delete` | `{ ids: [...] }` (≤ 500) — önce tümü kontrol edilir: bilinmeyen tek bir id hiçbir şeyi silmez → `{ deleted }` |
| `POST /samples/move` | `{ ids: [...], folderId }` (`null` = klasörsüz) → `{ moved }` |
| `POST /samples/usage` | `{ ids: [...] }` → `{ [id]: [{ projectId, projectName, channels: [names], clips }] }` — projelerinizdeki sampler kanalları ve audio clip'ler |
| `GET /samples/folders` | `[{ id, name, count, createdAt }]` A–Z |
| `POST /samples/folders` | `{ name }` (1–40 karakter, büyük/küçük harf duyarsız benzersiz, "Unfiled" olamaz; ≤ 200 klasör) → `201` |
| `PATCH /samples/folders/:id` · `DELETE /samples/folders/:id` | yeniden adlandır · sil (sample'ları klasörsüz olur → `{ unfiled }`) |
| `GET /exports` · `GET /exports/:name` · `DELETE /exports/:name` | render çıktıları (WAV, MP3, M4A, Ogg, Opus, FLAC, AIFF) ve MIDI dosyaları |
| `GET /exports/formats` · `GET /system/ffmpeg` | `{ ffmpeg: { available, version, reason, checkedAt }, formats: [{ id, label, ext, lossless, available, encoder, bitrates?, defaultBitrate?, reason? }] }` |
| `POST /system/ffmpeg/refresh` | admin (oturum): ffmpeg'i yeniden algıla (kurduktan sonra) |
| `POST /exports/:name/convert` | `{ format: mp3\|aac\|ogg\|opus\|flac\|alac\|aiff, bitrate?, metadata?: { title, artist, album, genre, date, comment } }` → `201 { export: { name, url, bytes, format, encoder, bitrate, bitDepth } }`. WAV dışa aktarımlarınızdan birini ffmpeg ile, yanına yeni bir dosya olarak dönüştürür (asla üzerine yazmaz). Hatalar: 400 (bilinmeyen format/bitrate, PCM/float WAV değil), 409 (ffmpeg ya da encoder eksik), 422 (format için çok fazla kanal, kayıplı bir format için hoparlör konumu olmayan çok kanallı WAV ya da ffmpeg başarısız — gerekçesiyle), 429 (sizin 3 dönüşümünüz hâlen çalışıyor/bekliyor), 504 (zaman aşımı) |
| `POST /exports` | multipart `file` (tarayıcıda render edilmiş bir WAV, ≤ 4 GB) + `name` — örn. Dosya menüsünden gelen stem'ler; asla üzerine yazmaz (`-2`, `-3`… ekler) |

## Plugin'ler

Kullanıcı başınadır; bkz. [plugins.md](plugins.md). Plugin kurmak ve değiştirmek **tarayıcı oturumu** gerektirir
(API token'ları 403 alır); plugin'ler kapalıyken her şey 403, başka kullanıcıların plugin'leri 404 döndürür.

| Metot ve yol | Notlar |
|---|---|
| `GET /plugins` | `{ allowed, plugins: [{ id, name, version, type, enabled, installedAt, sha256, bytes, manifest }] }` |
| `POST /plugins/inspect` | multipart `file` (.zip, ≤ 20 MB) → `{ token, sha256, manifest, files, totalBytes, update: { from } \| null }` — doğrulanır, 15 dk tutulur, hiçbir şey kurulmaz |
| `POST /plugins/install` | `{ token, trust: true }` → `201` kurulan kayıt (`trust` tam olarak `true` olmalı: kullanıcı uyarıyı onayladı) |
| `PATCH /plugins/:id` · `DELETE /plugins/:id` | `{ enabled }` · kaldır |
| `GET /plugins/:id/worklet.js` | DSP plugin'leri: AudioWorklet modülü (harness + kod); devre dışıyken 409 |
| `GET /plugins/:id/code` | generator'lar: kod `text/plain` olarak (sandbox iframe için) |
| `GET /plugins/:id/samples/<file>` | manifest'te listelenen bir sample |
| `GET /sandbox/generator.html` · `.js` | generator sandbox sayfası (kendi CSP'si, opaque origin) |

## Tarayıcı işleri

| Metot ve yol | Notlar |
|---|---|
| `POST /jobs` | `{ job: { kind: 'render' \| 'analyze-sample' \| 'sound' \| 'export-stems' \| 'spatial' \| 'generator' \| 'sample-edit', … }, projectId?, timeoutMs? }` — sizin bir tarayıcı sekmenizin çalıştırması beklenir (stdio bridge bunu kullanır; en fazla 5 dk, spatial için 15 dk, stem'ler için 30 dk) |
| `POST /jobs/:id/result` | multipart: `result` (JSON) + isteğe bağlı `file` (WAV) — tarayıcı gönderir |
| `POST /jobs/:id/files` | multipart `file` (WAV) + `name` — devam eden bir `export-stems` işinin tek bir stem'i |
| `POST /broadcast` | `{ type: 'transport' \| 'open', projectId, command? }` — sekmelerinizde play/stop/open |

## WebSocket `/ws`

JSON mesajlar. Oturum cookie'siyle (ya da `?token=` ile) bağlanın; oturum ya da token iptal edildiğinde socket
**4401** koduyla kapanır.

İstemci → sunucu

| type | alanlar |
|------|--------|
| `hello` | `clientId` |
| `subscribe` | `projectId`, `makeActive?` |
| `ops` | `projectId`, `ops`, `opId` |
| `resync` | — |
| `job-progress` / `job-error` | `jobId`, `progress` (0..1) / `message` |
| `ping` | `t` |

Sunucu → istemci

| type | alanlar |
|------|--------|
| `welcome` | `activeProjectId`, `activity` |
| `project` | `project` (yetkili durum) |
| `ack` / `reject` | `opId`, `rev` / `message`, `project`, `gone` (proje silinmiş) |
| `ops` | `projectId`, `ops` (hazırlanmış), `rev`, `source` (`ui`, `mcp`, `api`), `clientId`, `descriptions` |
| `activity` | `source`, `text`, `time`, `projectId` |
| `job` | `jobId`, `job` |
| `transport` | `action` (`play`, `stop`, `audition`), … |
| `open` | `projectId` |
| `projects-changed` · `samples-changed` · `versions-changed` · `plugins-changed` | yenileme işaretleri |
| `error` | `message`, `status`, `request` |
| `pong` | `t` |

## MCP endpoint

`POST /mcp` — stateless Streamable HTTP (her istek bağımsızdır; yanıtlar SSE'dir, böylece uzun süren araçlar ilerleme
akışı gönderebilir). `GET`/`DELETE` 405 döndürür. Bkz. [claude-mcp.md](claude-mcp.md) ve [MCP.md](MCP.md).
