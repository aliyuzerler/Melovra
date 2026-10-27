# Spatial miksin (Dolby Atmos tarzı 3D)

Melovra, bir şarkının bölümlerini Dolby Atmos gibi object tabanlı formatların yaptığı şekilde **dinleyicinin çevresine ve üstüne** yerleştirebilir ve sonucu kulaklık için (binaural), surround hoparlörler için (5.1, 7.1, 7.1.4) veya konum meta verisi taşıyan objeler olarak (object stem'ler, deneysel bir ADM BWF) render edebilir.

![Spatial mikser](screenshots/spatial.png)

## Bed ve objeler

- **Bed**, normal stereo miksdir: master efektler dahil, obje olmayan her şey. Hoparlör render'larında ön sol/sağ hoparlörlerden çalar.
- Bir **obje**, **3D** özelliği açılmış bir mikser insert'idir. Odada bir konumu vardır ve stereo bed'den ayrılır: kulaklık veya hoparlör için kendi konumunda render edilir. Yalnızca **doğrudan master'a** giden insert'ler obje olabilir (bir bus'a yönlendirilmiş insert bed'de kalır — onun yerine bus'u obje yapın). Send'ler çalışmaya devam eder: bir objenin reverb send'i, (bed'deki) reverb bus'ını besler; tıpkı gerçek bir Atmos oturumunda olduğu gibi.
- Konumlar Atmos / ADM Kartezyen geleneğini kullanır: **x** −1 sol duvar … +1 sağ duvar, **y** −1 arka … +1 ön (ekran), **z** 0 kulak yüksekliği … 1 tavan; dinleyici (0, 0, 0) noktasında oturur. Dinleyiciye yakınken ses tüm hoparlörlere yayılır.
- **LFE**, hoparlör render'larında bir objenin bir kısmını subwoofer kanalına gönderir (120 Hz low-pass).

## Spatial penceresi

Araç çubuğundaki küp düğmesiyle açın (veya bir mikser şeridinde sağ tık → *3D obje yap…*).

- **3D AÇIK/KAPALI** — spatial miksin. Kapalıyken objeler yok sayılır ve her şey stereo miksdir.
- **Monitor** — çalışırken duyduğunuz şey: *Stereo fold-down* (objeler x'lerine göre sol/sağa panning yapılır) veya **Binaural (kulaklık)** — her obje head-related (HRTF) filtrelerden geçirilir; böylece ön/arka/üst kulaklıkta duyulur hâle gelir. Master efektleri her ikisinde de uygulanır.
- **Oda**, yukarıdan görünüm (önde üstte): objeleri sürükleyin; kesikli halka yükseklikle büyür. Daireler kulak seviyesindeki hoparlörler, kareler bir 7.1.4 odasının yükseklik hoparlörleridir.
- **Obje paneli**: sol/sağ, arka/ön, yükseklik ve LFE knob'ları; hızlı konumlar (FL, C, FR, L, Top, R, RL, Rear, RR).
- **Insert'ler**: bir insert'i obje yapmak için işaretleyin. Mikserde objeler, pan knob'u yerine **3D** gösterir.
- **Dışa Aktar** — aşağıdaki teslimatlar (aynı zamanda Dosya menüsü → *Spatial miks (3D) dışa aktar…*).

**Objeleri taşıma**: konumlar otomatikleştirilebilir — bir mikser insert'inin *spatialX*, *spatialY* ve *spatialZ* değerleri, diğer herhangi bir parametre gibi otomasyon clip'lerinde (song mode). Bir clip bittikten sonra obje, clip'in bıraktığı yerde kalır. Claude'un `move_object` aracı bu clip'leri sizin için oluşturur (circle, fly-over, rise, left-right, keyframes).

## Dışa aktarmalar (48 kHz, 24-bit, Projeler → Dışa aktarmalar bölümüne)

| Format | Elde ettiğiniz şey |
|--------|--------------|
| **Binaural** | kulaklık için stereo bir WAV; çevrenizde ve üstünüzdeki objeler, bed ve master efektleri her zamanki gibi |
| **5.1** | 6 kanallı WAV (WAVE_FORMAT_EXTENSIBLE): L R C LFE Ls Rs |
| **7.1** | 8 kanallı WAV: L R C LFE Lrs Rrs Lss Rss (extensible sıralaması: arka, yandan önce) |
| **7.1.4** | 12 kanallı WAV: 7.1 + Ltf Rtf Ltr Rtr (yükseklik) |
| **Object stem'leri** | stereo bed, obje başına bir mono WAV (`…-obj01-Name.wav`) ve `…-positions.json` (her objenin zaman içindeki konumu, saniye cinsinden) |
| **ADM BWF** *(deneysel)* | tek WAV: bed (1–2. track'ler) + obje başına bir track; `bext`, `chna` ve `axml` chunk'larıyla — zamanlanmış Kartezyen konumlarla ITU-R BS.2076 meta verisi |

Notlar:

- Hoparlör render'ları, odayı bir object renderer gibi düzene eşler — ön köşeler L/R'yi, yan duvarlar side surround'ları (7.1), arka köşeler arka surround'ları verir; böylece `front-left` yalnızca L'den çalar — sonra her obje, kulak seviyesindeki halkanın en yakın iki hoparlörü arasında panning yapılır (constant power) ve yükseldikçe yükseklik halkasına crossfade edilir; yükseklik hoparlörü yoksa, yüksek objeler kulak seviyesine fold-down edilir.
- Binaural izlemede ve dışa aktarmalarda 3D objeler 3.5 dB kısılır (head-related filtreler enerji ekler); böylece binaural miksin stereo miksin yüksekliğine (loudness) oturur. Bed değişmez.
- Hoparlör ve obje render'larında **objeler master bus'ı atlar** (limiter dahil); bir Atmos renderer'daki gibi. Dışa aktarma her kanalın peak'ini raporlar — bir obje 0 dBFS'e ulaşıyorsa fader'ını kısın.
- Objeler monodur: stereo bir kaynak (L + R)/√2 olarak toplanır. Genişlik istiyorsanız stereo bir çifti iki obje yapın.
- En fazla 30 obje, object track olarak dışa aktarılabilir (çevrimdışı bir render'ın 32 kanalı vardır).
- **ADM BWF Dolby sertifikalı değildir.** ITU-R BS.2076'yı (ADM) ve BS.2088 tarzı chunk düzenini izler; böylece Atmos destekli araçlar bed'leri ve objeleri içe aktarabilir. Ancak bazı araçlar belirli profiller bekler (örn. bir 7.1.2 bed): içe aktarmadan sonra obje/bed atamasını kontrol edin. Obje konumları, her 32'lik notada örneklenen konumlar arasında süzülen zamanlanmış bloklar olarak yazılır (düz bir hareket tek blok olur); duraklamalar `jumpPosition`'lı bloklardır. Object stem'lerin positions JSON'u aynı blokları kullanır. 4 GB'ı aşan dosyalar (BW64) desteklenmez — dışa aktarma bunu render'dan önce söyler; daha kısa bir bölümü render edin.

## Claude ile

Claude'un `set_spatial`, `place_object`, `move_object` ve `export_spatial` araçları (ve `spatial_mix` prompt'u) vardır:

> *"Bir Atmos sürümü yap: yaylılar tepemde, gitarlar geniş, şaker arkamda olsun; riser, drop'tan önce odaya tur atsın; sonra bana bir binaural ve bir 7.1.4 dosyası ver."*

Bkz. [Claude ile müzik yapmak](claude-mcp.md#spatial-atmos-tarzı-miks).
