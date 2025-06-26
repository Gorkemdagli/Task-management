require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Mevcut verileri temizle
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    
    console.log('🧹 Existing data cleared');

    // Admin kullanıcı oluştur
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
    await adminUser.save();
    console.log('👤 Admin user created');

    // Normal kullanıcılar oluştur
    const users = [];
    const userData = [
      { username: 'john_doe', email: 'john@example.com', name: 'John Doe' },
      { username: 'jane_smith', email: 'jane@example.com', name: 'Jane Smith' },
      { username: 'bob_wilson', email: 'bob@example.com', name: 'Bob Wilson' },
      { username: 'alice_brown', email: 'alice@example.com', name: 'Alice Brown' }
    ];

    for (const userData of userData) {
      const user = new User({
        ...userData,
        password: 'password123',
        role: 'user'
      });
      await user.save();
      users.push(user);
    }
    console.log('👥 Regular users created');

    // Takımlar oluştur
    const teams = [];
    const teamData = [
      {
        name: 'Frontend Team',
        description: 'React ve UI geliştirme takımı',
        owner: users[0]._id,
        members: [users[0]._id, users[1]._id]
      },
      {
        name: 'Backend Team',
        description: 'API ve server geliştirme takımı',
        owner: users[1]._id,
        members: [users[1]._id, users[2]._id, users[3]._id]
      },
      {
        name: 'DevOps Team',
        description: 'Deployment ve infrastructure takımı',
        owner: users[2]._id,
        members: [users[2]._id, users[3]._id]
      }
    ];

    for (const teamData of teamData) {
      const team = new Team(teamData);
      await team.save();
      teams.push(team);
    }
    console.log('🏢 Teams created');

    // Görevler oluştur
    const taskData = [
      {
        title: 'Login sayfası tasarımı',
        description: 'Kullanıcı girişi için modern ve responsive tasarım',
        status: 'doing',
        priority: 'high',
        assignees: [users[0]._id],
        creator: users[1]._id,
        team: teams[0]._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 hafta sonra
      },
      {
        title: 'User API endpoints',
        description: 'Kullanıcı CRUD işlemleri için API endpoint\'leri',
        status: 'done',
        priority: 'high',
        assignees: [users[1]._id, users[2]._id],
        creator: users[1]._id,
        team: teams[1]._id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 gün önce
      },
      {
        title: 'Database migration',
        description: 'MongoDB koleksiyonları için migration scriptleri',
        status: 'todo',
        priority: 'medium',
        assignees: [users[2]._id],
        creator: users[2]._id,
        team: teams[1]._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 2 hafta sonra
      },
      {
        title: 'CI/CD pipeline kurulumu',
        description: 'GitHub Actions ile otomatik deployment',
        status: 'todo',
        priority: 'medium',
        assignees: [users[3]._id],
        creator: users[2]._id,
        team: teams[2]._id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 gün sonra
      },
      {
        title: 'Dashboard component',
        description: 'Ana sayfa için dashboard bileşeni',
        status: 'doing',
        priority: 'high',
        assignees: [users[0]._id, users[1]._id],
        creator: users[0]._id,
        team: teams[0]._id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 gün sonra
      }
    ];

    for (const taskData of taskData) {
      const task = new Task(taskData);
      await task.save();
    }
    console.log('📋 Tasks created');

    // Kullanıcıları takımlara ekle
    for (const user of users) {
      const userTeams = teams.filter(team => 
        team.members.some(member => member.toString() === user._id.toString())
      );
      user.teams = userTeams.map(team => team._id);
      await user.save();
    }
    console.log('🔗 Users linked to teams');

    console.log('\n✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users: ${users.length + 1} (including admin)`);
    console.log(`🏢 Teams: ${teams.length}`);
    console.log(`📋 Tasks: ${taskData.length}`);
    
    console.log('\n🔐 Login credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Users: john@example.com / password123 (and others)');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

const run = async () => {
  await connectDB();
  await seedData();
};

run(); 