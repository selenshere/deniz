# Öğretmen Adayı Mentor Sistemi (GitHub Pages) — v2 (Çok turlu sohbet)

Bu proje **statik** (HTML/CSS/JS) bir arayüzdür ve **GitHub Pages** üzerinde çalışır.
Mentor geri bildirimi için Render üzerindeki backend'e istek atar:

- `API_BASE_URL`: `https://deniz-vazb.onrender.com` (config.js içinde)

## Yenilik (v2)
- Mentor ile **çok turlu sohbet**: sohbet geçmişi `messages` olarak backend'e gönderilir.
- API test bölümü **kaldırıldı**.
- Tema **açık renk** yapıldı.

## Kullanım
1) İsim + soyisim girin  
2) Video linkini ekleyip “Videoyu Yükle”  
3) Dikkate alma / yorumlama / karar verme metinlerini yapıştırın  
4) “Mentor Sohbetini Başlat” ile ilk mentor yanıtını alın  
5) Alttan mesaj yazarak devam edin  
6) “Kaydet ve İndir” ile TXT+JSON raporu indirin (dosya adında `isim_soyisim_deniz_...`)

## Backend beklentisi
Frontend, şu endpointleri sırayla dener:
- `/api/mentor-feedback`
- `/mentor-feedback`
- `/api/feedback`
- `/feedback`
- `/api/chat`
- `/chat`

POST body örneği:
```json
{
  "name": "Ayşe",
  "surname": "Yılmaz",
  "instruction": "...",
  "observations": {
    "dikkate_alma": "...",
    "yorumlama": "...",
    "karar_verme": "..."
  },
  "messages": [
    {"role":"user","content":"..."},
    {"role":"mentor","content":"..."}
  ],
  "language": "tr"
}
```

Response:
- `{ "feedback": "..." }` veya `{ "message": "..." }` veya ham metin.

## Güvenlik
OpenAI API Key **frontend'e konmamalı**. Sadece Render backend'de kalmalı.

## GitHub Pages
GitHub -> Settings -> Pages -> Deploy from branch -> main / root.
