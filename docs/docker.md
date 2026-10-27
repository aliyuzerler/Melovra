# Melovra'yi Docker ile çalıştırma

İmaj; sunucuyu, derlenmiş studio'yu ve **ffmpeg**'i içerir (böylece MP3, AAC, Ogg, Opus, FLAC, Apple Lossless ve AIFF dışa aktarmaları kutudan çıktığı gibi çalışır). Yetkisiz `node` kullanıcısı olarak çalışır, tüm veriyi tek bir volume'de tutar (`/data`) ve bir sağlık kontrolü vardır.

## Hızlı başlangıç (bu bilgisayar)

```bash
git clone <your copy of the repository> melovra && cd melovra
cp .env.example .env              # optional — every setting has a default
docker compose up -d --build
docker compose logs melovra  # first run: note the "Setup code"
```

<http://localhost:3001> adresini açın, admin hesabını oluşturun ve günlükteki **setup code**'u girin (Docker içinde tarayıcının istekleri Docker'ın ağı üzerinden gelir; sunucu bunların bu bilgisayardan geldiğini anlayamaz — kod, günlüğü okuyabildiğinizi kanıtlar). Compose dosyası portu yalnızca `127.0.0.1` üzerinde yayınlar.

**Claude'u bağlayın**: studio'da *Ayarlar → API & MCP* sayfasını açın, kişisel bir API token'ı oluşturun ve MCP URL'si `http://localhost:3001/mcp` ile birlikte kullanın (Claude Code ve Claude Desktop için kopyala-yapıştır kurulumları orada gösterilir). "Bu bilgisayardan" token'sız MCP, Docker içinde yukarıdaki nedenle geçerli değildir.

*Ayarlar → Ses dışa aktarma* bölümünü kontrol edin: "ffmpeg … kullanılabilir" yazmalıdır.

## Yapılandırma

Compose, `docker-compose.yml`'in yanındaki `.env` dosyasını okur ve bu değişkenleri konteynere aktarır (hepsi isteğe bağlıdır):

| Değişken | Compose varsayılanı | Ne yapar |
|----------|-----------------|--------------|
| `GTD_PORT` | `3001` | bu bilgisayardaki port (127.0.0.1'e bağlanır) |
| `PUBLIC_URL` | `http://localhost:${GTD_PORT}` | kullanıcıların kullandığı URL; Claude'un indirme bağlantıları ve izin verilen tarayıcı origin'i. Proxy arkasında `https://your.domain` ayarlayın |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | sunucunun yanıt verdiği host adları (DNS-rebinding koruması). Alan adınızı / LAN adınızı ekleyin |
| `TRUST_PROXY` | — | Caddy profili veya başka tek bir ters proxy arkasında `1` |
| `SETUP_CODE` | rastgele (günlükte) | ilk kurulum setup code'unu bununla sabitleyin |
| `SESSION_TTL_DAYS` | `30` | oturum ömrü |
| `MAX_UPLOAD_MB` | `50` | sample yükleme sınırı |
| `MCP_TOKEN` | — | eski paylaşımlı MCP token'ı (kişisel token'ları tercih edin) |
| `FFMPEG_PATH` | imajdaki ffmpeg | `off` dönüştürmeleri kapatır |
| `FFMPEG_TIMEOUT_SEC` / `FFMPEG_MAX_JOBS` | `300` / `2` | dönüştürme süresi sınırı / paralel dönüştürmeler |
| `PLUGINS_ENABLED` | `true` | kullanıcı plugin'lerinin yüklenmesine izin verir (adminler yine de Ayarlar → Sunucu'dan kapatabilir) |
| `DOMAIN` | `localhost` | (proxy profili) Caddy'nin sertifika aldığı alan adı |

İmaj içinde `HOST=0.0.0.0`, `PORT=3001`, `DATA_DIR=/data` ve `CLIENT_DIST=/app/client/dist` sabittir — yayınlanan portu `PORT` ile değil `GTD_PORT` ile değiştirin.

## Diğer bilgisayarlar için HTTPS (Caddy profili)

Makineye bir DNS adı işaret edin, sonra `.env` içine:

```bash
DOMAIN=beats.example.com
PUBLIC_URL=https://beats.example.com
ALLOWED_HOSTS=beats.example.com
TRUST_PROXY=1
```

```bash
docker compose --profile proxy up -d --build
```

Caddy ([deploy/Caddyfile](../deploy/Caddyfile)) bir Let's Encrypt sertifikası alır, 80/443 portlarını sunar ve compose ağı üzerinden uygulamaya tamponlamadan proxy yapar (WebSocket'ler ve MCP'nin akışkan yanıtları bunu gerektirir). Uygulamanın kendi portu 127.0.0.1'de kalır. Claude daha sonra `https://beats.example.com/mcp` adresine bir API token'ıyla bağlanır. Herkese açık bir sunucunun kontrol listesi için [security.md](security.md) dosyasına bakın.

