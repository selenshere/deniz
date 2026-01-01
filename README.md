# Öğretmen Adayı Mentor Geri Bildirim Sistemi (GitHub Pages)

Bu proje **statik** (HTML/CSS/JS) bir arayüzdür ve **GitHub Pages** üzerinde çalışır.
Mentor geri bildirimi için, Render üzerindeki backend'e istek atar:

- `API_BASE_URL`: `https://deniz-vazb.onrender.com` (config.js içinde)

## Özellikler
- İsim + Soyisim zorunlu
- Video izleme alanı (YouTube linkini embed eder; diğer linkleri iframe ile dener)
- Yönerge alanı
- 3 alan: **Dikkate Alma / Yorumlama / Karar Verme** (kopyala-yapıştır)
- “Mentor Geri Bildirimi Al” -> Render API'ye POST atar, dönen metni ekrana basar
- “Kaydet ve İndir” -> cihazınıza **TXT + JSON** indirir (dosya adında `isim_soyisim_deniz_...`)

## Kurulum / Çalıştırma (Yerel)
Bu proje build gerektirmez.
- Dosyaları bir klasöre çıkarın
- `index.html` dosyasını tarayıcıda açın

> Not: Bazı tarayıcılar `file://` üzerinde CORS nedeniyle fetch'i engelleyebilir.
> Yerelde test için basit bir sunucu kullanabilirsiniz:
> - Python: `python -m http.server 8000` (sonra http://localhost:8000)

## GitHub Pages Yayınlama
1. Bu repoyu GitHub'a yükleyin.
2. GitHub -> **Settings** -> **Pages**
3. Source: `Deploy from a branch`
4. Branch: `main` / root
5. Kaydedin. Birkaç dakika sonra Pages URL oluşur.

## Backend (Render) Beklentisi
Frontend şu endpointleri sırayla dener (config.js):
- `/api/mentor-feedback`
- `/mentor-feedback`
- `/api/feedback`
- `/feedback`
- `/api/chat`
- `/chat`

Beklenen POST body örneği:
```json
{
  "name": "Ayşe",
  "surname": "Yılmaz",
  "instruction": "....",
  "observations": {
    "dikkate_alma": "...",
    "yorumlama": "...",
    "karar_verme": "..."
  },
  "rubric": ["Dikkate Alma","Yorumlama","Karar Verme"],
  "language": "tr"
}
```

Beklenen response (örnek):
- `{ "feedback": "..." }` veya `{ "message": "..." }` veya ham metin.

> Eğer backend farklı bir endpoint/format kullanıyorsa `config.js` ve `app.js` içindeki parse kısmını güncelleyin.

## Güvenlik
OpenAI API Key **kesinlikle frontend'e konulmamalı**. Anahtar yalnızca Render backend'de kalmalı.
