// Test ortamını hazırlama dosyası
require('dotenv').config({ path: '.env.test' });

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// MongoDB bellek sunucusunu başlat
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  
  console.log('🧪 Test MongoDB Memory Server başlatıldı');
  console.log(`📊 Test veritabanı URI: ${uri}`);
  
  // Test veritabanına bağlan
  await mongoose.connect(uri);
  console.log('✅ Test veritabanına bağlandı');
});

// Her testten sonra veritabanını temizle
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// MongoDB bellek sunucusunu kapat
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongod) {
    await mongod.stop();
    console.log('🔴 Test MongoDB Memory Server kapatıldı');
  }
});

// Konsolda hata ayıklama mesajlarını gösterme
jest.setTimeout(30000); // Timeout süresini arttır

// Console loglarını göstermek için bu kısmı yoruma aldım
/*
// Konsolda hata çıktılarını gizle (test çıktılarını daha temiz tutar)
global.console = {
  ...console,
  // Gerçek loglama fonksiyonlarını sakla
  _log: console.log,
  _error: console.error,
  _warn: console.warn,
  _info: console.info,
  
  // Yalnızca test başarısız olduğunda loglar görünecek
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Test başarısız olursa gerçek logları göster
afterEach(() => {
  if (expect.getState().currentTestName.includes('failed')) {
    // Test başarısız olduğunda gerçek logları göster
    global.console.log = global.console._log;
    global.console.error = global.console._error;
    global.console.warn = global.console._warn;
    global.console.info = global.console._info;
  }
}); 
*/ 