// Test ortamını hazırlama dosyası
require('dotenv').config({ path: '.env.test' });

// MongoDB bellek sunucusu için gerekli ayarlar (opsiyonel)
// const { MongoMemoryServer } = require('mongodb-memory-server');
// let mongod;

// MongoDB bellek sunucusunu başlat (opsiyonel)
// beforeAll(async () => {
//   mongod = await MongoMemoryServer.create();
//   process.env.MONGODB_URI_TEST = mongod.getUri();
// });

// MongoDB bellek sunucusunu kapat (opsiyonel)
// afterAll(async () => {
//   await mongod.stop();
// });

// Konsolda hata ayıklama mesajlarını gösterme
jest.setTimeout(30000); // Timeout süresini arttır

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