const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');

// Test veritabanı bağlantısı
beforeAll(async () => {
    // Test veritabanı için özel bağlantı
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/task-management-app-test');
});

// Her test sonrası veritabanını temizle
afterEach(async () => {
    await Task.deleteMany({});
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

const createTestTask = async (creator, team) => {
    const task = new Task({
        title: 'Test Task',
        description: 'This is a test task',
        status: 'todo',
        priority: 'medium',
        creator: creator._id,
        team: team._id,
        assignees: [creator._id]
    });
    
    await task.save();
    return task;
};

describe('Task API Tests', () => {
    describe('POST /api/tasks', () => {
        it('Kullanıcı görev oluşturabilmeli', async () => {
            // Kullanıcı ve takım oluştur
            const user = await createTestAdmin('t1'); // Admin kullanıcı oluştur
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            
            const taskData = {
                title: 'New Task',
                description: 'This is a new test task',
                status: 'todo',
                priority: 'high',
                teamId: team._id
            };
            
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskData);
                
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.title).toBe(taskData.title);
            expect(response.body.description).toBe(taskData.description);
            expect(response.body.status).toBe(taskData.status);
            expect(response.body.priority).toBe(taskData.priority);
            expect(response.body.creator.toString()).toBe(user._id.toString());
        });
        
        it('Kimlik doğrulaması olmadan görev oluşturamamalı', async () => {
            const admin = await createTestAdmin('t3');
            const team = await createTestTeam(admin);
            
            const taskData = {
                title: 'New Task',
                description: 'This is a new test task',
                status: 'todo',
                priority: 'high',
                teamId: team._id
            };
            
            const response = await request(app)
                .post('/api/tasks')
                .send(taskData);
                
            expect(response.status).toBe(401); // Kimlik doğrulaması hatası
        });
        
        it('Üye olmadığı takım için görev oluşturamamalı', async () => {
            // Kullanıcı ve takım oluştur
            const user = await createTestUser('user', 't4');
            const token = getAuthToken(user);
            const admin = await createTestAdmin('t5');
            const team = await createTestTeam(admin);
            
            // Kullanıcı takıma eklenmiyor
            
            const taskData = {
                title: 'New Task',
                description: 'This is a new test task',
                status: 'todo',
                priority: 'high',
                teamId: team._id
            };
            
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send(taskData);
                
            expect(response.status).toBe(403); // Yetki hatası
        });
    });
    
    describe('GET /api/tasks', () => {
        it('Kullanıcı görevleri listeleyebilmeli', async () => {
            // Kullanıcı, takım ve görev oluştur
            const user = await createTestUser('user', 't6');
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            await createTestTask(user, team);
            
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
        
        it('Takım filtresine göre görevleri listeleyebilmeli', async () => {
            // Kullanıcı, takım ve görev oluştur
            const user = await createTestUser('user', 't7');
            const token = getAuthToken(user);
            const team1 = await createTestTeam(user);
            const team2 = await createTestTeam(user);
            
            await createTestTask(user, team1);
            await createTestTask(user, team1);
            await createTestTask(user, team2);
            
            const response = await request(app)
                .get(`/api/tasks?teamId=${team1._id}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2);
            expect(response.body[0].team.toString()).toBe(team1._id.toString());
        });
        
        it('Kimlik doğrulaması olmadan görevleri listeleyememeli', async () => {
            const response = await request(app)
                .get('/api/tasks');
                
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /api/tasks/:id', () => {
        it('ID ile görev detaylarını görüntüleyebilmeli', async () => {
            // Kullanıcı, takım ve görev oluştur
            const user = await createTestUser('user', 't8');
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            const task = await createTestTask(user, team);
            
            const response = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('_id');
            expect(response.body.title).toBe(task.title);
            expect(response.body.description).toBe(task.description);
        });
        
        it('Var olmayan ID ile görev görüntüleyememeli', async () => {
            const user = await createTestUser('user', 't9');
            const token = getAuthToken(user);
            const nonExistentId = new mongoose.Types.ObjectId();
            
            const response = await request(app)
                .get(`/api/tasks/${nonExistentId}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(404);
        });
    });
    
    describe('PUT /api/tasks/:id', () => {
        it('Görev oluşturan kullanıcı görevi güncelleyebilmeli', async () => {
            // Admin kullanıcı, takım ve görev oluştur
            const user = await createTestAdmin('t10'); // Admin kullanıcı oluştur
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            const task = await createTestTask(user, team);
            
            const updateData = {
                title: 'Updated Task',
                description: 'Updated task description',
                priority: 'low'
            };
            
            const response = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);
                
            expect(response.status).toBe(200);
            expect(response.body.title).toBe(updateData.title);
            expect(response.body.description).toBe(updateData.description);
            expect(response.body.priority).toBe(updateData.priority);
        });
        
        it('Takım üyesi olunmayan görevi güncelleyememeli', async () => {
            // İki farklı kullanıcı ve takım oluştur
            const user1 = await createTestUser('user', 't11');
            const user2 = await User.create({
                name: 'User 2',
                email: 'user2@example.com',
                username: 'user2',
                password: 'password123'
            });
            
            const token2 = getAuthToken(user2);
            const team1 = await createTestTeam(user1);
            const task = await createTestTask(user1, team1);
            
            const updateData = {
                title: 'Unauthorized Update',
                description: 'This should fail'
            };
            
            const response = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token2}`)
                .send(updateData);
                
            expect(response.status).toBe(403); // Yetki hatası
        });
    });
    
    describe('PUT /api/tasks/:id/status', () => {
        it('Görev durumunu güncelleyebilmeli', async () => {
            // Kullanıcı, takım ve görev oluştur
            const user = await createTestUser('user', 't12');
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            const task = await createTestTask(user, team);
            
            const updateData = {
                status: 'done'
            };
            
            const response = await request(app)
                .put(`/api/tasks/${task._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send(updateData);
                
            expect(response.status).toBe(200);
            expect(response.body.status).toBe(updateData.status);
        });
    });
    
    describe('DELETE /api/tasks/:id', () => {
        it('Görev oluşturan kullanıcı görevi silebilmeli', async () => {
            // Admin kullanıcı, takım ve görev oluştur
            const user = await createTestAdmin('t13'); // Admin kullanıcı oluştur
            const token = getAuthToken(user);
            const team = await createTestTeam(user);
            const task = await createTestTask(user, team);
            
            const response = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);
                
            expect(response.status).toBe(200);
            
            // Görevin silindiğini kontrol et
            const deletedTask = await Task.findById(task._id);
            expect(deletedTask).toBeNull();
        });
        
        it('Admin kullanıcı her görevi silebilmeli', async () => {
            // Normal kullanıcı, admin ve görev oluştur
            const user = await createTestUser('user', 't14');
            const admin = await createTestAdmin('t15');
            const adminToken = getAuthToken(admin);
            const team = await createTestTeam(user);
            const task = await createTestTask(user, team);
            
            const response = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${adminToken}`);
                
            expect(response.status).toBe(200);
            
            // Görevin silindiğini kontrol et
            const deletedTask = await Task.findById(task._id);
            expect(deletedTask).toBeNull();
        });
        
        it('Başka kullanıcının görevini silememeli', async () => {
            // İki farklı kullanıcı ve takım oluştur
            const user1 = await createTestUser('user', 't16');
            const user2 = await User.create({
                name: 'User 2 test',
                email: 'user2test@example.com',
                username: 'user2test',
                password: 'password123'
            });
            
            const token2 = getAuthToken(user2);
            const team1 = await createTestTeam(user1);
            const task = await createTestTask(user1, team1);
            
            const response = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token2}`);
                
            expect(response.status).toBe(403); // Yetki hatası
            
            // Görevin silinmediğini kontrol et
            const existingTask = await Task.findById(task._id);
            expect(existingTask).not.toBeNull();
        });
    });
}); 