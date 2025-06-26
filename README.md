# 📋 Görev Yönetim Uygulaması

Modern, kullanıcı dostu takım bazlı görev yönetim uygulaması. Ekibinizle birlikte görevlerinizi organize edin, takip edin ve verimli çalışın!

## 🌟 Özellikler

### 👥 Takım Yönetimi
- **Takım Oluşturma**: Kendi takımlarınızı oluşturun
- **Üye Yönetimi**: Takıma üye ekleyin/çıkarın
- **Rol Bazlı Erişim**: Admin ve normal kullanıcı rolleri

### 📝 Görev Yönetimi
- **Görev Oluşturma**: Detaylı görev tanımları
- **Durum Takibi**: Yapılacak → Yapılıyor → Tamamlandı
- **Öncelik Sistemi**: Yüksek, Orta, Düşük öncelik seviyeleri
- **Görev Atama**: Takım üyelerine görev atayın
- **Gerçek Zamanlı Güncelleme**: Anlık görev durumu değişiklikleri

### 🔐 Güvenlik
- **JWT Kimlik Doğrulama**: Güvenli oturum yönetimi
- **Şifre Şifreleme**: BCrypt ile güvenli şifre saklama
- **Rol Bazlı Yetkilendirme**: Kullanıcı rollerine göre erişim kontrolü

### 🎨 Modern Arayüz
- **Responsive Tasarım**: Tüm cihazlarda uyumlu
- **Glassmorphism Efektleri**: Modern görsel tasarım
- **Tailwind CSS**: Hızlı ve tutarlı stil
- **Kullanıcı Dostu**: Sezgisel arayüz tasarımı

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+ 
- MongoDB Atlas hesabı (veya yerel MongoDB)
- Git

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/Gorkemdagli/Task-management/tree/main
cd task-management-app
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Ayarlayın
`.env.example` dosyasını `.env` olarak kopyalayın ve kendi bilgilerinizle doldurun:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

`.env` dosyasını açın ve gerekli bilgileri düzenleyin:

```env
# MongoDB Connection - Ana Veritabanı
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management-app?retryWrites=true&w=majority

# JWT Secret Key (Güçlü bir anahtar kullanın!)
JWT_SECRET=your-secret-jwt-key-here

# Node Environment
NODE_ENV=production

# Server Port
PORT=3000
```

> ⚠️ **Önemli**: `.env` dosyalarınızı asla git'e commit etmeyin. Bu dosyalar hassas bilgiler içerir.

### 4. Uygulamayı Başlatın
```bash
npm start
```

Uygulama `http://localhost:3000` adresinde çalışmaya başlayacak! 🎉

## 📖 Kullanım Kılavuzu

### İlk Kurulum
1. **Kayıt Olun**: `/register` sayfasından hesap oluşturun
2. **Giriş Yapın**: `/login` sayfasından oturum açın
3. **İlk Takımınızı Oluşturun**: Ana sayfadan "Yeni Takım" butonuna tıklayın

### Takım Yönetimi
1. **Takım Oluşturma**:
   - Ana sayfada "Yeni Takım" butonuna tıklayın
   - Takım adı ve açıklama girin
   - "Oluştur" butonuna tıklayın

2. **Üye Ekleme**:
   - Takım detay sayfasına gidin
   - "Üye Ekle" butonuna tıklayın
   - Kullanıcının e-posta adresini girin

### Görev Yönetimi
1. **Görev Oluşturma**:
   - Takım sayfasında "Yeni Görev" butonuna tıklayın
   - Görev bilgilerini doldurun
   - Öncelik seviyesini seçin
   - Takım üyelerine atayın

2. **Görev Durumu Değiştirme**:
   - Görev kartının üzerine tıklayın
   - Durum seçeneğini değiştirin
   - Değişiklikler otomatik kaydedilir

## 🛠️ Geliştirici Kılavuzu

### Proje Yapısı
```
task-management-app/
├── config/          # Veritabanı konfigürasyonu
├── middleware/      # Express middleware'leri
├── models/          # MongoDB modelleri
├── routes/          # API route'ları
├── views/           # EJS şablonları
├── public/          # Statik dosyalar (CSS, JS, resimler)
├── tests/           # Test dosyaları
├── scripts/         # Yardımcı scriptler
└── server.js        # Ana sunucu dosyası
```

### Geliştirme Komutları
```bash
# Geliştirme modunda çalıştır (otomatik yeniden başlatma)
npm run dev

# Testleri çalıştır
npm test

# Test modunda izleme
npm run test:watch

# CSS build et
npm run build:css

# CSS izleme modunda
npm run watch:css

# Örnek veri yükle
npm run seed
```

### API Dokümantasyonu
Swagger UI dokümantasyonuna erişmek için:
```
http://localhost:3000/api-docs
```

### Test Etme
```bash
# Tüm testleri çalıştır
npm test

# Belirli test dosyasını çalıştır
npm test -- --testPathPattern=task.test.js

# Test coverage raporu
npm test -- --coverage
```

## 🔧 Yapılandırma

