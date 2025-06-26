const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Test veritabanı bağlantısı
beforeAll(async () => {
    // Test veritabanı için özel bağlantı
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task-management-app-test');
});

// Her test sonrası veritabanını temizle
afterEach(async () => {
    await User.deleteMany({});
});

// Tüm testler bitince bağlantıyı kapat
afterAll(async () => {
    await mongoose.connection.close();
});

// Yardımcı fonksiyonlar
const createTestUser = async (suffix = '') => {
    const user = new User({
        name: `Test User ${suffix}`,
        email: `test${suffix}@example.com`,
        username: `testuser${suffix}`,
        password: 'password123',
        role: 'user'
    });
    
    await user.save();
    return user;
};

const getAuthToken = (user) => {
    return jwt.sign(
        { _id: user._id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
    );
};

describe('User API Tests', () => {
    describe('POST /api/users/register', () => {
        it('Yeni kullanıcı kaydı yapabilmeli', async () => {
            const userData = {
                name: 'New User',
                email: 'newuser@example.com',
                username: 'newuser',
                password: 'password123'
            };
            
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);
                
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.email).toBe(userData.email);
            expect(response.body.name).toBe(userData.name);
            expect(response.body).not.toHaveProperty('password'); // Şifre dönmemeli
        });
        
        it('Geçersiz veri ile kullanıcı kaydı yapamamalı', async () => {
            // Eksik veri ile kayıt
            const userData = {
                name: 'Invalid User',
                // email eksik
                username: 'invaliduser',
                password: 'password123'
            };
            
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);
                
            expect(response.status).toBe(400);
        });
        
        it('Var olan email ile kayıt yapamamalı', async () => {
            // Önce kullanıcı oluştur
            await createTestUser('u1');
            
            // Aynı email ile yeni kayıt dene
            const userData = {
                name: 'Duplicate User',
                email: 'testu1@example.com', // var olan email
                username: 'duplicateuser',
                password: 'password123'
            };
            
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);
                
            expect(response.status).toBe(400);
        });
    });
    
    describe('POST /api/users/login', () => {
        it('Doğru bilgilerle giriş yapabilmeli', async () => {
            // Önce kullanıcı oluştur
            const user = await createTestUser('u2');
            
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'testu2@example.com',
                    password: 'password123'
                });
                
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(user.email);
        });
        
        it('Yanlış şifre ile giriş yapamamalı', async () => {
            // Önce kullanıcı oluştur
            await createTestUser('u3');
            
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'testu3@example.com',
                    password: 'wrongpassword'
                });
                
            expect(response.status).toBe(401);
        });
        
        it('Var olmayan kullanıcı ile giriş yapamamalı', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });
                
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /api/users/profile', () => {
        it('Kimlik doğrulaması ile profil görüntüleyebilmeli', async () => {
            // Kullanıcı oluştur ve token al
            const user = await createTestUser('u4');
            const token = getAuthToken(user);
            
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.email).toBe(user.email);
            expect(response.body.name).toBe(user.name);
        });
        
        it('Kimlik doğrulaması olmadan profil görüntüleyememeli', async () => {
            const response = await request(app)
                .get('/api/users/profile');
                
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /api/users/teams', () => {
        it('Kullanıcının takımlarını listeleyebilmeli', async () => {
            // Kullanıcı oluştur ve token al
            const user = await createTestUser('u5');
            const token = getAuthToken(user);
            
            const response = await request(app)
                .get('/api/users/teams')
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        
        it('Kimlik doğrulaması olmadan takımları listeleyememeli', async () => {
            const response = await request(app)
                .get('/api/users/teams');
                
            expect(response.status).toBe(401);
        });
    });
}); 