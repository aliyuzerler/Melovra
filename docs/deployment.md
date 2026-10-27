# Dağıtım

## Yapılandırma

Tüm ayarlar ortam değişkenleridir (veya depo kökündeki bir `.env` dosyası — bkz. `.env.example`).

| Değişken | Varsayılan | Anlamı |
|----------|---------|---------|
| `PORT` | `3001` | HTTP portu |
| `HOST` | `127.0.0.1` | dinlenecek arayüz; aynı makinedeki bir proxy arkasında `127.0.0.1` bırakın, Docker/LAN için `0.0.0.0` |
| `DATA_DIR` | `./data` | projeler, sürümler, sample'lar, dışa aktarmalar, `users.json`, `sessions.json` |
| `PUBLIC_URL` | — | dış URL (Claude için indirme bağlantıları, izin verilen tarayıcı origin'i) |
| `ALLOWED_HOSTS` | loopback'te localhost adları, aksi halde kapalı | virgülle ayrılmış `Host` beyaz listesi; `*` devre dışı bırakır |
| `TRUST_PROXY` | kapalı | Express "trust proxy": proxy atlama sayısı (önerilir) veya bir alt ağ listesi. `true` kullanmaktan kaçının: herhangi bir istemci IP'sini X-Forwarded-For ile sahteleyebilir |
| `SESSION_TTL_DAYS` | `30` | oturum ömrü (kayan) |
| `SETUP_CODE` | rastgele, günlükte yazılır | ilk admini başka bir bilgisayardan veya proxy üzerinden oluştururken istenen kod |
| `MCP_TOKEN` | — | eski paylaşımlı MCP token'ı (ilk admin gibi davranır; token'sız MCP'yi kapatır) |
| `MAX_UPLOAD_MB` | `50` | en büyük sample yüklemesi |
| `FFMPEG_PATH` | `PATH` üzerindeki `ffmpeg` | MP3/AAC/Ogg/Opus/FLAC/ALAC/AIFF dışa aktarmaları için ffmpeg; `off` devre dışı bırakır (WAV her zaman çalışır) |
| `FFMPEG_TIMEOUT_SEC` | `300` | daha uzun süren bir dönüştürme sonlandırılır |
| `FFMPEG_MAX_JOBS` | `2` | aynı anda çalışacak dönüştürme sayısı (diğerleri sıraya girer) |
| `PLUGINS_ENABLED` | `true` | kullanıcıların kendi plugin'lerini yüklemesine izin verir ([plugins.md](plugins.md)); adminler Ayarlar → Sunucu'dan da kapatabilir |
| `CLIENT_DIST` | `client/dist` | sunulacak derlenmiş web arayüzü |
| `MELOVRA_URL` | `http://127.0.0.1:3001` | stdio MCP köprüsü / Vite dev proxy hedefi |
| `MELOVRA_TOKEN` | — | stdio köprüsünün kullandığı API token'ı |

## Docker

İmaj ffmpeg içerir, sağlık kontrolü bulunan root olmayan bir kullanıcı olarak çalışır; `docker-compose.yml` ayrıca salt okunur bir kök dosya sistemi, düşürülmüş yetkiler (capabilities) ve isteğe bağlı bir Caddy HTTPS proxy'si ekler:

```bash
cp .env.example .env && docker compose up -d --build
docker compose logs melovra        # shows the first-run setup code
```

Bununla ilgili her şey — yapılandırma, HTTPS profili, yedekler, güncellemeler, parola sıfırlama — **[docker.md](docker.md)** içindedir.

## Ters proxy arkasında

WebSocket'ler (`/ws`) ve SSE yanıtları (`/mcp`) tamponlamadan proxylanmalıdır.

**Caddy**

```
beats.example.com {
  reverse_proxy 127.0.0.1:3001
}
```

**nginx**

```nginx
server {
  server_name beats.example.com;
  # renders are uploaded from the browser: a 24-bit stereo song is ~15 MB per minute, a 7.1.4 render ~100 MB per
  # minute (the server accepts up to 4 GB per file); uploads need a signed-in user or an API token
  client_max_body_size 4g;
  proxy_request_buffering off;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
    # browser jobs (renders, stems, spatial exports) can take up to 30 minutes before the answer comes back
    proxy_read_timeout 1900s;
    proxy_send_timeout 1900s;
  }
}
```

Ardından `TRUST_PROXY=1`, `PUBLIC_URL`, `ALLOWED_HOSTS` ayarlayın. (Caddy'nin varsayılan bir gövde boyutu sınırı yoktur; diğer proxy'lerde büyük yüklemelere de izin verin, yoksa uzun dışa aktarmalar 413 ile başarısız olur.) MCP istemcileri `https://beats.example.com/mcp` adresine kişisel token'larıyla bağlanır.

> **Proxy arkasında her zaman `PUBLIC_URL` ayarlayın.** Ayarlanmadığında, `X-Forwarded-For` eklemeyen ve `Host` başlığını `127.0.0.1` olarak yeniden yazan bir proxy (`proxy_set_header` satırlarını atlayan nginx ikisini de yapar), her ziyaretçiyi sanki sunucunun kendisindemiş gibi gösterir — böylece token'sız MCP ve kod istemeyen ilk kurulum onlara açık olur. `PUBLIC_URL` veya `TRUST_PROXY` bu "yerel" muameleyi kapatır. Bkz. [güvenlik](security.md#mcp-erişimi).

## systemd (Docker olmadan)

```ini
[Unit]
Description=Melovra
After=network.target

[Service]
WorkingDirectory=/opt/melovra
Environment=NODE_ENV=production HOST=127.0.0.1 PORT=3001 DATA_DIR=/var/lib/melovra
ExecStart=/usr/bin/node server/src/index.js
Restart=on-failure
User=melovra

[Install]
WantedBy=multi-user.target
```

Önce derleyin: `npm ci && npm run build`.

## Yedekler

Her şey `DATA_DIR` içinde durur (göreli yollar depo köküne göre çözülür). Dosyalar atomik yazılır (geçici dosya + yeniden adlandırma), bu yüzden düz bir kopya çoğu kullanım için yeterince tutarlıdır; tamamen sessiz bir anlık görüntü için önce sunucuyu durdurun. Bir `server.lock` dosyası çalışan sunucuyu işaretler; `npm run reset-password` gibi bakım komutları, bu dosya varken ve süreç canlıyken çalışmayı reddeder.

```bash
tar czf melovra-backup-$(date +%F).tgz -C /var/lib melovra
```

Geri yükleme, sunucu durdurulmuşken `DATA_DIR` içine açılarak yapılır.

## Güncelleme

Yeni sürümü çekin, `npm ci && npm run build` çalıştırın, yeniden başlatın. Projeler yükleme sırasında normalleştirilir, bu yüzden eski proje dosyaları çalışmaya devam eder.
