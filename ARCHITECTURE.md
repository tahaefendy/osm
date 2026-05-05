# OSM Automation System - Professional Architecture

## 📂 Güncellenmiş Dosya Yapısı

```text
src/
├── core/
│   ├── browser.js        # Playwright motoru (Singleton)
│   └── session.js        # İzole Context yönetimi
│
├── modules/
│   ├── register.js       # Step-by-step kayıt akışı (Sınıf tabanlı)
│   ├── logout.js         # Çıkış mantığı
│   └── usernameGenerator.js
│
├── utils/
│   ├── delay.js          # Random bekleme
│   ├── logger.js         # Log sistemi
│   ├── userAgents.js     # UA rotasyonu
│   └── emailGenerator.js # Otomatik e-posta üretimi
│
├── config/
│   └── settings.js       # Seçiciler, süreler ve dosya yolları
│
├── logs/
│   └── screenshots/      # Hata anında alınan ekran görüntüleri
│
└── main.js               # CLI Giriş Noktası
```

## 🛠 Kayıt Akışı (Step-by-Step)
Sistem her adımı ayrı fonksiyonlar halinde yönetir:
1. `clickAccept()`: Çerez/Davet kabulü.
2. `clickSignupWithEmail()`: E-posta ile kayıt seçeneği.
3. `fillUsername()`: Dinamik kullanıcı adı girişi.
4. `submitUsername()`: Kullanıcı adı onayı.
5. `fillEmail()`: Üretilen e-posta girişi.
6. `submitEmail()`: Kayıt tamamlama.

## 🛡 Hata Yönetimi
Herhangi bir adımda hata oluştuğunda:
* Hata `try/catch` ile yakalanır.
* Hata anındaki tarayıcı görüntüsü `logs/screenshots/` klasörüne kaydedilir.
* Hata detayı loglanır ve mevcut oturum kapatılarak bir sonrakine geçilir.

## 🌐 Gelecek Entegrasyon Planı (PHP/Web Panel)

Bu sistem ileride şu şekillerde PHP tabanlı bir panele bağlanabilir:

1. **Child Process:** PHP `exec()` veya `proc_open()` ile Node.js scriptini tetikleyebilir.
2. **Express API:** Node.js tarafında bir API katmanı oluşturularak PHP'den `POST` istekleri ile bot başlatılabilir.
3. **Queue/Redis:** PHP görevleri bir kuyruğa (Redis/RabbitMQ) atar, Node.js worker'ları bu görevleri işler.
4. **Database Sync:** Hesap bilgileri ve işlem durumları ortak bir veritabanı (MySQL) üzerinden senkronize edilebilir.

## 🚀 Çalıştırma
```bash
node main.js
```
Çalıştıktan sonra terminal üzerinden `Invite Link` ve `Account Count` bilgilerini isteyecektir.
