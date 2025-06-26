# MongoDB Atlas Kurulum Rehberi

Bu proje artık MongoDB Atlas (bulut MongoDB servisi) ile çalışacak şekilde yapılandırılmıştır.

## 🚀 MongoDB Atlas Kurulumu

### 1. MongoDB Atlas Hesabı Oluşturun
1. [MongoDB Atlas](https://www.mongodb.com/atlas) sitesine gidin
2. "Try Free" butonuna tıklayın
3. Hesabınızı oluşturun

### 2. Cluster Oluşturun
1. Dashboard'da "Build a Database" butonuna tıklayın
2. **FREE** seçeneğini seçin (M0 Sandbox)
3. Cloud Provider olarak **AWS**, **Google Cloud** veya **Azure** seçin
4. Region seçin (en yakın lokasyon önerilir)
5. Cluster Name girin (örn: `task-management-cluster`)
6. "Create" butonuna tıklayın

### 3. Database User Oluşturun
1. Sol menüden "Database Access" seçin
2. "Add New Database User" butonuna tıklayın
3. Authentication Method: **Password**
4. Username ve Password girin (güçlü bir şifre kullanın)
5. Database User Privileges: **Read and write to any database**
6. "Add User" butonuna tıklayın

### 4. Network Access Ayarlayın
1. Sol menüden "Network Access" seçin
2. "Add IP Address" butonuna tıklayın
3. **Allow Access from Anywhere** seçin (0.0.0.0/0)
   - Güvenlik için sadece kendi IP adresinizi de ekleyebilirsiniz
4. "Confirm" butonuna tıklayın

### 5. Connection String Alın
1. Sol menüden "Database" seçin
2. Cluster'ınızın yanındaki "Connect" butonuna tıklayın
3. "Connect your application" seçin
4. Driver: **Node.js**, Version: **4.1 or later**
5. Connection string'i kopyalayın

## 🔧 Proje Konfigürasyonu

### 1. .env Dosyasını Düzenleyin
`.env` dosyasındaki `MONGODB_URI` değerini MongoDB Atlas connection string ile değiştirin:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

**Örnek:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@task-management-cluster.abc123.mongodb.net/task-management-app?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-complex-and-random
NODE_ENV=development
PORT=3000
```

### 2. Değişkenleri Değiştirin
- `<username>`: MongoDB Atlas'ta oluşturduğunuz kullanıcı adı
- `<password>`: MongoDB Atlas'ta oluşturduğunuz şifre
- `<cluster-name>`: Cluster adınız
- `<database-name>`: Veritabanı adı (örn: `task-management-app`)

## 🏃‍♂️ Uygulamayı Çalıştırın

```bash
# Bağımlılıkları yükleyin
npm install

# Uygulamayı geliştirme modunda çalıştırın
npm run dev

# Veya production modunda
npm start
```

## ✅ Bağlantıyı Test Edin

Uygulama başlatıldığında şu mesajları görmelisiniz:
```
MongoDB Connected: cluster0-shard-00-00.abc123.mongodb.net
Database Name: task-management-app
🚀 Sunucu 3000 portunda çalışıyor
📚 Swagger dokümantasyonu: http://localhost:3000/api-docs
🌐 Uygulama: http://localhost:3000
```

## 🧪 Test Çalıştırma

Testler otomatik olarak in-memory MongoDB kullanır:

```bash
npm test
```

## 🔐 Güvenlik Önerileri

1. **Güçlü şifreler kullanın**: Database user şifreniz en az 12 karakter olmalı
2. **IP whitelist kullanın**: Mümkünse sadece kendi IP adresinizi whitelist'e ekleyin
3. **Environment variables**: .env dosyasını asla git'e commit etmeyin
4. **JWT Secret**: Güçlü ve rastgele bir JWT secret kullanın

## 🔍 Sorun Giderme

### Bağlantı Hatası
- IP adresinizin whitelist'te olduğundan emin olun
- Username ve password'un doğru olduğundan emin olun
- Cluster'ın aktif olduğundan emin olun

### Authentication Hatası
- Database user'ın doğru permissions'a sahip olduğundan emin olun
- Connection string'deki özel karakterlerin URL encoded olduğundan emin olun

### Network Timeout
- Internet bağlantınızı kontrol edin
- Firewall ayarlarınızı kontrol edin

## 📊 MongoDB Compass (Opsiyonel)

Veritabanınızı görsel olarak yönetmek için MongoDB Compass kullanabilirsiniz:
1. [MongoDB Compass](https://www.mongodb.com/products/compass) indirin
2. Connection string'inizi kullanarak bağlanın 