const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Team = require('../models/Team');
const jwt = require('jsonwebtoken');

// Test veritabanı bağlantısı
beforeAll(async () => {
    // Test veritabanı için özel bağlantı
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task-management-app-test');
});

// Her test sonrası veritabanını temizle
afterEach(async () => {
    await Team.deleteMany({});
    await User.deleteMany({});
});

// Tüm testler bitince bağlantıyı kapat
afterAll(async () => {
    await mongoose.connection.close();
});

// Yardımcı fonksiyonlar
const createTestUser = async (role = 'user', suffix = '') => {
    const user = new User({
        name: `Test User ${suffix}`,
        email: `test${suffix}@example.com`,
        username: `testuser${suffix}`,
        password: 'password123',
        role: role
    });
    
    await user.save();
    return user;
};

const createTestAdmin = async (suffix = '') => {
    return createTestUser('admin', suffix);
};

const getAuthToken = (user) => {
    return jwt.sign(
        { _id: user._id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1d' }
    );
};

const createTestTeam = async (owner) => {
    const team = new Team({
        name: 'Test Team',
        description: 'This is a test team',
        owner: owner._id,
        members: [owner._id]
    });
    
    await team.save();
    
    // Kullanıcının teams dizisini güncelle
    await User.findByIdAndUpdate(
        owner._id,
        { $addToSet: { teams: team._id } }
    );
    
    return team;
};

describe('Team API Tests', () => {
    describe('POST /api/teams', () => {
        it('Admin kullanıcı takım oluşturabilmeli', async () => {
            // Admin kullanıcı oluştur
            const admin = await createTestAdmin('1');
            const token = getAuthToken(admin);
            
            const teamData = {
                name: 'New Team',
                description: 'This is a new test team'
            };
            
            const response = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${token}`)
                .send(teamData);
                
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.name).toBe(teamData.name);
            expect(response.body.description).toBe(teamData.description);
            expect(response.body.owner.toString()).toBe(admin._id.toString());
            expect(response.body.members).toContain(admin._id.toString());
        });
        
        it('Normal kullanıcı takım oluşturamamalı', async () => {
            // Normal kullanıcı oluştur
            const user = await createTestUser('user', '2');
            const token = getAuthToken(user);
            
            const teamData = {
                name: 'New Team',
                description: 'This is a new test team'
            };
            
            const response = await request(app)
                .post('/api/teams')
                .set('Authorization', `Bearer ${token}`)
                .send(teamData);
                
            expect(response.status).toBe(403); // Yetki hatası
        });
        
        it('Kimlik doğrulaması olmadan takım oluşturamamalı', async () => {
            const teamData = {
                name: 'New Team',
                description: 'This is a new test team'
            };
            
            const response = await request(app)
                .post('/api/teams')
                .send(teamData);
                
            expect(response.status).toBe(401); // Kimlik doğrulaması hatası
        });
    });
    
    describe('GET /api/teams', () => {
        it('Tüm takımları listeleyebilmeli', async () => {
            // Kullanıcı ve takım oluştur
            const user = await createTestUser('user', '3');
            const token = getAuthToken(user);
            const admin = await createTestAdmin('4');
            await createTestTeam(admin);
            
            const response = await request(app)
                .get('/api/teams')
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
        
        it('Kimlik doğrulaması olmadan takımları listeleyememeli', async () => {
            const response = await request(app)
                .get('/api/teams');
                
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /api/teams/:id', () => {
        it('ID ile takım detaylarını görüntüleyebilmeli', async () => {
            // Kullanıcı ve takım oluştur
            const admin = await createTestAdmin('5');
            const token = getAuthToken(admin);
            const team = await createTestTeam(admin);
            
            const response = await request(app)
                .get(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.name).toBe(team.name);
            expect(response.body.description).toBe(team.description);
        });
        
        it('Var olmayan ID ile takım görüntüleyememeli', async () => {
            const user = await createTestUser('user', '6');
            const token = getAuthToken(user);
            const nonExistentId = new mongoose.Types.ObjectId();
            
            const response = await request(app)
                .get(`/api/teams/${nonExistentId}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(404);
        });
    });
    
    describe('PUT /api/teams/:id', () => {
        it('Admin kullanıcı takım bilgilerini güncelleyebilmeli', async () => {
            // Admin ve takım oluştur
            const admin = await createTestAdmin('7');
            const token = getAuthToken(admin);
            const team = await createTestTeam(admin);
            
            const updateData = {
                name: 'Updated Team Name',
                description: 'Updated team description'
            };
            
            const response = await request(app)
                .put(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);
                
            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.description).toBe(updateData.description);
        });
        
        it('Normal kullanıcı takım bilgilerini güncelleyememeli', async () => {
            // Admin, normal kullanıcı ve takım oluştur
            const admin = await createTestAdmin('8');
            const user = await createTestUser('user', '9');
            const token = getAuthToken(user);
            const team = await createTestTeam(admin);
            
            const updateData = {
                name: 'Updated Team Name',
                description: 'Updated team description'
            };
            
            const response = await request(app)
                .put(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);
                
            expect(response.status).toBe(403); // Yetki hatası
        });
    });
    
    describe('POST /api/teams/:id/members', () => {
        it('Admin kullanıcı takıma üye ekleyebilmeli', async () => {
            // Admin, normal kullanıcı ve takım oluştur
            const admin = await createTestAdmin('10');
            const adminToken = getAuthToken(admin);
            const team = await createTestTeam(admin);
            
            // Eklenecek kullanıcı
            const newUser = await User.create({
                name: 'New Member',
                email: 'member@example.com',
                username: 'member',
                password: 'password123'
            });
            
            const response = await request(app)
                .post(`/api/teams/${team._id}/members`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ userId: newUser._id });
                
            expect(response.status).toBe(200);
            
            // Takımı tekrar kontrol et
            const updatedTeam = await Team.findById(team._id);
            expect(updatedTeam.members).toContainEqual(newUser._id);
            
            // Kullanıcıyı kontrol et
            const updatedUser = await User.findById(newUser._id);
            expect(updatedUser.teams).toContainEqual(team._id);
        });
        
        it('Normal kullanıcı takıma üye ekleyememeli', async () => {
            // Admin, normal kullanıcı ve takım oluştur
            const admin = await createTestAdmin('11');
            const user = await createTestUser('user', '12');
            const userToken = getAuthToken(user);
            const team = await createTestTeam(admin);
            
            // Eklenecek kullanıcı
            const newUser = await User.create({
                name: 'New Member 2',
                email: 'member2@example.com',
                username: 'member2',
                password: 'password123'
            });
            
            const response = await request(app)
                .post(`/api/teams/${team._id}/members`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ userId: newUser._id });
                
            expect(response.status).toBe(403); // Yetki hatası
        });
    });
    
    describe('DELETE /api/teams/:id/members/:userId', () => {
        it('Admin kullanıcı takımdan üye çıkarabilmeli', async () => {
            // Admin, normal kullanıcı ve takım oluştur
            const admin = await createTestAdmin('13');
            const adminToken = getAuthToken(admin);
            
            // Eklenecek ve sonra çıkarılacak kullanıcı
            const memberUser = await User.create({
                name: 'Team Member',
                email: 'member3@example.com',
                username: 'member3',
                password: 'password123'
            });
            
            // Takım oluştur ve üye ekle
            const team = await createTestTeam(admin);
            team.members.push(memberUser._id);
            await team.save();
            
            // Kullanıcıya takımı ekle
            memberUser.teams.push(team._id);
            await memberUser.save();
            
            const response = await request(app)
                .delete(`/api/teams/${team._id}/members/${memberUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(response.status).toBe(200);
            
            // Takımı kontrol et
            const updatedTeam = await Team.findById(team._id);
            expect(updatedTeam.members).not.toContainEqual(memberUser._id);
            
            // Kullanıcıyı kontrol et
            const updatedUser = await User.findById(memberUser._id);
            expect(updatedUser.teams).not.toContainEqual(team._id);
        });
    });
    
    describe('DELETE /api/teams/:id', () => {
        it('Admin kullanıcı takımı silebilmeli', async () => {
            // Admin ve takım oluştur
            const admin = await createTestAdmin('14');
            const adminToken = getAuthToken(admin);
            const team = await createTestTeam(admin);
            
            const response = await request(app)
                .delete(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(response.status).toBe(200);
            
            // Takımın silindiğini kontrol et
            const deletedTeam = await Team.findById(team._id);
            expect(deletedTeam).toBeNull();
        });
        
        it('Normal kullanıcı takımı silememeli', async () => {
            // Admin, normal kullanıcı ve takım oluştur
            const admin = await createTestAdmin('15');
            const user = await createTestUser('user', '16');
            const userToken = getAuthToken(user);
            const team = await createTestTeam(admin);
            
            const response = await request(app)
                .delete(`/api/teams/${team._id}`)
                .set('Authorization', `Bearer ${userToken}`);
                
            expect(response.status).toBe(403); // Yetki hatası
            
            // Takımın silinmediğini kontrol et
            const existingTeam = await Team.findById(team._id);
            expect(existingTeam).not.toBeNull();
        });
    });
}); 