Bunun yerine kendi proxy'nizi kullanacaksanız (nginx, Traefik…): `127.0.0.1` port eşlemesini koruyun (veya proxy'yi compose ağına alın), aynı dört değişkeni ayarlayın, `/ws` ve `/mcp` için proxy tamponlamasını kapatın — örnekler [deployment.md](deployment.md) içindedir.

**Alan adı olmadan LAN**: port eşlemesini `"3001:3001"` olarak değiştirin ve `ALLOWED_HOSTS=<makinenin adı veya IP'si>` ile `PUBLIC_URL=http://<ad veya IP>:3001` ayarlayın. Trafik bu durumda şifrelenmez; tarayıcılar ayrıca localhost dışındaki HTTPS olmayan origin'lerde ses girişini ve bazı özellikleri engeller.

## Veri, yedekler, güncelleme

Her şey (hesaplar, projeler, sürümler, sample'lar, dışa aktarmalar, kurulmuş plugin'ler) `melovra-data` volume'ündedir.

```bash
# backup (stops writes for a consistent copy)
docker compose stop melovra
docker run --rm -v melovra_melovra-data:/data:ro -v "$PWD":/backup alpine tar czf /backup/gtd-backup.tgz -C /data .
docker compose start melovra

# restore into an empty volume
docker compose down
docker run --rm -v melovra_melovra-data:/data -v "$PWD":/backup alpine sh -c "tar xzf /backup/gtd-backup.tgz -C /data && chown -R 1000:1000 /data"
docker compose up -d

# upgrade
git pull && docker compose up -d --build
```

Bir bind mount da iş görür (`- ./data:/data`), ancak klasör uid 1000 tarafından yazılabilir olmalıdır: `sudo chown -R 1000:1000 data`.

**Admin parolasını mı unuttunuz?** Sıfırlama aracı, sunucu veriyi kullanırken çalışmayı reddeder; önce sunucuyu durdurun:

```bash
docker compose stop melovra
docker compose run --rm --no-deps melovra node server/src/cli/reset-password.js <username>   # prompts
docker compose start melovra
```

## Compose dosyasındaki sertleştirme

- `node` (uid 1000) olarak çalışır, `no-new-privileges`, **tüm Linux yetenekleri (capabilities) düşürülmüştür**;
- **salt okunur kök dosya sistemi** — yalnızca `/data` (volume) ve 256 MB'lık `/tmp` tmpfs yazılabilir;
- 1 GB bellek sınırı, döndürülen günlükler (3 × 10 MB);
- uygulama portu yalnızca 127.0.0.1 üzerinde yayınlanır; sağlık kontrolü `/api/health` uçmasını çağırır (herhangi bir host adına yanıt veren tek rota ve hiçbir şey ifşa etmez);
- PID 1 olarak `tini` sinyalleri iletir (sunucu SIGTERM'de depolarını diske yazar) ve ffmpeg süreçlerini toplar.

## Compose olmadan

```bash
docker build -t melovra .
docker volume create melovra-data
docker run -d --name melovra --restart unless-stopped \
  -p 127.0.0.1:3001:3001 -v melovra-data:/data \
  -e PUBLIC_URL=http://localhost:3001 -e ALLOWED_HOSTS=localhost,127.0.0.1 \
  --read-only --tmpfs /tmp:size=256m --cap-drop ALL --security-opt no-new-privileges \
  melovra
docker logs melovra      # setup code
```

## Sorun giderme

| Belirti | Çözüm |
|---------|-----|
| `Invalid Host: …` (403) | o adı `ALLOWED_HOSTS` listesine ekleyin |
| "Cross-origin request blocked" | `PUBLIC_URL` değerini tarayıcı adres çubuğundaki tam URL'ye ayarlayın |
| Kurulum bir kod istiyor | kod `docker compose logs melovra` çıktısındadır (veya `SETUP_CODE` ayarlayın) |
| Günlükte `EACCES … /data` | bind mount edilmiş klasör uid 1000'e ait değildir (`chown -R 1000:1000`) |
| Claude'un indirme bağlantıları yanlış yeri gösteriyor | `PUBLIC_URL` ayarlayın |
| Ayarlar → Ses dışa aktarma, ffmpeg'in eksik olduğunu söylüyor | `FFMPEG_PATH` ayarlamışsınız; kaldırın (imajın ffmpeg'i PATH üzerindedir) |
| Konteyner `unhealthy` | `docker compose logs melovra`; sağlık kontrolü, sunucunun konteyner içinde 3001 portunu dinlemesini gerektirir |