### MongoDB Kurulumu
1. [MongoDB Atlas](https://www.mongodb.com/atlas) hesabı oluşturun
2. Yeni cluster oluşturun
3. Database user ekleyin
4. Network access ayarlarını yapın
5. Connection string'i `.env` dosyasına ekleyin

### Environment Variables
| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `MONGODB_URI` | MongoDB bağlantı string'i | `mongodb+srv://...` |
| `JWT_SECRET` | JWT token için gizli anahtar | `super-secret-key` |
| `NODE_ENV` | Çalışma ortamı | `production` veya `development` |
| `PORT` | Sunucu portu | `3000` |

## 🧪 Test Ortamı

Test ortamında uygulama:
- In-memory MongoDB kullanır (MongoMemoryServer)
- Gerçek veritabanını etkilemez
- Her testten sonra veriler temizlenir

### Test Ortamı Kurulumu

1. `.env.example` dosyasını `.env.test` olarak kopyalayın:

```bash
# Windows
copy .env.example .env.test

# Linux/Mac
cp .env.example .env.test
```

2. `.env.test` dosyasını düzenleyin:

```env
# Test Environment Configuration
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management-app-test?retryWrites=true&w=majority
JWT_SECRET=your-test-jwt-secret-key
```

3. Test ortamında çalıştırın:

```bash
# Test ortamında çalıştır
npm run start:test

# Testleri çalıştır
npm test
```

> 📝 **Not**: Test ortamında in-memory MongoDB kullanıldığı için veriler kalıcı değildir. Uygulama her yeniden başlatıldığında veriler sıfırlanır.

## 📊 API Endpoints

### Kullanıcı İşlemleri
- `POST /api/users/register` - Kayıt ol
- `POST /api/users/login` - Giriş yap
- `GET /api/users/profile` - Profil görüntüle
- `PUT /api/users/profile` - Profil güncelle

### Takım İşlemleri
- `POST /api/teams` - Takım oluştur
- `GET /api/teams` - Takımları listele
- `GET /api/teams/:id` - Takım detayları
- `PUT /api/teams/:id` - Takım güncelle
- `DELETE /api/teams/:id` - Takım sil
- `POST /api/teams/:id/members` - Üye ekle
- `DELETE /api/teams/:id/members/:userId` - Üye çıkar

### Görev İşlemleri
- `POST /api/tasks` - Görev oluştur
- `GET /api/tasks` - Görevleri listele
- `GET /api/tasks/:id` - Görev detayları
- `PUT /api/tasks/:id` - Görev güncelle
- `DELETE /api/tasks/:id` - Görev sil
- `PUT /api/tasks/:id/status` - Durum güncelle
- `PUT /api/tasks/:id/assignees` - Atama güncelle

## 🎯 Kullanıcı Rolleri

### Admin Kullanıcıları
- Tüm takımları görebilir
- Tüm görevleri görebilir ve düzenleyebilir
- Kullanıcı yönetimi yapabilir
- Sistem ayarlarını değiştirebilir

### Normal Kullanıcılar
- Sadece üye olduğu takımları görebilir
- Sadece kendine atanan görevleri görebilir
- Kendi takımlarında görev oluşturabilir

## 🚀 Deployment

### Heroku'ya Deploy
1. Heroku hesabı oluşturun
2. Heroku CLI kurun
3. Proje klasöründe:
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NODE_ENV=production
git push heroku main
```

### Docker ile Deploy
```bash
# Docker image oluştur
docker build -t task-management-app .

# Container çalıştır
docker run -p 3000:3000 --env-file .env task-management-app
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🆘 Sorun Giderme

### Yaygın Sorunlar

**Port zaten kullanımda hatası:**
```bash
# Windows'ta portu kullanan işlemi bul ve sonlandır
netstat -ano | findstr :3000
taskkill /PID <process-id> /F
```

**MongoDB bağlantı hatası:**
- MongoDB Atlas'ta IP whitelist kontrolü yapın
- Connection string'in doğru olduğundan emin olun
- Database user'ın doğru yetkilerinin olduğunu kontrol edin

**JWT token hatası:**
- `JWT_SECRET` environment variable'ının set edildiğinden emin olun
- Browser'da cookies'leri temizleyin

## 📞 Destek

Herhangi bir sorunuz veya sorununuz için:
- GitHub Issues açın
- E-posta: [your-email@example.com]
- Dokümantasyon: [your-docs-url]

---

## 🔧 Environment Dosyaları

### `.env` - Production Ortamı
```env
# MongoDB Connection - Ana Veritabanı
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management-app?retryWrites=true&w=majority

# JWT Secret Key (Güçlü bir anahtar kullanın!)
JWT_SECRET=your-secret-jwt-key-here

# Node Environment
NODE_ENV=production

# Server Port
PORT=3000
```

### `.env.test` - Test Ortamı
```env
# Test Environment Configuration
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/task-management-app-test?retryWrites=true&w=majority
JWT_SECRET=your-test-jwt-secret-key
```

> ⚠️ **Güvenlik Uyarısı**: `.env` dosyalarınızı ASLA git'e commit etmeyin. Bu dosyalar hassas bilgiler içerir.

## 🔐 Güvenlik Notları

### Environment Dosyaları
- **ASLA** `.env` veya `.env.test` dosyalarını git'e commit etmeyin
- Her zaman `.env.example` dosyasını şablon olarak kullanın
- Hassas bilgileri (şifreler, API anahtarları) güvenli bir şekilde saklayın
- Her ortam için ayrı `.env` dosyaları kullanın

### Şifre Güvenliği
- JWT Secret anahtarınızı güçlü ve karmaşık tutun
- MongoDB kullanıcı şifrelerinizi düzenli olarak değiştirin
- Production ortamında daha güçlü şifreler kullanın

### Veritabanı Güvenliği
- MongoDB Atlas'ta IP whitelisting kullanın
- Sadece gerekli IP adreslerine erişim izni verin
- Database user'a sadece gerekli yetkileri verin

### Kod Güvenliği
- Hassas bilgileri kod içinde saklamayın
- Tüm kullanıcı girdilerini doğrulayın ve temizleyin
- Güvenlik güncellemelerini düzenli olarak yapın
