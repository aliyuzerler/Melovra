# Geliştirme

## Kurulum

```bash
npm install
npx playwright install chromium   # once, for the e2e tests
npm run dev                       # server on :3001 (node --watch) + Vite on :5173
```

http://localhost:5173 adresini açın. Geliştirme verisi `./data` altına gider (git-ignored); baştan başlamak için
silin.

## Script'ler

| Script | Ne yapar |
|--------|--------------|
| `npm run dev` | hot reload'lu sunucu + istemci |
| `npm run build` | istemcinin production build'i (`client/dist`) |
| `npm start` | production sunucu |
| `npm test` | unit ve entegrasyon testleri (core, server ve client, `node:test`) |
| `npm run lint` | tüm repo üzerinde ESLint |
| `npm run test:e2e` | build + geçici bir sunucuya karşı Playwright uçtan uca testleri |
| `npm run screenshots` | `docs/screenshots/*.png` dosyalarını yeniden üretir |
| `npm run docs:mcp` | `docs/MCP.md` dosyasını araç tanımlarından yeniden üretir |
| `npm run mcp` | stdio MCP sunucusunu çalıştırır (Claude Desktop'ın başlattığı şey) |
| `npm run reset-password -- <user>` | komut satırından bir parolayı sıfırlar |
| `npm run plugin:pack -- <folder>` · `-- --examples` | bir plugin klasörünü sunucunun install kontrolüyle doğrular ve `plugins/dist/` içine zip'ler |
| `npm run skills:pack` | `skills/` içindeki müzik prodüksiyonu skill'lerini kontrol eder ve `skills/dist/` içine zip'ler (Claude Desktop / claude.ai için) |

## Depo düzeni

```
packages/core   shared model, ops, music theory, analysis (browser + Node, no platform APIs)
server          Express + WebSocket hub + MCP (src/mcp) + auth (src/auth)
client          React UI (components/), state (state/), audio engine (audio/), helpers (lib/)
e2e             Playwright specs
plugins         example plugins (examples/) and packed zips (dist/, from `npm run plugin:pack`)
docs            documentation (MCP.md is generated)
scripts         maintenance scripts (MCP docs, plugin and skill packing; password reset lives in server/src/cli)
skills          music-production skills for Claude users (not for developing — those are in .claude/skills)
.claude         skills and agents for developing with Claude Code (see CLAUDE.md)
```

## Kurallar

- Her yerde ESM JavaScript, Node ≥ 20.19, TypeScript yok. 2 boşluk girinti, tek tırnak, noktalı virgül.
- `npm run lint` geçmelidir; her hata düzeltmesi ve özellik testleriyle birlikte gelir.
- **Tüm proje değişiklikleri op'tur** (`packages/core/src/ops.js`). Op'lar deterministik olmalıdır — üretilen id'ler
  `prepareOps`'a aittir.
- Param katalogları (`instruments.js`, `effects.js`), aralıklar, UI ve doğrulama için tek doğruluk kaynağıdır.
- Sunucu kodu verileri her zaman sahibine göre kapsar (`getOwned`, `samples.get(id, userId)`).
- MCP araçları herhangi bir şeyi değiştirmeden önce doğrular, hataları Claude'un toparlayabileceği biçimde açıklar ve
  oluşturulan id'leri döndürür.
- React: dar store dilimlerine abone olun; `useStore.getState()`'i bağımlılık dizilerine koymayın.
- Gerekçesiz yeni runtime bağımlılığı yok; lisanslar MIT uyumlu olmalıdır.

Adım adım tarifler `.claude/skills/` içindedir: enstrüman ekleme, efekt ekleme, MCP aracı ekleme, proje op'u ekleme,
spatial audio, plugin sistemi, plugin yazma, dışa aktarma formatları, test ve QA, dokümantasyon ve sürüm çıkarma.

## Testler

| Paket | Konum |
|-------|----------|
| core model/ops/teori/MIDI/şablonlar | `packages/core/test/core.test.js` |
| ses analizi ve streaming meter | `packages/core/test/analysis.test.js` |
| spatial koordinatlar, hoparlör düzenleri, ADM | `packages/core/test/spatial.test.js` |
| plugin manifestleri, izinler, üretilen nota temizliği | `packages/core/test/plugins.test.js` |
| tarayıcı DSP yardımcıları (kompresör makeup modeli, clip eğrisi) | `client/test/dsp.test.js` |
| fiziksel modeller (piano, guitar, bass, pizzicato) | `client/test/models.test.js` |
| auth ve hesaplar | `server/test/auth.test.js` |
| sıkılaştırma (socket'ler, yarış durumları, kapsamlar) | `server/test/security.test.js` |
| MCP (stdio bridge ve render işi dahil) | `server/test/mcp.test.js`, `server/test/mcp-edge.test.js` |
| MCP prodüksiyon araçları, işler ve dışa aktarımlar (sahte tarayıcı) | `server/test/production.test.js` |
| REST, WebSocket, store | `server/test/server.test.js` |
| ffmpeg algılama ve dönüşüm (sahte ffmpeg), dışa aktarma formatları | `server/test/ffmpeg.test.js` |
| spatial MCP araçları ve dışa aktarımlar | `server/test/spatial.test.js` |
| plugin'ler: zip okuyucu, install/trust akışı, izolasyon, servis etme, MCP araçları | `server/test/plugins.test.js` |
| tarayıcı yolculukları | `e2e/studio.spec.js`, `e2e/unhappy-paths.spec.js`, `e2e/workflow.spec.js` (prodüksiyon araçları, analyze_sound, stem'ler), `e2e/workflow-band.spec.js` (grup enstrümanları, ffmpeg dışa aktarma), `e2e/workflow-spatial.spec.js` (3D dışa aktarımlar), `e2e/workflow-plugins.spec.js` (trust diyaloğu, render'larda DSP/sample plugin'leri, generator sandbox, düşmanca plugin'ler) |

CI (`.github/workflows/ci.yml`), elle başlatıldığında (Actions → CI → *Run workflow*) lint, unit testleri, e2e ve bir
Docker build çalıştırır; push'ta çalışmaz.

## Katkıda bulunma

Hata bildirme, özellik önerme ve pull request açma konusunda [CONTRIBUTING.md](../CONTRIBUTING.md) dosyasına bakın.
Kısaca:

1. Fork'layın, `main`'den branch açın.
2. Değişikliği testleriyle yapın; `npm run lint && npm test && npm run test:e2e` çalıştırın.
3. Dokümanları güncelleyin (ilgiliyse `npm run docs:mcp` / `npm run screenshots`).
4. Kullanıcıya görünen değişikliği anlatan bir pull request açın.

Katkıda bulunarak, katkınızın MIT lisansıyla lisanslanmasını kabul etmiş olursunuz.
