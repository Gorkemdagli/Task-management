require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const pageRoutes = require('./routes/pageRoutes');
const swaggerRoutes = require('./routes/swaggerRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Page Routes
app.use('/', pageRoutes);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);

// Swagger UI - Route yönlendirmesi
app.use('/api-docs', swaggerRoutes);

// 404 hatası için
app.use(notFoundHandler);

// Global hata yakalama middleware
app.use(errorHandler);

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-management-app');
      console.log('MongoDB bağlantısı başarılı');
    }
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err);
    process.exit(1);
  }
};

// Port dinleme
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor`);
      console.log(`Swagger dokümantasyonu: http://localhost:${PORT}/api-docs`);
    });
  });
}

module.exports = app; 