# Deniz Noticing Mentor (Render + OpenAI)

Türkçe arayüzlü basit bir web uygulaması:
- Sol tarafta YouTube video
- Sağ tarafta Noticing Mentor chatbot
- İsim + Soyisim zorunlu
- Kaydet butonu: sohbet logları JSON olarak iner
  - Dosya adı: `isim_soyisim_deniz.json`
- OpenAI API anahtarı **sunucu tarafında** (Render Environment Variable)

## Kurulum (lokal)

```bash
npm install
export OPENAI_API_KEY="YOUR_KEY"
# opsiyonel:
export OPENAI_MODEL="gpt-4o-mini"
npm start
```

Tarayıcı: http://localhost:3000

## Render Deploy

1. GitHub'a bu projeyi yükle
2. Render'da **New Web Service** → GitHub repo'yu seç
3. Environment Variables:
   - `OPENAI_API_KEY` = anahtarın
   - (opsiyonel) `OPENAI_MODEL` = örn `gpt-4o-mini`
4. Build Command: boş (Node servis)
5. Start Command: `npm start`

## YouTube videosunu değiştirme

`public/index.html` içindeki iframe `src` değerini değiştir.

## Notlar

- API key tarayıcıya asla gitmez.
- Chat geçmişi sadece kullanıcı/assistant mesajları olarak sunucuya gider.
